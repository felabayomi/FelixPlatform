const { randomUUID } = require('crypto');
const pool = require('../db');

const ALLOWED_STATUSES = new Set(['scheduled', 'in-progress', 'completed', 'cancelled']);

const toNullableText = (value) => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    const trimmed = String(value).trim();
    return trimmed ? trimmed : null;
};

const toRequiredText = (value, fieldLabel) => {
    const normalized = toNullableText(value);
    if (!normalized) {
        throw new Error(`${fieldLabel} is required`);
    }
    return normalized;
};

const toBoolean = (value) => {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
    }

    return Boolean(value);
};

const toInteger = (value, fallback = 0) => {
    if (value === '' || value === null || value === undefined) {
        return fallback;
    }

    const parsed = Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const validateEmail = (value) => {
    const email = toRequiredText(value, 'Customer email');
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValid) {
        throw new Error('A valid customer email is required');
    }

    return email;
};

const validatePhone = (value) => {
    const phone = toRequiredText(value, 'Customer phone');
    const digitsOnly = phone.replace(/\D/g, '');

    if (digitsOnly.length < 10) {
        throw new Error('A valid customer phone number is required');
    }

    return phone;
};

const normalizeStatus = (value, fallback = 'scheduled') => {
    const normalized = toNullableText(value);
    if (!normalized) {
        return fallback;
    }

    const lowered = normalized.toLowerCase();
    if (!ALLOWED_STATUSES.has(lowered)) {
        throw new Error(`Invalid status. Allowed values: ${Array.from(ALLOWED_STATUSES).join(', ')}`);
    }

    return lowered;
};

const mapAppointment = (row) => ({
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    dropoffDate: row.dropoff_date,
    dropoffTime: row.dropoff_time,
    pickupDate: row.pickup_date,
    pickupTime: row.pickup_time,
    soapType: row.soap_type,
    hasHeavyItems: Boolean(row.has_heavy_items),
    heavyItemsCount: row.heavy_items_count ?? 0,
    specialInstructions: row.special_instructions,
    status: row.status,
    rescheduleToken: row.reschedule_token,
    remindersSent: row.reminders_sent || [],
    createdAt: row.created_at,
});

exports.getAppointments = async (_req, res) => {
    try {
        const result = await pool.query('SELECT * FROM appointments ORDER BY created_at DESC');
        res.json(result.rows.map(mapAppointment));
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching A&F Laundry appointments');
    }
};

exports.createAppointment = async (req, res) => {
    try {
        const payload = req.body || {};
        const hasHeavyItems = toBoolean(payload.hasHeavyItems);
        const heavyItemsCount = hasHeavyItems ? toInteger(payload.heavyItemsCount, 0) : 0;

        const result = await pool.query(
            `INSERT INTO appointments (
                id,
                customer_name,
                customer_phone,
                customer_email,
                dropoff_date,
                dropoff_time,
                pickup_date,
                pickup_time,
                soap_type,
                has_heavy_items,
                heavy_items_count,
                special_instructions,
                status
            ) VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                $11,
                $12,
                $13
            ) RETURNING *`,
            [
                randomUUID(),
                toRequiredText(payload.customerName, 'Customer name'),
                validatePhone(payload.customerPhone),
                validateEmail(payload.customerEmail),
                toRequiredText(payload.dropoffDate, 'Dropoff date'),
                toRequiredText(payload.dropoffTime, 'Dropoff time'),
                toNullableText(payload.pickupDate),
                toNullableText(payload.pickupTime),
                toRequiredText(payload.soapType, 'Soap type'),
                hasHeavyItems,
                heavyItemsCount,
                toNullableText(payload.specialInstructions),
                normalizeStatus(payload.status, 'scheduled'),
            ]
        );

        res.status(201).json(mapAppointment(result.rows[0]));
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || 'Error creating A&F Laundry appointment');
    }
};

exports.updateAppointment = async (req, res) => {
    const { id } = req.params;
    const payload = req.body || {};

    try {
        const currentResult = await pool.query('SELECT * FROM appointments WHERE id = $1 LIMIT 1', [id]);
        if (!currentResult.rows.length) {
            return res.status(404).send('Appointment not found');
        }

        const current = currentResult.rows[0];
        const nextHasHeavyItems = payload.hasHeavyItems === undefined ? Boolean(current.has_heavy_items) : toBoolean(payload.hasHeavyItems);
        const nextHeavyItemsCount = payload.heavyItemsCount === undefined
            ? (current.heavy_items_count ?? 0)
            : (nextHasHeavyItems ? toInteger(payload.heavyItemsCount, current.heavy_items_count ?? 0) : 0);

        const updatedValues = {
            customer_name: payload.customerName === undefined ? current.customer_name : toRequiredText(payload.customerName, 'Customer name'),
            customer_phone: payload.customerPhone === undefined ? current.customer_phone : validatePhone(payload.customerPhone),
            customer_email: payload.customerEmail === undefined ? current.customer_email : validateEmail(payload.customerEmail),
            dropoff_date: payload.dropoffDate === undefined ? current.dropoff_date : toRequiredText(payload.dropoffDate, 'Dropoff date'),
            dropoff_time: payload.dropoffTime === undefined ? current.dropoff_time : toRequiredText(payload.dropoffTime, 'Dropoff time'),
            pickup_date: payload.pickupDate === undefined ? current.pickup_date : toNullableText(payload.pickupDate),
            pickup_time: payload.pickupTime === undefined ? current.pickup_time : toNullableText(payload.pickupTime),
            soap_type: payload.soapType === undefined ? current.soap_type : toRequiredText(payload.soapType, 'Soap type'),
            has_heavy_items: nextHasHeavyItems,
            heavy_items_count: nextHeavyItemsCount,
            special_instructions: payload.specialInstructions === undefined ? current.special_instructions : toNullableText(payload.specialInstructions),
            status: payload.status === undefined ? current.status : normalizeStatus(payload.status, current.status || 'scheduled'),
        };

        const result = await pool.query(
            `UPDATE appointments
             SET customer_name = $1,
                 customer_phone = $2,
                 customer_email = $3,
                 dropoff_date = $4,
                 dropoff_time = $5,
                 pickup_date = $6,
                 pickup_time = $7,
                 soap_type = $8,
                 has_heavy_items = $9,
                 heavy_items_count = $10,
                 special_instructions = $11,
                 status = $12
             WHERE id = $13
             RETURNING *`,
            [
                updatedValues.customer_name,
                updatedValues.customer_phone,
                updatedValues.customer_email,
                updatedValues.dropoff_date,
                updatedValues.dropoff_time,
                updatedValues.pickup_date,
                updatedValues.pickup_time,
                updatedValues.soap_type,
                updatedValues.has_heavy_items,
                updatedValues.heavy_items_count,
                updatedValues.special_instructions,
                updatedValues.status,
                id,
            ]
        );

        res.json(mapAppointment(result.rows[0]));
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || 'Error updating A&F Laundry appointment');
    }
};
