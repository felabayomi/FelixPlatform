const { Resend } = require('resend');

const QUOTE_NOTIFICATION_EMAIL = process.env.QUOTE_NOTIFICATION_EMAIL || 'felixconsult@myyahoo.com';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Felix Platform <onboarding@resend.dev>';

let resendClient = null;

const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        return null;
    }

    if (!resendClient) {
        resendClient = new Resend(apiKey);
    }

    return resendClient;
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

const sendEmail = async ({ to, subject, text, html }) => {
    const resend = getResendClient();

    if (!resend) {
        return {
            sent: false,
            skipped: true,
            reason: 'RESEND_API_KEY is not configured',
            recipient: to,
        };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: RESEND_FROM_EMAIL,
            to: [to],
            subject,
            text,
            html,
        });

        if (error) {
            return {
                sent: false,
                error: error.message || 'Resend returned an error',
                recipient: to,
            };
        }

        return {
            sent: true,
            id: data?.id || null,
            recipient: to,
        };
    } catch (error) {
        return {
            sent: false,
            error: error instanceof Error ? error.message : 'Unable to send email',
            recipient: to,
        };
    }
};

exports.sendQuoteRequestNotification = async (quoteRequest = {}) => {
    const appName = quoteRequest.app_name || 'Felix Platform';
    const productName = quoteRequest.product_name || 'General request';
    const detailsText = String(quoteRequest.details || '').trim() || 'No additional details provided.';
    const detailsLines = detailsText.split(/\r?\n/).filter(Boolean);
    const customerName = quoteRequest.contact_name || getDetailValue(detailsText, 'Customer') || 'there';
    const customerEmail = toEmail(quoteRequest.contact_email || getDetailValue(detailsText, 'Email'));

    const adminResult = await sendEmail({
        to: QUOTE_NOTIFICATION_EMAIL,
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
    const productName = quoteRequest.product_name || 'your request';
    const customerName = quoteRequest.contact_name || getDetailValue(detailsText, 'Customer') || 'there';
    const statusLabel = formatStatusLabel(quoteRequest.status);
    const quotedPrice = formatMoney(quoteRequest.quoted_price);
    const adminNotes = toNullableText(quoteRequest.admin_notes) || 'We will share more details with you shortly.';

    return sendEmail({
        to: customerEmail,
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
    const productName = quoteRequest.product_name || 'request';
    const customerName = quoteRequest.contact_name || 'Customer';
    const statusLabel = formatStatusLabel(quoteRequest.status);

    return sendEmail({
        to: QUOTE_NOTIFICATION_EMAIL,
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
