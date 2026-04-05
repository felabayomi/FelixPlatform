const { sendSupportRequestNotification } = require('../services/resendEmail');

const toNullableText = (value) => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    const trimmed = String(value).trim();
    return trimmed ? trimmed : null;
};

exports.submitSupportRequest = async (req, res) => {
    const appName = toNullableText(req.body.app_name) || 'Felix Platform';
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
