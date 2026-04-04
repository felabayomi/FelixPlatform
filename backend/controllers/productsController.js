const pool = require('../db');

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

exports.getProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC, name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching products');
    }
};

exports.addProduct = async (req, res) => {
    const {
        name,
        description,
        price,
        category_id,
        type,
        price_type,
        unit,
        min_order_weight,
        subscription_interval,
        image_url,
        download_url
    } = req.body;

    const normalizedPrice = normalizePrice(price);
    const normalizedMinOrderWeight = normalizeMinOrderWeight(min_order_weight);

    if (!name || !name.trim()) {
        return res.status(400).send('Product name is required');
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

    try {
        const result = await pool.query(
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
                image_url,
                download_url
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING *`,
            [
                name.trim(),
                normalizeOptionalText(description),
                normalizedPrice,
                category_id || null,
                normalizeOptionalText(type) || 'service',
                normalizeOptionalText(price_type) || 'fixed',
                normalizeOptionalText(unit),
                normalizedMinOrderWeight,
                normalizeOptionalText(subscription_interval),
                normalizeOptionalText(image_url),
                normalizeOptionalText(download_url)
            ]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding product');
    }
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const {
        name,
        description,
        price,
        category_id,
        type,
        price_type,
        unit,
        min_order_weight,
        subscription_interval,
        image_url,
        download_url
    } = req.body;

    const normalizedPrice = normalizePrice(price);
    const normalizedMinOrderWeight = normalizeMinOrderWeight(min_order_weight);

    if (!name || !name.trim()) {
        return res.status(400).send('Product name is required');
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

    try {
        const result = await pool.query(
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
                 image_url=$10,
                 download_url=$11
             WHERE id=$12
             RETURNING *`,
            [
                name.trim(),
                normalizeOptionalText(description),
                normalizedPrice,
                category_id || null,
                normalizeOptionalText(type) || 'service',
                normalizeOptionalText(price_type) || 'fixed',
                normalizeOptionalText(unit),
                normalizedMinOrderWeight,
                normalizeOptionalText(subscription_interval),
                normalizeOptionalText(image_url),
                normalizeOptionalText(download_url),
                id
            ]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating product');
    }
};

exports.deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM products WHERE id=$1', [id]);
        res.send('Product deleted');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting product');
    }
};
