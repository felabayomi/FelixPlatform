const Stripe = require('stripe');
const pool = require('../db');

const DEFAULT_APP_NAME = 'Adrian Store';
const DEFAULT_STOREFRONT_KEY = 'adrian-store';
const DEFAULT_CURRENCY = String(process.env.ADRIAN_STORE_CURRENCY || 'usd').toLowerCase();

let stripeClient = null;

const getStripeClient = () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
        return null;
    }

    if (!stripeClient) {
        stripeClient = new Stripe(secretKey);
    }

    return stripeClient;
};

const toNullableText = (value) => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    const normalized = String(value).trim();
    return normalized || null;
};

const toNumber = (value, fallback = null) => {
    if (value === '' || value === null || value === undefined) {
        return fallback;
    }

    const normalized = Number(String(value).replace(/[^0-9.-]/g, ''));
    return Number.isNaN(normalized) ? NaN : normalized;
};

const toPositiveInteger = (value, fallback = 1) => {
    const normalized = toNumber(value, fallback);
    return normalized === null || Number.isNaN(normalized) || normalized <= 0
        ? fallback
        : Math.max(1, Math.round(normalized));
};

const toBoolean = (value) => {
    if (typeof value === 'boolean') {
        return value;
    }

    return ['true', '1', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
};

const parseImages = (value, fallbackImage = null) => {
    if (Array.isArray(value)) {
        return value.map((item) => toNullableText(item)).filter(Boolean);
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();

        if (!trimmed) {
            return fallbackImage ? [fallbackImage] : [];
        }

        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                return parseImages(parsed, fallbackImage);
            } catch (_error) {
                return fallbackImage ? [fallbackImage] : [];
            }
        }

        return [trimmed];
    }

    return fallbackImage ? [fallbackImage] : [];
};

const toProductResponse = (row = {}) => {
    const images = parseImages(row.images, row.image_url || null);
    const price = toNumber(row.price, 0);
    const compareAtPrice = toNumber(row.compare_at_price, null);
    const inventoryCount = row.inventory_count !== undefined && row.inventory_count !== null
        ? Number(row.inventory_count)
        : (row.stock !== undefined && row.stock !== null ? Number(row.stock) : 0);

    return {
        id: row.id,
        title: row.name || row.title || '',
        name: row.name || row.title || '',
        slug: row.slug || null,
        description: row.short_description || row.description || '',
        short_description: row.short_description || row.description || '',
        long_description: row.long_description || row.description || '',
        price: Number.isNaN(price) ? 0 : price,
        compare_at_price: compareAtPrice,
        featured: Boolean(row.featured),
        active: row.active !== false,
        images,
        image: images[0] || null,
        inventory_count: Number.isNaN(inventoryCount) ? 0 : inventoryCount,
        app_name: row.app_name || DEFAULT_APP_NAME,
        storefront_key: row.storefront_key || DEFAULT_STOREFRONT_KEY,
        category_id: row.category_id || null,
        created_at: row.created_at || null,
    };
};

const getBaseAppUrl = (req) => {
    const origin = toNullableText(req.get('origin'));

    if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
        return origin;
    }

    return process.env.ADRIAN_STORE_APP_BASE_URL || 'http://localhost:3000';
};

exports.getStorefrontProducts = async (req, res) => {
    const appName = toNullableText(req.query.app_name) || DEFAULT_APP_NAME;
    const storefrontKey = toNullableText(req.query.storefront_key) || DEFAULT_STOREFRONT_KEY;
    const featuredOnly = toBoolean(req.query.featured);

    try {
        const result = await pool.query(
            `SELECT
                p.id,
                p.name,
                p.description,
                p.short_description,
                p.long_description,
                p.slug,
                p.price,
                p.compare_at_price,
                COALESCE(p.featured, FALSE) AS featured,
                COALESCE(p.active, TRUE) AS active,
                COALESCE(
                    p.images,
                    CASE WHEN p.image_url IS NOT NULL THEN jsonb_build_array(p.image_url) ELSE '[]'::jsonb END
                ) AS images,
                p.image_url,
                COALESCE(p.inventory_count, p.stock, 0) AS inventory_count,
                p.category_id,
                p.app_name,
                p.storefront_key,
                p.created_at
             FROM products p
             WHERE COALESCE(p.active, TRUE) = TRUE
               AND COALESCE(p.app_name, 'Felix Store') = $1
               AND ($2::boolean = FALSE OR COALESCE(p.featured, FALSE) = TRUE)
             ORDER BY COALESCE(p.featured, FALSE) DESC, p.created_at DESC, p.name ASC`,
            [appName, featuredOnly]
        );

        res.set('Cache-Control', 'no-store, max-age=0');
        res.json(result.rows.map(toProductResponse));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to load storefront products.' });
    }
};

exports.getStorefrontProductBySlug = async (req, res) => {
    const appName = toNullableText(req.query.app_name) || DEFAULT_APP_NAME;
    const storefrontKey = toNullableText(req.query.storefront_key) || DEFAULT_STOREFRONT_KEY;
    const slug = toNullableText(req.params.slug);

    if (!slug) {
        return res.status(400).json({ message: 'Product slug is required.' });
    }

    try {
        const result = await pool.query(
            `SELECT
                p.id,
                p.name,
                p.description,
                p.short_description,
                p.long_description,
                p.slug,
                p.price,
                p.compare_at_price,
                COALESCE(p.featured, FALSE) AS featured,
                COALESCE(p.active, TRUE) AS active,
                COALESCE(
                    p.images,
                    CASE WHEN p.image_url IS NOT NULL THEN jsonb_build_array(p.image_url) ELSE '[]'::jsonb END
                ) AS images,
                p.image_url,
                COALESCE(p.inventory_count, p.stock, 0) AS inventory_count,
                p.category_id,
                p.app_name,
                p.storefront_key,
                p.created_at
             FROM products p
             WHERE p.slug = $1
               AND COALESCE(p.active, TRUE) = TRUE
               AND COALESCE(p.app_name, 'Felix Store') = $2
             LIMIT 1`,
            [slug, appName]
        );

        if (!result.rows.length) {
            return res.status(404).json({ message: 'Storefront product not found.' });
        }

        res.set('Cache-Control', 'no-store, max-age=0');
        res.json(toProductResponse(result.rows[0]));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to load storefront product.' });
    }
};

exports.createCheckoutSession = async (req, res) => {
    const stripe = getStripeClient();

    if (!stripe) {
        return res.status(503).json({ message: 'Stripe is not configured for this storefront yet.' });
    }

    const cart = Array.isArray(req.body?.cart) ? req.body.cart : [];
    const appName = toNullableText(req.body?.app_name || req.body?.appName) || DEFAULT_APP_NAME;
    const storefrontKey = toNullableText(req.body?.storefront_key || req.body?.storefrontKey) || DEFAULT_STOREFRONT_KEY;
    const customerName = toNullableText(req.body?.customer_name || req.body?.customerName || req.body?.customer?.name);
    const customerEmail = toNullableText(req.body?.customer_email || req.body?.customerEmail || req.body?.customer?.email);
    const customerPhone = toNullableText(req.body?.customer_phone || req.body?.customerPhone || req.body?.customer?.phone);
    const notes = toNullableText(req.body?.notes);
    const shippingAddress = req.body?.shipping_address || req.body?.shippingAddress || null;
    const billingAddress = req.body?.billing_address || req.body?.billingAddress || null;
    const shippingAmount = toNumber(req.body?.shipping_amount || req.body?.shippingAmount, 0);
    const taxAmount = toNumber(req.body?.tax_amount || req.body?.taxAmount, 0);

    if (!cart.length) {
        return res.status(400).json({ message: 'Cart items are required.' });
    }

    if (Number.isNaN(shippingAmount) || Number.isNaN(taxAmount)) {
        return res.status(400).json({ message: 'Shipping and tax values must be valid numbers.' });
    }

    try {
        const requestedProductIds = [...new Set(
            cart
                .map((item) => toNullableText(item?.productId || item?.product_id))
                .filter(Boolean)
        )];

        let productMap = new Map();

        if (requestedProductIds.length) {
            const productResult = await pool.query(
                `SELECT
                    p.id,
                    p.name,
                    p.slug,
                    p.description,
                    p.price,
                    p.price_type,
                    p.unit,
                    COALESCE(
                        p.images,
                        CASE WHEN p.image_url IS NOT NULL THEN jsonb_build_array(p.image_url) ELSE '[]'::jsonb END
                    ) AS images,
                    p.image_url,
                    p.app_name,
                    p.storefront_key
                 FROM products p
                 WHERE p.id = ANY($1::uuid[])
                   AND COALESCE(p.active, TRUE) = TRUE
                   AND COALESCE(p.app_name, 'Felix Store') = $2`,
                [requestedProductIds, appName]
            );

            productMap = new Map(productResult.rows.map((row) => [row.id, row]));
        }

        const normalizedItems = cart.map((item, index) => {
            const requestedProductId = toNullableText(item?.productId || item?.product_id);
            const matchedProduct = requestedProductId ? productMap.get(requestedProductId) : null;
            const title = matchedProduct?.name || toNullableText(item?.title || item?.name) || `Store item ${index + 1}`;
            const quantity = toPositiveInteger(item?.quantity, 1);
            const unitPrice = matchedProduct?.price !== undefined && matchedProduct?.price !== null
                ? toNumber(matchedProduct.price, null)
                : toNumber(item?.price || item?.unit_price, null);

            if (unitPrice === null || Number.isNaN(unitPrice) || unitPrice < 0) {
                throw new Error(`A valid price is required for ${title}.`);
            }

            const dbImages = matchedProduct ? parseImages(matchedProduct.images, matchedProduct.image_url || null) : [];
            const fallbackImage = toNullableText(item?.image || item?.product_image);
            const productImage = dbImages[0] || fallbackImage || null;

            return {
                product_id: matchedProduct?.id || null,
                product_title: title,
                product_slug: matchedProduct?.slug || toNullableText(item?.slug || item?.product_slug),
                product_image: productImage,
                unit_price: unitPrice,
                quantity,
                line_total: unitPrice * quantity,
                selected_size: toNullableText(item?.selected_size || item?.selectedSize || item?.size),
                selected_color: toNullableText(item?.selected_color || item?.selectedColor || item?.color),
            };
        });

        const subtotal = normalizedItems.reduce((sum, item) => sum + item.line_total, 0);
        const total = subtotal + (shippingAmount || 0) + (taxAmount || 0);
        const baseAppUrl = getBaseAppUrl(req);
        const successUrl = toNullableText(req.body?.success_url || req.body?.successUrl) || `${baseAppUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = toNullableText(req.body?.cancel_url || req.body?.cancelUrl) || `${baseAppUrl}/cart?checkout=cancelled`;

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const orderResult = await client.query(
                `INSERT INTO orders (
                    user_id,
                    customer_name,
                    customer_email,
                    customer_phone,
                    subtotal,
                    delivery_fee,
                    tax,
                    total,
                    final_total,
                    status,
                    payment_status,
                    payment_method,
                    delivery_type,
                    app_name,
                    storefront_key,
                    currency,
                    shipping_address,
                    billing_address,
                    notes
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
                RETURNING *`,
                [
                    null,
                    customerName,
                    customerEmail,
                    customerPhone,
                    subtotal,
                    shippingAmount || 0,
                    taxAmount || 0,
                    total,
                    total,
                    'pending',
                    'pending',
                    'stripe',
                    'shipping',
                    appName,
                    storefrontKey,
                    DEFAULT_CURRENCY,
                    shippingAddress,
                    billingAddress,
                    notes,
                ]
            );

            const order = orderResult.rows[0];

            for (const item of normalizedItems) {
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
                        item_notes,
                        product_slug,
                        product_image,
                        selected_size,
                        selected_color
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
                    [
                        order.id,
                        item.product_id,
                        item.product_title,
                        item.quantity,
                        item.quantity,
                        null,
                        'fixed',
                        item.unit_price,
                        item.unit_price,
                        item.line_total,
                        notes,
                        item.product_slug,
                        item.product_image,
                        item.selected_size,
                        item.selected_color,
                    ]
                );
            }

            const session = await stripe.checkout.sessions.create({
                mode: 'payment',
                allow_promotion_codes: true,
                line_items: normalizedItems.map((item) => ({
                    quantity: item.quantity,
                    price_data: {
                        currency: DEFAULT_CURRENCY,
                        unit_amount: Math.round(item.unit_price * 100),
                        product_data: {
                            name: item.product_title,
                            images: item.product_image && /^https?:\/\//i.test(item.product_image)
                                ? [item.product_image]
                                : [],
                            metadata: {
                                productId: item.product_id || '',
                                slug: item.product_slug || '',
                                storefrontKey,
                                appName,
                            },
                        },
                    },
                })),
                success_url: successUrl,
                cancel_url: cancelUrl,
                customer_email: customerEmail || undefined,
                metadata: {
                    orderId: order.id,
                    storefrontKey,
                    appName,
                    customerName: customerName || '',
                    customerEmail: customerEmail || '',
                    customerPhone: customerPhone || '',
                },
            });

            await client.query(
                `UPDATE orders
                 SET stripe_session_id = $1
                 WHERE id = $2`,
                [session.id, order.id]
            );

            await client.query('COMMIT');

            res.json({
                orderId: order.id,
                sessionId: session.id,
                url: session.url,
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Unable to create checkout session.' });
    }
};
