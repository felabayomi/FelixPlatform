const pool = require('../db');
const { sendSupportRequestNotification } = require('../services/resendEmail');

let ensureSupportRequestsTablePromise = null;

const toNullableText = (value) => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    const trimmed = String(value).trim();
    return trimmed ? trimmed : null;
};

const ensureSupportRequestsTable = async () => {
    if (!ensureSupportRequestsTablePromise) {
        ensureSupportRequestsTablePromise = pool.query(`
            CREATE TABLE IF NOT EXISTS support_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                app_name TEXT NOT NULL DEFAULT 'Felix Platform',
                storefront_key TEXT,
                contact_name TEXT NOT NULL,
                contact_email TEXT NOT NULL,
                contact_phone TEXT,
                subject TEXT NOT NULL DEFAULT 'Support request',
                message TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'new',
                admin_notes TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `).catch((error) => {
            ensureSupportRequestsTablePromise = null;
            throw error;
        });
    }

    await ensureSupportRequestsTablePromise;
};

const decorateSupportRequest = (row = {}) => ({
    ...row,
    app_name: row.app_name || 'Felix Platform',
    storefront_key: row.storefront_key || null,
    status: row.status || 'new',
});

exports.getSupportRequests = async (req, res) => {
    const appName = toNullableText(req.query.app_name);
    const storefrontKey = toNullableText(req.query.storefront_key);
    const filters = [];
    const values = [];

    if (appName) {
        values.push(appName);
        filters.push(`COALESCE(app_name, 'Felix Platform') = $${values.length}`);
    }

    if (storefrontKey) {
        values.push(storefrontKey);
        filters.push(`COALESCE(storefront_key, '') = $${values.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    try {
        await ensureSupportRequestsTable();
        const result = await pool.query(
            `SELECT * FROM support_requests ${whereClause} ORDER BY created_at DESC`,
            values,
        );

        return res.json(result.rows.map(decorateSupportRequest));
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error fetching support requests');
    }
};

exports.updateSupportRequest = async (req, res) => {
    const { id } = req.params;
    const { status, admin_notes } = req.body || {};

    if (status === undefined && admin_notes === undefined) {
        return res.status(400).send('Status or admin notes are required');
    }

    try {
        await ensureSupportRequestsTable();

        const currentResult = await pool.query('SELECT * FROM support_requests WHERE id = $1 LIMIT 1', [id]);
        if (!currentResult.rows.length) {
            return res.status(404).send('Support request not found');
        }

        const currentRequest = currentResult.rows[0];
        const result = await pool.query(
            `UPDATE support_requests
             SET status = $1,
                 admin_notes = $2,
                 updated_at = NOW()
             WHERE id = $3
             RETURNING *`,
            [
                toNullableText(status) || currentRequest.status || 'new',
                admin_notes === undefined ? currentRequest.admin_notes : toNullableText(admin_notes),
                id,
            ],
        );

        return res.json(decorateSupportRequest(result.rows[0]));
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error updating support request');
    }
};

exports.submitSupportRequest = async (req, res) => {
    const appName = toNullableText(req.body.app_name) || 'Felix Platform';
    const storefrontKey = toNullableText(req.body.storefront_key);
    const contactName = toNullableText(req.body.contact_name);
    const contactEmail = toNullableText(req.body.contact_email);
    const contactPhone = toNullableText(req.body.contact_phone);
    const subject = toNullableText(req.body.subject) || 'Support request';
    const message = toNullableText(req.body.message);

    if (!contactName) {
        return res.status(400).send('Name is required');
    }

    if (!contactEmail) {
        return res.status(400).send('Email is required');
    }

    if (!message) {
        return res.status(400).send('Message is required');
    }

    try {
        await ensureSupportRequestsTable();

        const createdResult = await pool.query(
            `INSERT INTO support_requests (
                app_name,
                storefront_key,
                contact_name,
                contact_email,
                contact_phone,
                subject,
                message
            ) VALUES ($1,$2,$3,$4,$5,$6,$7)
            RETURNING *`,
            [appName, storefrontKey, contactName, contactEmail, contactPhone, subject, message],
        );

        const supportRequest = decorateSupportRequest(createdResult.rows[0]);
        const emailResult = await sendSupportRequestNotification({
            app_name: appName,
            contact_name: contactName,
            contact_email: contactEmail,
            contact_phone: contactPhone,
            subject,
            message,
        });

        if (!emailResult.admin?.sent) {
            console.warn('Support notification email was not sent:', emailResult.admin?.error || emailResult.admin?.reason || 'Unknown email issue');
        }

        if (!emailResult.customer?.sent && !emailResult.customer?.skipped) {
            console.warn('Support confirmation email was not sent:', emailResult.customer?.error || emailResult.customer?.reason || 'Unknown email issue');
        }

        return res.json({
            submitted: true,
            support_request: supportRequest,
            app_name: appName,
            admin_email_sent: Boolean(emailResult.admin?.sent),
            customer_email_sent: Boolean(emailResult.customer?.sent),
            notification_recipient: emailResult.admin?.recipient || null,
            customer_email_recipient: emailResult.customer?.recipient || contactEmail,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error submitting support request');
    }
};
