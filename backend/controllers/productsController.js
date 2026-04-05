const pool = require('../db');
const fallbackCatalog = require('../data/fallbackCatalog');

let ensureProductCategoriesTablePromise = null;
let productsCache = {
    data: Array.isArray(fallbackCatalog) ? fallbackCatalog : [],
    expiresAt: 0,
};

const PRODUCTS_CACHE_TTL_MS = Number(process.env.PRODUCTS_CACHE_TTL_MS || 1000 * 60 * 10);

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

const hasFreshProductsCache = () =>
    Array.isArray(productsCache.data) &&
    productsCache.data.length > 0 &&
    productsCache.expiresAt > Date.now();

const updateProductsCache = (products) => {
    productsCache = {
        data: Array.isArray(products) ? products : [],
        expiresAt: Date.now() + PRODUCTS_CACHE_TTL_MS,
    };

    return productsCache.data;
};

const sendProductsResponse = (res, products, source) => {
    res.set('X-Catalog-Source', source);
    return res.json(products);
};

exports.getProducts = async (_req, res) => {
    if (hasFreshProductsCache()) {
        return sendProductsResponse(res, productsCache.data, 'cache');
    }

    try {
        await ensureProductCategoriesTable();

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
            ORDER BY p.created_at DESC, p.name ASC
        `);

        const products = updateProductsCache(result.rows);
        return sendProductsResponse(res, products, 'database');
    } catch (err) {
        console.error('Product catalog query failed:', err);

        if (Array.isArray(productsCache.data) && productsCache.data.length > 0) {
            console.warn('Serving cached product catalog after database failure.');
            return sendProductsResponse(res, productsCache.data, 'fallback-cache');
        }

        console.warn('Serving bundled fallback catalog after database failure.');
        return sendProductsResponse(res, fallbackCatalog, 'bundled-fallback');
    }
};

exports.addProduct = async (req, res) => {
    const {
        name,
        description,
        price,
        category_id,
        category_ids,
        type,
        price_type,
        unit,
        min_order_weight,
        subscription_interval,
        action_label,
        image_url,
        download_url
    } = req.body;

    const normalizedPrice = normalizePrice(price);
    const normalizedMinOrderWeight = normalizeMinOrderWeight(min_order_weight);
    const resolvedCategoryIds = normalizeCategoryIds(category_ids, category_id);
    const primaryCategoryId = resolvedCategoryIds[0] || null;

    if (!name || !name.trim()) {
        return res.status(400).send('Product name is required');
    }

    if (!resolvedCategoryIds.length) {
        return res.status(400).send('At least one category is required');
    }

    if (price !== '' && price !== null && price !== undefined && Number.isNaN(normalizedPrice)) {
        return res.status(400).send('Invalid price');
    }

    if (
        min_order_weight !== '' &&
        min_order_weight !== null &&
        min_order_weight !== undefined &&
        Number.isNaN(normalizedMinOrderWeight)
    ) {
        return res.status(400).send('Invalid minimum order weight');
    }

    const client = await pool.connect();

    try {
        await ensureProductCategoriesTable();
        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO products (
                name,
                description,
                price,
                category_id,
                type,
                price_type,
                unit,
                min_order_weight,
                subscription_interval,
                action_label,
                image_url,
                download_url
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            RETURNING *`,
            [
                name.trim(),
                normalizeOptionalText(description),
                normalizedPrice,
                primaryCategoryId,
                normalizeOptionalText(type) || 'service',
                normalizeOptionalText(price_type) || 'fixed',
                normalizeOptionalText(unit),
                normalizedMinOrderWeight,
                normalizeOptionalText(subscription_interval),
                normalizeOptionalText(action_label),
                normalizeOptionalText(image_url),
                normalizeOptionalText(download_url)
            ]
        );

        const product = result.rows[0];
        await syncProductCategories(client, product.id, resolvedCategoryIds);
        await client.query('COMMIT');

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
        price,
        category_id,
        category_ids,
        type,
        price_type,
        unit,
        min_order_weight,
        subscription_interval,
        action_label,
        image_url,
        download_url
    } = req.body;

    const normalizedPrice = normalizePrice(price);
    const normalizedMinOrderWeight = normalizeMinOrderWeight(min_order_weight);
    const resolvedCategoryIds = normalizeCategoryIds(category_ids, category_id);
    const primaryCategoryId = resolvedCategoryIds[0] || null;

    if (!name || !name.trim()) {
        return res.status(400).send('Product name is required');
    }

    if (!resolvedCategoryIds.length) {
        return res.status(400).send('At least one category is required');
    }

    if (price !== '' && price !== null && price !== undefined && Number.isNaN(normalizedPrice)) {
        return res.status(400).send('Invalid price');
    }

    if (
        min_order_weight !== '' &&
        min_order_weight !== null &&
        min_order_weight !== undefined &&
        Number.isNaN(normalizedMinOrderWeight)
    ) {
        return res.status(400).send('Invalid minimum order weight');
    }

    const client = await pool.connect();

    try {
        await ensureProductCategoriesTable();
        await client.query('BEGIN');

        const result = await client.query(
            `UPDATE products
             SET name=$1,
                 description=$2,
                 price=$3,
                 category_id=$4,
                 type=$5,
                 price_type=$6,
                 unit=$7,
                 min_order_weight=$8,
                 subscription_interval=$9,
                 action_label=$10,
                 image_url=$11,
                 download_url=$12
             WHERE id=$13
             RETURNING *`,
            [
                name.trim(),
                normalizeOptionalText(description),
                normalizedPrice,
                primaryCategoryId,
                normalizeOptionalText(type) || 'service',
                normalizeOptionalText(price_type) || 'fixed',
                normalizeOptionalText(unit),
                normalizedMinOrderWeight,
                normalizeOptionalText(subscription_interval),
                normalizeOptionalText(action_label),
                normalizeOptionalText(image_url),
                normalizeOptionalText(download_url),
                id
            ]
        );

        const product = result.rows[0];
        await syncProductCategories(client, id, resolvedCategoryIds);
        await client.query('COMMIT');

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
        res.send('Product deleted');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting product');
    }
};
