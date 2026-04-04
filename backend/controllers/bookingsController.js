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

exports.getBookings = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching bookings');
    }
};

exports.addBooking = async (req, res) => {
    const {
        user_id,
        product_id,
        booking_date,
        booking_time,
        service_date,
        service_window,
        status,
        notes,
        special_instructions,
        pickup_address,
        delivery_address,
        contact_name,
        contact_phone,
        assigned_driver,
        weight_estimate,
        app_name
    } = req.body;

    const normalizedWeightEstimate = toNullableNumber(weight_estimate);

    if (weight_estimate !== '' && weight_estimate !== null && weight_estimate !== undefined && Number.isNaN(normalizedWeightEstimate)) {
        return res.status(400).send('Invalid weight estimate');
    }

    try {
        const result = await pool.query(
            `INSERT INTO bookings (
                user_id,
                product_id,
                booking_date,
                booking_time,
                service_date,
                service_window,
                status,
                notes,
                special_instructions,
                pickup_address,
                delivery_address,
                contact_name,
                contact_phone,
                assigned_driver,
                weight_estimate,
                app_name
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
            [
                user_id || null,
                product_id || null,
                booking_date || service_date || null,
                booking_time || service_window || null,
                service_date || booking_date || null,
                toNullableText(service_window || booking_time),
                toNullableText(status) || 'pending',
                toNullableText(notes),
                toNullableText(special_instructions || notes),
                toNullableText(pickup_address),
                toNullableText(delivery_address),
                toNullableText(contact_name),
                toNullableText(contact_phone),
                toNullableText(assigned_driver),
                normalizedWeightEstimate,
                toNullableText(app_name) || 'A & F Laundry'
            ]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating booking');
    }
};

exports.updateBookingStatus = async (req, res) => {
    const { id } = req.params;
    const { status, assigned_driver } = req.body;

    if (!status && !assigned_driver) {
        return res.status(400).send('Status or assigned driver is required');
    }

    try {
        const currentResult = await pool.query('SELECT * FROM bookings WHERE id = $1 LIMIT 1', [id]);

        if (!currentResult.rows.length) {
            return res.status(404).send('Booking not found');
        }

        const currentBooking = currentResult.rows[0];
        const nextStatus = toNullableText(status) || currentBooking.status || 'pending';
        const nextDriver = toNullableText(assigned_driver) || currentBooking.assigned_driver;

        const result = await pool.query(
            'UPDATE bookings SET status = $1, assigned_driver = $2 WHERE id = $3 RETURNING *',
            [nextStatus, nextDriver, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating booking status');
    }
};
