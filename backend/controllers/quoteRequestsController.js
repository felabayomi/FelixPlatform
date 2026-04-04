const pool = require('../db');

const toNullableText = (value) => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    const trimmed = String(value).trim();
    return trimmed ? trimmed : null;
};

const toNullableNumber = (value) => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    const normalized = Number(String(value).replace(/[^0-9.-]/g, ''));
    return Number.isNaN(normalized) ? NaN : normalized;
};

const getDetailValue = (details, label) => {
    const text = String(details || '');
    const prefix = `${label.toLowerCase()}:`;
    const matchingLine = text
        .split(/\r?\n/)
        .find((line) => line.trim().toLowerCase().startsWith(prefix));

    if (!matchingLine) {
        return null;
    }

    return toNullableText(matchingLine.slice(matchingLine.indexOf(':') + 1));
};

const inferAppName = (details) => {
    const text = String(details || '').toLowerCase();

    if (text.includes('a & f laundry')) {
        return 'A & F Laundry';
    }

    if (text.includes('felix store')) {
        return 'Felix Store';
    }

    return 'Felix Platform';
};

const decorateQuoteRequest = (row) => ({
    ...row,
    app_name: inferAppName(row.details),
    contact_name: getDetailValue(row.details, 'Customer'),
    contact_phone: getDetailValue(row.details, 'Phone'),
    service_date: getDetailValue(row.details, 'Service date'),
    service_window: getDetailValue(row.details, 'Window'),
    pickup_address: getDetailValue(row.details, 'Pickup address') || getDetailValue(row.details, 'Address'),
    delivery_address: getDetailValue(row.details, 'Delivery address'),
    weight_estimate: getDetailValue(row.details, 'Weight estimate'),
    preferred_fulfillment: getDetailValue(row.details, 'Preferred fulfillment'),
    reference_estimate: getDetailValue(row.details, 'Reference estimate'),
});

exports.getQuoteRequests = async (_req, res) => {
    try {
        const result = await pool.query(
            `SELECT qr.*, p.name AS product_name
             FROM quote_requests qr
             LEFT JOIN products p ON p.id = qr.product_id
             ORDER BY qr.created_at DESC`
        );

        res.json(result.rows.map(decorateQuoteRequest));
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching quote requests');
    }
};

exports.trackQuoteRequests = async (req, res) => {
    const contactPhone = toNullableText(req.query.phone || req.query.contact_phone);
    const appName = toNullableText(req.query.app_name);

    if (!contactPhone) {
        return res.status(400).send('Phone number is required');
    }

    const digitsOnly = contactPhone.replace(/\D/g, '');

    try {
        const result = await pool.query(
            `SELECT qr.*, p.name AS product_name
             FROM quote_requests qr
             LEFT JOIN products p ON p.id = qr.product_id
             WHERE (
                    COALESCE(qr.details, '') ILIKE $1
                    OR ($2 <> '' AND regexp_replace(COALESCE(qr.details, ''), '[^0-9]', '', 'g') LIKE '%' || $2 || '%')
                )
               AND ($3::text IS NULL OR COALESCE(qr.details, '') ILIKE '%' || $3 || '%')
             ORDER BY qr.created_at DESC
             LIMIT 20`,
            [`%${contactPhone}%`, digitsOnly, appName]
        );

        res.json(result.rows.map(decorateQuoteRequest));
    } catch (err) {
        console.error(err);
        res.status(500).send('Error tracking quote requests');
    }
};

exports.addQuoteRequest = async (req, res) => {
    const {
        user_id,
        product_id,
        details,
        quantity,
        status,
        quoted_price,
        admin_notes,
    } = req.body;

    const normalizedQuantity = toNullableNumber(quantity);
    const normalizedQuotedPrice = toNullableNumber(quoted_price);

    if (Number.isNaN(normalizedQuantity) || Number.isNaN(normalizedQuotedPrice)) {
        return res.status(400).send('Invalid quote request values');
    }

    try {
        const result = await pool.query(
            `INSERT INTO quote_requests (
                user_id,
                product_id,
                details,
                quantity,
                status,
                quoted_price,
                admin_notes
            ) VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *`,
            [
                user_id || null,
                product_id || null,
                toNullableText(details),
                normalizedQuantity,
                toNullableText(status) || 'pending',
                normalizedQuotedPrice,
                toNullableText(admin_notes),
            ]
        );

        res.json(decorateQuoteRequest(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating quote request');
    }
};

exports.updateQuoteRequest = async (req, res) => {
    const { id } = req.params;
    const { status, quoted_price, admin_notes } = req.body;

    if (!status && quoted_price === undefined && admin_notes === undefined) {
        return res.status(400).send('Provide status, quoted price, or admin notes');
    }

    const normalizedQuotedPrice = toNullableNumber(quoted_price);
    if (quoted_price !== undefined && Number.isNaN(normalizedQuotedPrice)) {
        return res.status(400).send('Invalid quoted price');
    }

    try {
        const currentResult = await pool.query('SELECT * FROM quote_requests WHERE id = $1 LIMIT 1', [id]);

        if (!currentResult.rows.length) {
            return res.status(404).send('Quote request not found');
        }

        const currentQuote = currentResult.rows[0];
        const result = await pool.query(
            `UPDATE quote_requests
             SET status = $1,
                 quoted_price = $2,
                 admin_notes = $3
             WHERE id = $4
             RETURNING *`,
            [
                toNullableText(status) || currentQuote.status || 'pending',
                quoted_price === undefined ? currentQuote.quoted_price : normalizedQuotedPrice,
                admin_notes === undefined ? currentQuote.admin_notes : toNullableText(admin_notes),
                id,
            ]
        );

        res.json(decorateQuoteRequest(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating quote request');
    }
};
