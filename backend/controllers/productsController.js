const pool = require('../db');

let ensureProductCategoriesTablePromise = null;
let productsCache = {
    data: [],
    expiresAt: 0,
};

const PRODUCTS_CACHE_TTL_MS = Number(process.env.PRODUCTS_CACHE_TTL_MS || 1000 * 60 * 10);
const PRODUCT_CATALOG_RECOVERY_MESSAGE = 'Product catalog temporarily unavailable while the database connection recovers. Your products are not deleted. Please try again shortly.';

const normalizeOptionalText = (value) => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    const trimmed = String(value).trim();
    return trimmed ? trimmed : null;
};

const normalizePrice = (value) => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    const normalized = Number(String(value).replace(/[^0-9.-]/g, ''));
    return Number.isNaN(normalized) ? NaN : normalized;
};

const normalizeMinOrderWeight = (value) => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    const normalized = Number(String(value).replace(/[^0-9.-]/g, ''));
    return Number.isNaN(normalized) ? NaN : normalized;
};

const normalizeInteger = (value) => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    const normalized = Number(String(value).replace(/[^0-9-]/g, ''));
    return Number.isNaN(normalized) ? NaN : Math.trunc(normalized);
};

const normalizeBoolean = (value, fallback = false) => {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    const normalized = String(value).trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
        return true;
    }

    if (['false', '0', 'no', 'off'].includes(normalized)) {
        return false;
    }

    return fallback;
};

const normalizeImageList = (value, imageUrl = null) => {
    const values = [];

    if (Array.isArray(value)) {
        values.push(...value);
    } else if (typeof value === 'string' && value.trim()) {
        values.push(...value.split(/[\r\n,]+/));
    }

    if (imageUrl) {
        values.unshift(imageUrl);
    }

    return [...new Set(values.map((item) => String(item || '').trim()).filter(Boolean))];
};

const generateSlug = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || null;

const normalizeCategoryIds = (categoryIds, fallbackCategoryId = null) => {
    const values = [];

    if (fallbackCategoryId) {
        values.push(fallbackCategoryId);
    }

    if (Array.isArray(categoryIds)) {
        values.push(...categoryIds);
    } else if (categoryIds) {
        values.push(categoryIds);
    }

    return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
};

const ensureProductCategoriesTable = async () => {
    if (!ensureProductCategoriesTablePromise) {
        ensureProductCategoriesTablePromise = pool.query(`
            CREATE TABLE IF NOT EXISTS product_categories (
                id BIGSERIAL PRIMARY KEY,
                product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (product_id, category_id)
            );

            INSERT INTO product_categories (product_id, category_id)
            SELECT id, category_id
            FROM products
            WHERE category_id IS NOT NULL
            ON CONFLICT (product_id, category_id) DO NOTHING;
        `).catch((error) => {
            ensureProductCategoriesTablePromise = null;
            throw error;
        });
    }

    return ensureProductCategoriesTablePromise;
};

const syncProductCategories = async (client, productId, categoryIds) => {
    await ensureProductCategoriesTable();
    await client.query('DELETE FROM product_categories WHERE product_id = $1', [productId]);

    for (const categoryId of categoryIds) {
        await client.query(
            `INSERT INTO product_categories (product_id, category_id)
             VALUES ($1, $2)
             ON CONFLICT (product_id, category_id) DO NOTHING`,
            [productId, categoryId],
        );
    }
};

const hasProductsCache = () =>
    Array.isArray(productsCache.data) &&
    productsCache.data.length > 0;

const updateProductsCache = (products) => {
    productsCache = {
        data: Array.isArray(products) ? products : [],
        expiresAt: Date.now() + PRODUCTS_CACHE_TTL_MS,
    };

    return productsCache.data;
};

const invalidateProductsCache = () => {
    productsCache = {
        data: [],
        expiresAt: 0,
    };
};

const sendProductsResponse = (res, products, source) => {
    res.set('X-Catalog-Source', source);
    return res.json(products);
};

exports.getProducts = async (req, res) => {
    try {
        await ensureProductCategoriesTable();

        const appName = normalizeOptionalText(req.query?.app_name);
        const storefrontKey = normalizeOptionalText(req.query?.storefront_key);
        const filters = [];
        const values = [];

        if (appName) {
            values.push(appName);
            filters.push(`COALESCE(p.app_name, 'Felix Store') = $${values.length}`);
        }

        if (storefrontKey) {
            values.push(storefrontKey);
            filters.push(`COALESCE(p.storefront_key, 'felix-store') = $${values.length}`);
        }

        const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

        const result = await pool.query(`
            SELECT
                p.*,
                COALESCE(
                    category_map.category_ids,
                    CASE
                        WHEN p.category_id IS NOT NULL THEN ARRAY[p.category_id::text]
                        ELSE ARRAY[]::text[]
                    END
                ) AS category_ids,
                COALESCE(
                    category_map.category_names,
                    CASE
                        WHEN primary_category.name IS NOT NULL THEN ARRAY[primary_category.name]
                        ELSE ARRAY[]::text[]
                    END
                ) AS category_names
            FROM products p
            LEFT JOIN categories primary_category ON primary_category.id = p.category_id
            LEFT JOIN (
                SELECT
                    mapping.product_id,
                    ARRAY_AGG(mapping.category_id ORDER BY mapping.category_name, mapping.category_id) AS category_ids,
                    ARRAY_AGG(mapping.category_name ORDER BY mapping.category_name, mapping.category_id) AS category_names
                FROM (
                    SELECT DISTINCT
                        pc.product_id,
                        pc.category_id::text AS category_id,
                        COALESCE(c.name, pc.category_id::text) AS category_name
                    FROM product_categories pc
                    LEFT JOIN categories c ON c.id = pc.category_id
                ) AS mapping
                GROUP BY mapping.product_id
            ) AS category_map ON category_map.product_id = p.id
            ${whereClause}
            ORDER BY p.created_at DESC, p.name ASC
        `, values);

        const products = updateProductsCache(result.rows);
        return sendProductsResponse(res, products, 'database');
    } catch (err) {
        console.error('Product catalog query failed:', err);

        if (hasProductsCache()) {
            console.warn('Serving last known real product catalog after database failure.');
            return sendProductsResponse(res, productsCache.data, 'stale-cache');
        }

        res.set('X-Catalog-Source', 'unavailable');
        res.set('Retry-After', '120');
        return res.status(503).json({
            code: 'catalog_temporarily_unavailable',
            message: PRODUCT_CATALOG_RECOVERY_MESSAGE,
        });
    }
};

exports.addProduct = async (req, res) => {
    const {
        name,
        description,
        short_description,
        long_description,
        slug,
        price,
        compare_at_price,
        category_id,
        category_ids,
        type,
        price_type,
        unit,
        min_order_weight,
        subscription_interval,
        action_label,
        image_url,
        images,
        download_url,
        featured,
        active,
        inventory_count,
        stock,
        app_name,
        storefront_key,
    } = req.body;

    const normalizedPrice = normalizePrice(price);
    const normalizedCompareAtPrice = normalizePrice(compare_at_price);
    const normalizedMinOrderWeight = normalizeMinOrderWeight(min_order_weight);
    const normalizedInventoryCount = normalizeInteger(inventory_count ?? stock);
    const resolvedCategoryIds = normalizeCategoryIds(category_ids, category_id);
    const primaryCategoryId = resolvedCategoryIds[0] || null;
    const normalizedDescription = normalizeOptionalText(description);
    const normalizedShortDescription = normalizeOptionalText(short_description) || normalizedDescription;
    const normalizedLongDescription = normalizeOptionalText(long_description) || normalizedDescription || normalizedShortDescription;
    const normalizedImageUrl = normalizeOptionalText(image_url);
    const normalizedImages = normalizeImageList(images, normalizedImageUrl);
    const productName = String(name || '').trim();
    const normalizedSlug = normalizeOptionalText(slug) || generateSlug(productName);

    if (!productName) {
        return res.status(400).send('Product name is required');
    }

    if (!resolvedCategoryIds.length) {
        return res.status(400).send('At least one category is required');
    }

    if (price !== '' && price !== null && price !== undefined && Number.isNaN(normalizedPrice)) {
        return res.status(400).send('Invalid price');
    }

    if (compare_at_price !== '' && compare_at_price !== null && compare_at_price !== undefined && Number.isNaN(normalizedCompareAtPrice)) {
        return res.status(400).send('Invalid compare-at price');
    }

    if (
        min_order_weight !== '' &&
        min_order_weight !== null &&
        min_order_weight !== undefined &&
        Number.isNaN(normalizedMinOrderWeight)
    ) {
        return res.status(400).send('Invalid minimum order weight');
    }

    if (
        inventory_count !== '' &&
        inventory_count !== null &&
        inventory_count !== undefined &&
        Number.isNaN(normalizedInventoryCount)
    ) {
        return res.status(400).send('Invalid inventory count');
    }

    const client = await pool.connect();

    try {
        await ensureProductCategoriesTable();
        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO products (
                name,
                description,
                short_description,
                long_description,
                slug,
                price,
                compare_at_price,
                category_id,
                type,
                price_type,
                unit,
                min_order_weight,
                subscription_interval,
                action_label,
                image_url,
                images,
                download_url,
                featured,
                active,
                inventory_count,
                stock,
                app_name,
                storefront_key
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17,$18,$19,$20,$21,$22,$23)
            RETURNING *`,
            [
                productName,
                normalizedDescription || normalizedShortDescription || normalizedLongDescription,
                normalizedShortDescription,
                normalizedLongDescription,
                normalizedSlug,
                normalizedPrice,
                normalizedCompareAtPrice,
                primaryCategoryId,
                normalizeOptionalText(type) || 'service',
                normalizeOptionalText(price_type) || 'fixed',
                normalizeOptionalText(unit),
                normalizedMinOrderWeight,
                normalizeOptionalText(subscription_interval),
                normalizeOptionalText(action_label),
                normalizedImageUrl,
                JSON.stringify(normalizedImages),
                normalizeOptionalText(download_url),
                normalizeBoolean(featured, false),
                normalizeBoolean(active, true),
                normalizedInventoryCount,
                normalizedInventoryCount,
                normalizeOptionalText(app_name),
                normalizeOptionalText(storefront_key)
            ]
        );

        const product = result.rows[0];
        await syncProductCategories(client, product.id, resolvedCategoryIds);
        await client.query('COMMIT');
        invalidateProductsCache();

        res.json({
            ...product,
            category_id: primaryCategoryId,
            category_ids: resolvedCategoryIds,
        });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => { });
        console.error(err);
        res.status(500).send('Error adding product');
    } finally {
        client.release();
    }
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const {
        name,
        description,
        short_description,
        long_description,
        slug,
        price,
        compare_at_price,
        category_id,
        category_ids,
        type,
        price_type,
        unit,
        min_order_weight,
        subscription_interval,
        action_label,
        image_url,
        images,
        download_url,
        featured,
        active,
        inventory_count,
        stock,
        app_name,
        storefront_key,
    } = req.body;

    const normalizedPrice = normalizePrice(price);
    const normalizedCompareAtPrice = normalizePrice(compare_at_price);
    const normalizedMinOrderWeight = normalizeMinOrderWeight(min_order_weight);
    const normalizedInventoryCount = normalizeInteger(inventory_count ?? stock);
    const resolvedCategoryIds = normalizeCategoryIds(category_ids, category_id);
    const primaryCategoryId = resolvedCategoryIds[0] || null;
    const normalizedDescription = normalizeOptionalText(description);
    const normalizedShortDescription = normalizeOptionalText(short_description) || normalizedDescription;
    const normalizedLongDescription = normalizeOptionalText(long_description) || normalizedDescription || normalizedShortDescription;
    const normalizedImageUrl = normalizeOptionalText(image_url);
    const normalizedImages = normalizeImageList(images, normalizedImageUrl);
    const productName = String(name || '').trim();
    const normalizedSlug = normalizeOptionalText(slug) || generateSlug(productName);

    if (!productName) {
        return res.status(400).send('Product name is required');
    }

    if (!resolvedCategoryIds.length) {
        return res.status(400).send('At least one category is required');
    }

    if (price !== '' && price !== null && price !== undefined && Number.isNaN(normalizedPrice)) {
        return res.status(400).send('Invalid price');
    }

    if (compare_at_price !== '' && compare_at_price !== null && compare_at_price !== undefined && Number.isNaN(normalizedCompareAtPrice)) {
        return res.status(400).send('Invalid compare-at price');
    }

    if (
        min_order_weight !== '' &&
        min_order_weight !== null &&
        min_order_weight !== undefined &&
        Number.isNaN(normalizedMinOrderWeight)
    ) {
        return res.status(400).send('Invalid minimum order weight');
    }

    if (
        inventory_count !== '' &&
        inventory_count !== null &&
        inventory_count !== undefined &&
        Number.isNaN(normalizedInventoryCount)
    ) {
        return res.status(400).send('Invalid inventory count');
    }

    const client = await pool.connect();

    try {
        await ensureProductCategoriesTable();
        await client.query('BEGIN');

        const result = await client.query(
            `UPDATE products
             SET name=$1,
                 description=$2,
                 short_description=$3,
                 long_description=$4,
                 slug=$5,
                 price=$6,
                 compare_at_price=$7,
                 category_id=$8,
                 type=$9,
                 price_type=$10,
                 unit=$11,
                 min_order_weight=$12,
                 subscription_interval=$13,
                 action_label=$14,
                 image_url=$15,
                 images=$16::jsonb,
                 download_url=$17,
                 featured=$18,
                 active=$19,
                 inventory_count=$20,
                 stock=$21,
                 app_name=$22,
                 storefront_key=$23
             WHERE id=$24
             RETURNING *`,
            [
                productName,
                normalizedDescription || normalizedShortDescription || normalizedLongDescription,
                normalizedShortDescription,
                normalizedLongDescription,
                normalizedSlug,
                normalizedPrice,
                normalizedCompareAtPrice,
                primaryCategoryId,
                normalizeOptionalText(type) || 'service',
                normalizeOptionalText(price_type) || 'fixed',
                normalizeOptionalText(unit),
                normalizedMinOrderWeight,
                normalizeOptionalText(subscription_interval),
                normalizeOptionalText(action_label),
                normalizedImageUrl,
                JSON.stringify(normalizedImages),
                normalizeOptionalText(download_url),
                normalizeBoolean(featured, false),
                normalizeBoolean(active, true),
                normalizedInventoryCount,
                normalizedInventoryCount,
                normalizeOptionalText(app_name),
                normalizeOptionalText(storefront_key),
                id
            ]
        );

        const product = result.rows[0];
        await syncProductCategories(client, id, resolvedCategoryIds);
        await client.query('COMMIT');
        invalidateProductsCache();

        res.json({
            ...product,
            category_id: primaryCategoryId,
            category_ids: resolvedCategoryIds,
        });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => { });
        console.error(err);
        res.status(500).send('Error updating product');
    } finally {
        client.release();
    }
};

exports.deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        await ensureProductCategoriesTable();
        await pool.query('DELETE FROM products WHERE id=$1', [id]);
        invalidateProductsCache();
        res.send('Product deleted');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting product');
    }
};
