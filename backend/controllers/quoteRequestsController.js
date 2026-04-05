const pool = require('../db');
const {
    sendCustomerResponseNotification,
    sendQuoteRequestNotification,
    sendQuoteStatusUpdateEmail,
} = require('../services/resendEmail');

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

const removeDetailLine = (details, label) => {
    const text = String(details || '');
    const prefix = `${String(label || '').toLowerCase()}:`;

    const remainingLines = text
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter((line) => line.trim() && !line.trim().toLowerCase().startsWith(prefix));

    return remainingLines.length ? remainingLines.join('\n') : null;
};

const upsertDetailLine = (details, label, value) => {
    const baseText = removeDetailLine(details, label);
    const normalizedValue = toNullableText(value);

    if (!normalizedValue) {
        return baseText;
    }

    return [baseText, `${label}: ${normalizedValue}`].filter(Boolean).join('\n');
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
    contact_email: getDetailValue(row.details, 'Email'),
    service_date: getDetailValue(row.details, 'Service date'),
    service_window: getDetailValue(row.details, 'Window'),
    pickup_address: getDetailValue(row.details, 'Pickup address') || getDetailValue(row.details, 'Address'),
    delivery_address: getDetailValue(row.details, 'Delivery address'),
    weight_estimate: getDetailValue(row.details, 'Weight estimate'),
    preferred_fulfillment: getDetailValue(row.details, 'Preferred fulfillment'),
    reference_estimate: getDetailValue(row.details, 'Reference estimate'),
    pickup_schedule: getDetailValue(row.admin_notes, 'Pickup schedule'),
    assigned_driver: getDetailValue(row.admin_notes, 'Assigned driver') || getDetailValue(row.details, 'Assigned driver'),
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

        const createdQuoteRequest = decorateQuoteRequest(result.rows[0]);
        const emailResult = await sendQuoteRequestNotification(createdQuoteRequest);

        if (!emailResult.admin?.sent) {
            console.warn('Admin quote email was not sent:', emailResult.admin?.error || emailResult.admin?.reason || 'Unknown email issue');
        }

        if (createdQuoteRequest.contact_email && !emailResult.customer?.sent && !emailResult.customer?.skipped) {
            console.warn('Customer confirmation email was not sent:', emailResult.customer?.error || emailResult.customer?.reason || 'Unknown email issue');
        }

        res.json({
            ...createdQuoteRequest,
            email_sent: Boolean(emailResult.admin?.sent || emailResult.customer?.sent),
            admin_email_sent: Boolean(emailResult.admin?.sent),
            customer_email_sent: Boolean(emailResult.customer?.sent),
            email_id: emailResult.admin?.id || emailResult.customer?.id || null,
            notification_recipient: emailResult.admin?.recipient || null,
            customer_email_recipient: emailResult.customer?.recipient || createdQuoteRequest.contact_email || null,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating quote request');
    }
};

exports.updateQuoteRequest = async (req, res) => {
    const { id } = req.params;
    const { status, quoted_price, admin_notes, assigned_driver, pickup_schedule } = req.body;

    if (
        !status
        && quoted_price === undefined
        && admin_notes === undefined
        && assigned_driver === undefined
        && pickup_schedule === undefined
    ) {
        return res.status(400).send('Provide status, quoted price, admin notes, pickup schedule, or assigned driver');
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
        let nextAdminNotes = admin_notes === undefined ? currentQuote.admin_notes : toNullableText(admin_notes);
        nextAdminNotes = upsertDetailLine(nextAdminNotes, 'Pickup schedule', pickup_schedule === undefined ? getDetailValue(currentQuote.admin_notes, 'Pickup schedule') : pickup_schedule);
        nextAdminNotes = upsertDetailLine(nextAdminNotes, 'Assigned driver', assigned_driver === undefined ? getDetailValue(currentQuote.admin_notes, 'Assigned driver') : assigned_driver);

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
                nextAdminNotes,
                id,
            ]
        );

        const updatedQuoteRequest = decorateQuoteRequest(result.rows[0]);
        const emailResult = await sendQuoteStatusUpdateEmail(updatedQuoteRequest);

        if (updatedQuoteRequest.contact_email && !emailResult.sent && !emailResult.skipped) {
            console.warn('Quote status update email was not sent:', emailResult.error || emailResult.reason || 'Unknown email issue');
        }

        res.json({
            ...updatedQuoteRequest,
            customer_email_sent: Boolean(emailResult.sent),
            customer_email_recipient: emailResult.recipient || updatedQuoteRequest.contact_email || null,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating quote request');
    }
};

exports.respondToQuoteRequest = async (req, res) => {
    const { id } = req.params;
    const providedPhone = toNullableText(req.body.contact_phone || req.body.phone);
    const decision = toNullableText(req.body.decision)?.toLowerCase();

    if (!providedPhone) {
        return res.status(400).send('Phone number is required to respond to this quote request');
    }

    if (!decision || !['accept', 'accepted', 'approve', 'decline', 'declined', 'cancel', 'cancelled'].includes(decision)) {
        return res.status(400).send('Provide a valid quote response decision');
    }

    try {
        const currentResult = await pool.query(
            `SELECT qr.*, p.name AS product_name
             FROM quote_requests qr
             LEFT JOIN products p ON p.id = qr.product_id
             WHERE qr.id = $1
             LIMIT 1`,
            [id]
        );

        if (!currentResult.rows.length) {
            return res.status(404).send('Quote request not found');
        }

        const currentQuote = decorateQuoteRequest(currentResult.rows[0]);
        const expectedDigits = String(currentQuote.contact_phone || '').replace(/\D/g, '');
        const providedDigits = String(providedPhone || '').replace(/\D/g, '');

        if (!expectedDigits || !providedDigits || expectedDigits !== providedDigits) {
            return res.status(403).send('Unable to verify this quote request');
        }

        const accepted = ['accept', 'accepted', 'approve'].includes(decision);
        const nextStatus = accepted ? 'accepted' : 'cancelled';
        const timestamp = new Date().toISOString();
        const responseNote = accepted
            ? `Customer accepted the quote in the app on ${timestamp}`
            : `Customer declined the quote in the app on ${timestamp}`;
        const mergedAdminNotes = [toNullableText(currentQuote.admin_notes), responseNote]
            .filter(Boolean)
            .join('\n');

        const result = await pool.query(
            `UPDATE quote_requests
             SET status = $1,
                 admin_notes = $2
             WHERE id = $3
             RETURNING *`,
            [nextStatus, mergedAdminNotes, id]
        );

        const updatedQuoteRequest = decorateQuoteRequest({
            ...result.rows[0],
            product_name: currentQuote.product_name,
        });
        const adminEmailResult = await sendCustomerResponseNotification(updatedQuoteRequest);

        if (!adminEmailResult.sent && !adminEmailResult.skipped) {
            console.warn('Customer response email was not sent to admin:', adminEmailResult.error || adminEmailResult.reason || 'Unknown email issue');
        }

        res.json({
            ...updatedQuoteRequest,
            customer_action: accepted ? 'accepted' : 'declined',
            notification_recipient: adminEmailResult.recipient || null,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error responding to quote request');
    }
};
