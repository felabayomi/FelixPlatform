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

const toPositiveNumberOrDefault = (value, fallback = 1) => {
    const normalized = toNullableNumber(value);
    return normalized === null || Number.isNaN(normalized) || normalized <= 0 ? fallback : normalized;
};

exports.getOrders = async (req, res) => {
    try {
        const ordersResult = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        const itemsResult = await pool.query('SELECT * FROM order_items ORDER BY id ASC');

        const orders = ordersResult.rows.map((order) => ({
            ...order,
            items: itemsResult.rows.filter((item) => item.order_id === order.id)
        }));

        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching orders');
    }
};

exports.addOrder = async (req, res) => {
    const {
        user_id,
        subtotal,
        delivery_fee,
        tax,
        discount,
        total,
        final_total,
        status,
        payment_status,
        payment_method,
        delivery_type,
        address_id,
        notes,
        app_name,
        items = []
    } = req.body;

    const normalizedSubtotal = toNullableNumber(subtotal);
    const normalizedDeliveryFee = toNullableNumber(delivery_fee);
    const normalizedTax = toNullableNumber(tax);
    const normalizedDiscount = toNullableNumber(discount);
    const normalizedTotal = toNullableNumber(total);
    const normalizedFinalTotal = toNullableNumber(final_total);

    const hasInvalidNumber = [
        normalizedSubtotal,
        normalizedDeliveryFee,
        normalizedTax,
        normalizedDiscount,
        normalizedTotal,
        normalizedFinalTotal
    ].some(Number.isNaN);

    if (hasInvalidNumber) {
        return res.status(400).send('Invalid order totals');
    }

    const preparedItems = Array.isArray(items)
        ? items.map((item) => {
            const quantity = toPositiveNumberOrDefault(item.quantity, 1);
            const measuredQuantity = toPositiveNumberOrDefault(item.measured_quantity ?? item.quantity, quantity);
            const unitPrice = toNullableNumber(item.unit_price ?? item.price);
            const lineTotal = toNullableNumber(item.line_total);

            return {
                product_id: item.product_id || null,
                product_name_snapshot: toNullableText(item.product_name_snapshot || item.name),
                quantity,
                measured_quantity: measuredQuantity,
                unit: toNullableText(item.unit),
                price_type: toNullableText(item.price_type) || 'fixed',
                unit_price: Number.isNaN(unitPrice) ? null : unitPrice,
                price: Number.isNaN(unitPrice) ? null : unitPrice,
                line_total:
                    lineTotal !== null && !Number.isNaN(lineTotal)
                        ? lineTotal
                        : (unitPrice !== null && !Number.isNaN(unitPrice) ? unitPrice * measuredQuantity : null),
                item_notes: toNullableText(item.item_notes || item.notes)
            };
        })
        : [];

    const itemSubtotal = preparedItems.reduce((sum, item) => sum + (item.line_total || 0), 0);
    const resolvedSubtotal = normalizedSubtotal ?? (preparedItems.length ? itemSubtotal : normalizedTotal);
    const resolvedTotal = normalizedTotal ?? resolvedSubtotal;
    const resolvedFinalTotal =
        normalizedFinalTotal ??
        ((resolvedSubtotal ?? 0) + (normalizedDeliveryFee ?? 0) + (normalizedTax ?? 0) - (normalizedDiscount ?? 0));

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const orderResult = await client.query(
            `INSERT INTO orders (
                user_id,
                subtotal,
                delivery_fee,
                tax,
                discount,
                total,
                final_total,
                status,
                payment_status,
                payment_method,
                delivery_type,
                address_id,
                notes,
                app_name
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
            [
                user_id || null,
                resolvedSubtotal,
                normalizedDeliveryFee ?? 0,
                normalizedTax ?? 0,
                normalizedDiscount ?? 0,
                resolvedTotal,
                resolvedFinalTotal,
                toNullableText(status) || 'pending',
                toNullableText(payment_status) || 'pending',
                toNullableText(payment_method),
                toNullableText(delivery_type),
                address_id || null,
                toNullableText(notes),
                toNullableText(app_name) || 'Felix Store'
            ]
        );

        const order = orderResult.rows[0];

        for (const item of preparedItems) {
            await client.query(
                `INSERT INTO order_items (
                    order_id,
                    product_id,
                    product_name_snapshot,
                    quantity,
                    measured_quantity,
                    unit,
                    price_type,
                    unit_price,
                    price,
                    line_total,
                    item_notes
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
                [
                    order.id,
                    item.product_id,
                    item.product_name_snapshot,
                    item.quantity,
                    item.measured_quantity,
                    item.unit,
                    item.price_type,
                    item.unit_price,
                    item.price,
                    item.line_total,
                    item.item_notes
                ]
            );
        }

        await client.query('COMMIT');

        const itemsResult = await client.query('SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC', [order.id]);
        res.json({ ...order, items: itemsResult.rows });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send('Error creating order');
    } finally {
        client.release();
    }
};

exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status, payment_status } = req.body;

    if (!status && !payment_status) {
        return res.status(400).send('Status or payment status is required');
    }

    try {
        const currentResult = await pool.query('SELECT * FROM orders WHERE id = $1 LIMIT 1', [id]);

        if (!currentResult.rows.length) {
            return res.status(404).send('Order not found');
        }

        const currentOrder = currentResult.rows[0];
        const nextStatus = toNullableText(status) || currentOrder.status || 'pending';
        const nextPaymentStatus = toNullableText(payment_status) || currentOrder.payment_status || 'pending';

        const result = await pool.query(
            'UPDATE orders SET status = $1, payment_status = $2 WHERE id = $3 RETURNING *',
            [nextStatus, nextPaymentStatus, id]
        );

        const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC', [id]);
        res.json({ ...result.rows[0], items: itemsResult.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating order status');
    }
};
