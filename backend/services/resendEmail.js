const { Resend } = require('resend');

const QUOTE_NOTIFICATION_EMAIL = process.env.QUOTE_NOTIFICATION_EMAIL || 'felixconsult@myyahoo.com';
const SUPPORT_NOTIFICATION_EMAIL = process.env.SUPPORT_NOTIFICATION_EMAIL || QUOTE_NOTIFICATION_EMAIL;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Felix Platform <onboarding@resend.dev>';

const resendClients = new Map();

const toEnvPrefix = (value) => String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();

const resolveStorePrefix = (context = {}) => {
    const storefrontKey = context.storefrontKey || context.storefront_key;
    const appName = context.appName || context.app_name;

    return toEnvPrefix(storefrontKey) || toEnvPrefix(appName);
};

const getNotificationRecipient = (type = 'support', context = {}) => {
    const prefix = resolveStorePrefix(context);
    const suffix = type === 'quote' ? 'QUOTE_NOTIFICATION_EMAIL' : 'SUPPORT_NOTIFICATION_EMAIL';
    const scopedRecipient = prefix ? process.env[`${prefix}_${suffix}`] : null;

    if (scopedRecipient) {
        return scopedRecipient;
    }

    return type === 'quote' ? QUOTE_NOTIFICATION_EMAIL : SUPPORT_NOTIFICATION_EMAIL;
};

const getResendConfig = (context = {}, type = 'default') => {
    const prefix = resolveStorePrefix(context);
    const normalizedType = toEnvPrefix(type);
    const scopedApiKey = prefix ? process.env[`${prefix}_RESEND_API_KEY`] : null;
    const scopedTypeFromEmail = prefix && normalizedType && normalizedType !== 'DEFAULT'
        ? process.env[`${prefix}_${normalizedType}_FROM_EMAIL`] || process.env[`${prefix}_${normalizedType}_RESEND_FROM_EMAIL`]
        : null;
    const scopedFromEmail = prefix ? process.env[`${prefix}_RESEND_FROM_EMAIL`] : null;
    const sharedTypeFromEmail = normalizedType && normalizedType !== 'DEFAULT'
        ? process.env[`${normalizedType}_FROM_EMAIL`] || process.env[`${normalizedType}_RESEND_FROM_EMAIL`]
        : null;

    return {
        apiKey: scopedApiKey || process.env.RESEND_API_KEY,
        fromEmail: scopedTypeFromEmail || scopedFromEmail || sharedTypeFromEmail || RESEND_FROM_EMAIL,
    };
};

const getResendClient = (context = {}) => {
    const { apiKey } = getResendConfig(context);

    if (!apiKey) {
        return null;
    }

    if (!resendClients.has(apiKey)) {
        resendClients.set(apiKey, new Resend(apiKey));
    }

    return resendClients.get(apiKey);
};

const toNullableText = (value) => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    const trimmed = String(value).trim();
    return trimmed ? trimmed : null;
};

const getDetailValue = (details, label) => {
    const text = String(details || '');
    const prefix = `${String(label || '').toLowerCase()}:`;
    const matchingLine = text
        .split(/\r?\n/)
        .find((line) => line.trim().toLowerCase().startsWith(prefix));

    if (!matchingLine) {
        return null;
    }

    return toNullableText(matchingLine.slice(matchingLine.indexOf(':') + 1));
};

const toEmail = (value) => {
    const normalized = toNullableText(value);

    if (!normalized) {
        return null;
    }

    const email = normalized.toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
};

const parseRecipients = (value) => {
    const values = Array.isArray(value) ? value : [value];

    return [...new Set(values
        .flatMap((entry) => String(entry || '').split(/[;,]/))
        .map((entry) => toEmail(entry))
        .filter(Boolean))];
};

const formatStatusLabel = (value) => {
    const normalized = toNullableText(value) || 'pending';
    return normalized.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatMoney = (value) => {
    if (value === '' || value === null || value === undefined) {
        return 'To be confirmed';
    }

    const amount = Number(value);
    return Number.isNaN(amount) ? String(value) : `$${amount.toFixed(2)}`;
};

const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sendEmail = async ({ to, subject, text, html, appName, storefrontKey, type = 'default' }) => {
    const context = { appName, storefrontKey };
    const resend = getResendClient(context);
    const { fromEmail } = getResendConfig(context, type);
    const recipients = parseRecipients(to);
    const recipientLabel = recipients.join(', ');

    if (!recipients.length) {
        return {
            sent: false,
            skipped: true,
            reason: 'Recipient email was not provided',
            recipient: recipientLabel || null,
            from: fromEmail,
        };
    }

    if (!resend) {
        return {
            sent: false,
            skipped: true,
            reason: 'RESEND_API_KEY is not configured',
            recipient: recipientLabel,
            from: fromEmail,
        };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: recipients,
            subject,
            text,
            html,
        });

        if (error) {
            return {
                sent: false,
                error: error.message || 'Resend returned an error',
                recipient: recipientLabel,
                from: fromEmail,
            };
        }

        return {
            sent: true,
            id: data?.id || null,
            recipient: recipientLabel,
            from: fromEmail,
        };
    } catch (error) {
        return {
            sent: false,
            error: error instanceof Error ? error.message : 'Unable to send email',
            recipient: recipientLabel,
            from: fromEmail,
        };
    }
};

exports.sendEmail = sendEmail;

exports.sendQuoteRequestNotification = async (quoteRequest = {}) => {
    const appName = quoteRequest.app_name || 'Felix Platform';
    const storefrontKey = quoteRequest.storefront_key || quoteRequest.storefrontKey || '';
    const productName = quoteRequest.product_name || 'General request';
    const detailsText = String(quoteRequest.details || '').trim() || 'No additional details provided.';
    const detailsLines = detailsText.split(/\r?\n/).filter(Boolean);
    const customerName = quoteRequest.contact_name || getDetailValue(detailsText, 'Customer') || 'there';
    const customerEmail = toEmail(quoteRequest.contact_email || getDetailValue(detailsText, 'Email'));

    const adminResult = await sendEmail({
        to: getNotificationRecipient('quote', { appName, storefrontKey }),
        appName,
        storefrontKey,
        type: 'quote',
        subject: `New ${appName} quote request #${quoteRequest.id || 'pending'}`,
        text: [
            `A new quote request was submitted from ${appName}.`,
            `Quote ID: ${quoteRequest.id || 'pending'}`,
            `Product: ${productName}`,
            `Quantity: ${quoteRequest.quantity || 1}`,
            '',
            detailsText,
        ].join('\n'),
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:640px;margin:0 auto;">
                <h2 style="margin-bottom:8px;">New ${escapeHtml(appName)} quote request</h2>
                <p style="margin:0 0 12px;">A customer submitted a new quote request from the app.</p>
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;margin-bottom:12px;">
                    <p style="margin:0 0 6px;"><strong>Quote ID:</strong> ${escapeHtml(quoteRequest.id || 'pending')}</p>
                    <p style="margin:0 0 6px;"><strong>Product:</strong> ${escapeHtml(productName)}</p>
                    <p style="margin:0;"><strong>Quantity:</strong> ${escapeHtml(quoteRequest.quantity || 1)}</p>
                </div>
                <h3 style="margin-bottom:8px;">Request details</h3>
                <ul style="padding-left:18px;margin:0;">
                    ${detailsLines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
                </ul>
            </div>
        `,
    });

    let customerResult = {
        sent: false,
        skipped: true,
        reason: 'Customer email was not provided',
        recipient: customerEmail,
    };

    if (customerEmail) {
        customerResult = await sendEmail({
            to: customerEmail,
            appName,
            storefrontKey,
            type: 'quote',
            subject: `We received your ${appName} quote request #${quoteRequest.id || 'pending'}`,
            text: [
                `Hello ${customerName},`,
                '',
                `We received your quote request for ${productName}.`,
                `Reference ID: ${quoteRequest.id || 'pending'}`,
                'Our team will review it, email you the quoted price, and keep the status updated in the app.',
            ].join('\n'),
            html: `
                <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:640px;margin:0 auto;">
                    <h2 style="margin-bottom:8px;">Your quote request is in</h2>
                    <p>Hello ${escapeHtml(customerName)},</p>
                    <p>We received your ${escapeHtml(appName)} quote request for <strong>${escapeHtml(productName)}</strong>.</p>
                    <p><strong>Reference ID:</strong> ${escapeHtml(quoteRequest.id || 'pending')}</p>
                    <p>Our team will review it, email you the quoted price, and keep the status updated in the app.</p>
                </div>
            `,
        });
    }

    return {
        admin: adminResult,
        customer: customerResult,
    };
};

exports.sendQuoteStatusUpdateEmail = async (quoteRequest = {}) => {
    const detailsText = String(quoteRequest.details || '').trim();
    const customerEmail = toEmail(quoteRequest.contact_email || getDetailValue(detailsText, 'Email'));

    if (!customerEmail) {
        return {
            sent: false,
            skipped: true,
            reason: 'Customer email was not provided',
            recipient: null,
        };
    }

    const appName = quoteRequest.app_name || 'Felix Platform';
    const storefrontKey = quoteRequest.storefront_key || quoteRequest.storefrontKey || '';
    const productName = quoteRequest.product_name || 'your request';
    const customerName = quoteRequest.contact_name || getDetailValue(detailsText, 'Customer') || 'there';
    const statusLabel = formatStatusLabel(quoteRequest.status);
    const quotedPrice = formatMoney(quoteRequest.quoted_price);
    const adminNotes = toNullableText(quoteRequest.admin_notes) || 'We will share more details with you shortly.';

    return sendEmail({
        to: customerEmail,
        appName,
        storefrontKey,
        type: 'quote',
        subject: `${appName} quote update: ${statusLabel}`,
        text: [
            `Hello ${customerName},`,
            '',
            `Your ${appName} request for ${productName} is now marked as ${statusLabel}.`,
            `Reference ID: ${quoteRequest.id || 'pending'}`,
            `Quoted price: ${quotedPrice}`,
            `Admin notes: ${adminNotes}`,
            '',
            'You can also track the latest status directly in the app.',
        ].join('\n'),
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:640px;margin:0 auto;">
                <h2 style="margin-bottom:8px;">${escapeHtml(appName)} quote update</h2>
                <p>Hello ${escapeHtml(customerName)},</p>
                <p>Your request for <strong>${escapeHtml(productName)}</strong> is now <strong>${escapeHtml(statusLabel)}</strong>.</p>
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;">
                    <p style="margin:0 0 6px;"><strong>Reference ID:</strong> ${escapeHtml(quoteRequest.id || 'pending')}</p>
                    <p style="margin:0 0 6px;"><strong>Quoted price:</strong> ${escapeHtml(quotedPrice)}</p>
                    <p style="margin:0;"><strong>Admin notes:</strong> ${escapeHtml(adminNotes)}</p>
                </div>
                <p style="margin-top:12px;">You can also track the latest status directly in the app.</p>
            </div>
        `,
    });
};

exports.sendCustomerResponseNotification = async (quoteRequest = {}) => {
    const appName = quoteRequest.app_name || 'Felix Platform';
    const storefrontKey = quoteRequest.storefront_key || quoteRequest.storefrontKey || '';
    const productName = quoteRequest.product_name || 'request';
    const customerName = quoteRequest.contact_name || 'Customer';
    const statusLabel = formatStatusLabel(quoteRequest.status);

    return sendEmail({
        to: getNotificationRecipient('quote', { appName, storefrontKey }),
        appName,
        storefrontKey,
        type: 'quote',
        subject: `Customer response for ${appName} request #${quoteRequest.id || 'pending'}`,
        text: [
            `${customerName} has responded to a quote request.`,
            `Reference ID: ${quoteRequest.id || 'pending'}`,
            `Product: ${productName}`,
            `New status: ${statusLabel}`,
        ].join('\n'),
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:640px;margin:0 auto;">
                <h2 style="margin-bottom:8px;">Customer response received</h2>
                <p><strong>${escapeHtml(customerName)}</strong> responded to the quote request for <strong>${escapeHtml(productName)}</strong>.</p>
                <p><strong>Reference ID:</strong> ${escapeHtml(quoteRequest.id || 'pending')}</p>
                <p><strong>New status:</strong> ${escapeHtml(statusLabel)}</p>
            </div>
        `,
    });
};

exports.sendSupportRequestNotification = async (supportRequest = {}) => {
    const appName = supportRequest.app_name || 'Felix Platform';
    const storefrontKey = supportRequest.storefront_key || supportRequest.storefrontKey || '';
    const contactName = supportRequest.contact_name || 'there';
    const contactEmail = toEmail(supportRequest.contact_email);
    const contactPhone = toNullableText(supportRequest.contact_phone) || 'Not provided';
    const subjectLine = toNullableText(supportRequest.subject) || 'New message';
    const messageText = toNullableText(supportRequest.message) || 'No additional message provided.';
    const acknowledgementSubject = appName === 'WACI'
        ? `Thank you for reaching out to ${appName}`
        : `We received your ${appName} message`;

    const adminResult = await sendEmail({
        to: getNotificationRecipient('support', { appName, storefrontKey }),
        appName,
        storefrontKey,
        subject: `New ${appName} inquiry: ${subjectLine}`,
        text: [
            `A new inquiry was submitted from ${appName}.`,
            `Contact: ${contactName}`,
            `Email: ${contactEmail || 'Not provided'}`,
            `Phone: ${contactPhone}`,
            `Subject: ${subjectLine}`,
            '',
            messageText,
        ].join('\n'),
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:640px;margin:0 auto;">
                <h2 style="margin-bottom:8px;">New ${escapeHtml(appName)} inquiry</h2>
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;margin-bottom:12px;">
                    <p style="margin:0 0 6px;"><strong>Contact:</strong> ${escapeHtml(contactName)}</p>
                    <p style="margin:0 0 6px;"><strong>Email:</strong> ${escapeHtml(contactEmail || 'Not provided')}</p>
                    <p style="margin:0 0 6px;"><strong>Phone:</strong> ${escapeHtml(contactPhone)}</p>
                    <p style="margin:0;"><strong>Subject:</strong> ${escapeHtml(subjectLine)}</p>
                </div>
                <p style="white-space:pre-wrap;">${escapeHtml(messageText)}</p>
            </div>
        `,
    });

    let customerResult = {
        sent: false,
        skipped: true,
        reason: 'Contact email was not provided',
        recipient: contactEmail,
    };

    if (contactEmail) {
        customerResult = await sendEmail({
            to: contactEmail,
            appName,
            storefrontKey,
            subject: acknowledgementSubject,
            text: [
                `Hello ${contactName},`,
                '',
                `Thank you for reaching out to ${appName}.`,
                `Subject: ${subjectLine}`,
                'We received your message and our team will follow up with you shortly.',
            ].join('\n'),
            html: `
                <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:640px;margin:0 auto;">
                    <h2 style="margin-bottom:8px;">Message received</h2>
                    <p>Hello ${escapeHtml(contactName)},</p>
                    <p>Thank you for reaching out to ${escapeHtml(appName)}.</p>
                    <p><strong>Subject:</strong> ${escapeHtml(subjectLine)}</p>
                    <p>We received your message and our team will follow up with you shortly.</p>
                </div>
            `,
        });
    }

    return {
        admin: adminResult,
        customer: customerResult,
    };
};

const formatAddress = (value) => {
    if (!value) {
        return 'Not provided';
    }

    if (typeof value === 'string') {
        return value;
    }

    if (typeof value === 'object') {
        const parts = Object.values(value)
            .flatMap((entry) => (typeof entry === 'object' && entry !== null ? Object.values(entry) : entry))
            .map((entry) => toNullableText(entry))
            .filter(Boolean);

        return parts.length ? parts.join(', ') : 'Not provided';
    }

    return String(value);
};

const formatOrderItemText = (item = {}) => {
    const title = item.product_name_snapshot || item.product_title || item.title || 'Store item';
    const quantity = Number(item.quantity || 1);
    const lineTotal = formatMoney(item.line_total ?? item.price);
    return `- ${title} × ${quantity} (${lineTotal})`;
};

const formatOrderItemHtml = (item = {}) => {
    const title = item.product_name_snapshot || item.product_title || item.title || 'Store item';
    const quantity = Number(item.quantity || 1);
    const lineTotal = formatMoney(item.line_total ?? item.price);
    return `<li>${escapeHtml(title)} &times; ${escapeHtml(quantity)} <strong>${escapeHtml(lineTotal)}</strong></li>`;
};

exports.sendStoreOrderNotification = async (order = {}) => {
    const appName = order.app_name || 'Felix Store';
    const storefrontKey = order.storefront_key || '';
    const orderId = order.id || 'pending';
    const customerName = toNullableText(order.customer_name) || 'there';
    const customerEmail = toEmail(order.customer_email);
    const customerPhone = toNullableText(order.customer_phone) || 'Not provided';
    const paymentStatusLabel = formatStatusLabel(order.payment_status || 'pending');
    const totalText = formatMoney(order.final_total ?? order.total ?? 0);
    const deliveryText = formatMoney(order.delivery_fee ?? 0);
    const taxText = formatMoney(order.tax ?? 0);
    const shippingAddressText = formatAddress(order.shipping_address);
    const items = Array.isArray(order.items) ? order.items : [];
    const itemsText = items.length ? items.map(formatOrderItemText).join('\n') : 'No line items available.';
    const itemsHtml = items.length
        ? `<ul style="padding-left:18px;margin:8px 0 0;">${items.map(formatOrderItemHtml).join('')}</ul>`
        : '<p style="margin:8px 0 0;">No line items available.</p>';

    const adminResult = await sendEmail({
        to: getNotificationRecipient('support', { appName, storefrontKey }),
        appName,
        storefrontKey,
        subject: `New ${appName} order #${orderId}`,
        text: [
            `A new order was placed in ${appName}.`,
            `Order ID: ${orderId}`,
            `Customer: ${customerName}`,
            `Email: ${customerEmail || 'Not provided'}`,
            `Phone: ${customerPhone}`,
            `Total: ${totalText}`,
            `Payment status: ${paymentStatusLabel}`,
            `Delivery fee: ${deliveryText}`,
            `Tax: ${taxText}`,
            `Shipping address: ${shippingAddressText}`,
            '',
            'Items:',
            itemsText,
        ].join('\n'),
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:640px;margin:0 auto;">
                <h2 style="margin-bottom:8px;">New ${escapeHtml(appName)} order</h2>
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;">
                    <p style="margin:0 0 6px;"><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
                    <p style="margin:0 0 6px;"><strong>Customer:</strong> ${escapeHtml(customerName)}</p>
                    <p style="margin:0 0 6px;"><strong>Email:</strong> ${escapeHtml(customerEmail || 'Not provided')}</p>
                    <p style="margin:0 0 6px;"><strong>Phone:</strong> ${escapeHtml(customerPhone)}</p>
                    <p style="margin:0 0 6px;"><strong>Total:</strong> ${escapeHtml(totalText)}</p>
                    <p style="margin:0 0 6px;"><strong>Payment status:</strong> ${escapeHtml(paymentStatusLabel)}</p>
                    <p style="margin:0 0 6px;"><strong>Delivery fee:</strong> ${escapeHtml(deliveryText)}</p>
                    <p style="margin:0 0 6px;"><strong>Tax:</strong> ${escapeHtml(taxText)}</p>
                    <p style="margin:0;"><strong>Shipping address:</strong> ${escapeHtml(shippingAddressText)}</p>
                </div>
                <h3 style="margin:16px 0 8px;">Items</h3>
                ${itemsHtml}
            </div>
        `,
    });

    let customerResult = {
        sent: false,
        skipped: true,
        reason: 'Customer email was not provided',
        recipient: customerEmail,
    };

    if (customerEmail) {
        customerResult = await sendEmail({
            to: customerEmail,
            appName,
            storefrontKey,
            subject: `We received your ${appName} order #${orderId}`,
            text: [
                `Hello ${customerName},`,
                '',
                `Thanks for shopping with ${appName}. We received your order and it is now being prepared for processing.`,
                `Order ID: ${orderId}`,
                `Total: ${totalText}`,
                `Payment status: ${paymentStatusLabel}`,
                '',
                'Items:',
                itemsText,
                '',
                'We will send another update as your order moves through processing and shipping.',
            ].join('\n'),
            html: `
                <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:640px;margin:0 auto;">
                    <h2 style="margin-bottom:8px;">Your order is in</h2>
                    <p>Hello ${escapeHtml(customerName)},</p>
                    <p>Thanks for shopping with ${escapeHtml(appName)}. We received your order and it is now being prepared for processing.</p>
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;">
                        <p style="margin:0 0 6px;"><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
                        <p style="margin:0 0 6px;"><strong>Total:</strong> ${escapeHtml(totalText)}</p>
                        <p style="margin:0;"><strong>Payment status:</strong> ${escapeHtml(paymentStatusLabel)}</p>
                    </div>
                    <h3 style="margin:16px 0 8px;">Items</h3>
                    ${itemsHtml}
                    <p style="margin-top:12px;">We will send another update as your order moves through processing and shipping.</p>
                </div>
            `,
        });
    }

    return {
        admin: adminResult,
        customer: customerResult,
    };
};

exports.sendStoreOrderStatusUpdateEmail = async (order = {}, previous = {}) => {
    const appName = order.app_name || 'Felix Store';
    const storefrontKey = order.storefront_key || '';
    const orderId = order.id || 'pending';
    const customerName = toNullableText(order.customer_name) || 'there';
    const customerEmail = toEmail(order.customer_email);
    const previousStatus = toNullableText(previous.previousStatus) || 'pending';
    const previousPaymentStatus = toNullableText(previous.previousPaymentStatus) || 'pending';
    const nextStatus = toNullableText(order.status) || previousStatus;
    const nextPaymentStatus = toNullableText(order.payment_status) || previousPaymentStatus;
    const statusChanged = nextStatus !== previousStatus;
    const paymentChanged = nextPaymentStatus !== previousPaymentStatus;

    if (!statusChanged && !paymentChanged) {
        return {
            sent: false,
            skipped: true,
            reason: 'No order changes to notify',
            recipient: customerEmail,
        };
    }

    if (!customerEmail) {
        return {
            sent: false,
            skipped: true,
            reason: 'Customer email was not provided',
            recipient: customerEmail,
        };
    }

    const statusLabel = formatStatusLabel(nextStatus);
    const paymentStatusLabel = formatStatusLabel(nextPaymentStatus);
    const totalText = formatMoney(order.final_total ?? order.total ?? 0);

    let leadText = `Your ${appName} order has been updated.`;

    switch (nextStatus) {
        case 'processing':
            leadText = 'Your order is now being prepared.';
            break;
        case 'shipped':
            leadText = 'Great news — your order has shipped and is on its way.';
            break;
        case 'completed':
            leadText = 'Your order has been completed.';
            break;
        case 'cancelled':
            leadText = 'Your order has been cancelled. If you have questions, reply to the support email for your storefront.';
            break;
        default:
            leadText = `Your order is now marked as ${statusLabel}.`;
            break;
    }

    const changeLines = [];

    if (statusChanged) {
        changeLines.push(`Order status: ${formatStatusLabel(previousStatus)} → ${statusLabel}`);
    }

    if (paymentChanged) {
        changeLines.push(`Payment status: ${formatStatusLabel(previousPaymentStatus)} → ${paymentStatusLabel}`);
    }

    return sendEmail({
        to: customerEmail,
        appName,
        storefrontKey,
        subject: `${appName} order #${orderId} update: ${statusLabel}`,
        text: [
            `Hello ${customerName},`,
            '',
            leadText,
            `Order ID: ${orderId}`,
            `Total: ${totalText}`,
            ...changeLines,
            '',
            'Thank you for shopping with us.',
        ].join('\n'),
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:640px;margin:0 auto;">
                <h2 style="margin-bottom:8px;">Order update</h2>
                <p>Hello ${escapeHtml(customerName)},</p>
                <p>${escapeHtml(leadText)}</p>
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;">
                    <p style="margin:0 0 6px;"><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
                    <p style="margin:0 0 6px;"><strong>Total:</strong> ${escapeHtml(totalText)}</p>
                    ${statusChanged ? `<p style="margin:0 0 6px;"><strong>Order status:</strong> ${escapeHtml(formatStatusLabel(previousStatus))} &rarr; ${escapeHtml(statusLabel)}</p>` : ''}
                    ${paymentChanged ? `<p style="margin:0;"><strong>Payment status:</strong> ${escapeHtml(formatStatusLabel(previousPaymentStatus))} &rarr; ${escapeHtml(paymentStatusLabel)}</p>` : ''}
                </div>
                <p style="margin-top:12px;">Thank you for shopping with ${escapeHtml(appName)}.</p>
            </div>
        `,
    });
};

exports.sendDocumentFormatterAccessRequestNotification = async (accessRequest = {}) => {
    const requesterName = toNullableText(accessRequest.name) || 'Unknown requester';
    const requesterEmail = toEmail(accessRequest.email);
    const organization = toNullableText(accessRequest.organization) || 'Not provided';
    const reason = toNullableText(accessRequest.reason) || 'No access reason provided.';

    const adminResult = await sendEmail({
        to: SUPPORT_NOTIFICATION_EMAIL,
        subject: `Document Formatter access request from ${requesterName}`,
        text: [
            'A new Document Formatter access request was submitted.',
            `Name: ${requesterName}`,
            `Email: ${requesterEmail || 'Not provided'}`,
            `Organization: ${organization}`,
            '',
            reason,
        ].join('\n'),
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:640px;margin:0 auto;">
                <h2 style="margin-bottom:8px;">Document Formatter access request</h2>
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;margin-bottom:12px;">
                    <p style="margin:0 0 6px;"><strong>Name:</strong> ${escapeHtml(requesterName)}</p>
                    <p style="margin:0 0 6px;"><strong>Email:</strong> ${escapeHtml(requesterEmail || 'Not provided')}</p>
                    <p style="margin:0;"><strong>Organization:</strong> ${escapeHtml(organization)}</p>
                </div>
                <p style="white-space:pre-wrap;">${escapeHtml(reason)}</p>
            </div>
        `,
    });

    let customerResult = {
        sent: false,
        skipped: true,
        reason: 'Requester email was not provided',
        recipient: requesterEmail,
    };

    if (requesterEmail) {
        customerResult = await sendEmail({
            to: requesterEmail,
            subject: 'Your Document Formatter access request was received',
            text: [
                `Hello ${requesterName},`,
                '',
                'We received your Document Formatter access request.',
                'Our team will review your request and follow up with next steps shortly.',
            ].join('\n'),
            html: `
                <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:640px;margin:0 auto;">
                    <h2 style="margin-bottom:8px;">Access request received</h2>
                    <p>Hello ${escapeHtml(requesterName)},</p>
                    <p>We received your request for access to the Felix Platform Document Formatter.</p>
                    <p>Our team will review it and follow up with next steps shortly.</p>
                </div>
            `,
        });
    }

    return {
        admin: adminResult,
        customer: customerResult,
    };
};
