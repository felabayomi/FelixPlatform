import { Resend } from 'resend';
import type { Appointment } from '@shared/schema';

const RESEND_API_KEY = process.env.AFLAUNDRY_RESEND_API_KEY || process.env.RESEND_API_KEY;
const SENDER_EMAIL = process.env.AFLAUNDRY_RESEND_FROM_EMAIL || process.env.SENDER_EMAIL || 'onboarding@resend.dev';
const NOTIFICATION_EMAIL = process.env.AFLAUNDRY_NOTIFICATION_EMAIL || 'aflaundryservice@gmail.com';
const SENDER_NAME = 'A&F Laundry Service';
const LOGO_URL = 'https://res.cloudinary.com/do26xsbby/image/upload/v1759950496/348s_byajhr.png';
const FROM_EMAIL = /<[^<>]+>/.test(SENDER_EMAIL)
  ? SENDER_EMAIL
  : `${SENDER_NAME} <${SENDER_EMAIL}>`;

const resend = RESEND_API_KEY
  ? new Resend(RESEND_API_KEY)
  : {
    emails: {
      async send() {
        return {
          data: null,
          error: { message: 'AFLAUNDRY_RESEND_API_KEY is not configured. Email notifications are disabled.' },
        };
      },
    },
  };

if (!RESEND_API_KEY) {
  console.warn('[Email] AFLAUNDRY_RESEND_API_KEY is not configured. Email notifications are disabled.');
}

async function sendTemplatedEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const recipients = (Array.isArray(to) ? to : [to])
    .map((recipient) => String(recipient || '').trim())
    .filter(Boolean);

  if (!recipients.length) {
    return { success: false, error: { message: 'No email recipients were provided.' } };
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: recipients,
    replyTo: NOTIFICATION_EMAIL,
    subject,
    html,
  });

  if (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }

  console.log('Email sent successfully:', data);
  return { success: true, data };
}

function createEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo img {
      max-width: 200px;
      height: auto;
    }
    h1 {
      color: #2563eb;
      font-size: 24px;
      margin-bottom: 10px;
      text-align: center;
    }
    .reference {
      background-color: #f3f4f6;
      padding: 12px;
      border-radius: 6px;
      text-align: center;
      margin: 20px 0;
      font-weight: 600;
      color: #1f2937;
    }
    .section {
      margin: 25px 0;
    }
    .section-title {
      color: #2563eb;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }
    .info-row {
      margin: 8px 0;
      color: #4b5563;
    }
    .label {
      font-weight: 600;
      color: #1f2937;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .address {
      margin-top: 10px;
      font-style: normal;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="logo">
      <img src="${LOGO_URL}" alt="A & F Laundry Service" />
    </div>
    ${content}
    <div class="footer">
      <div><strong>A & F Laundry Service</strong></div>
      <div class="address">
        50 Stately St, Suite 2<br>
        Wiley Ford, WV 26767
      </div>
    </div>
  </div>
</body>
</html>
`;
}

export async function sendBookingNotification(appointment: Appointment) {
  try {
    const heavyItemsInfo = appointment.hasHeavyItems && appointment.heavyItemsCount
      ? `
      <div class="info-row">
        <span class="label">Heavy Items:</span> ${appointment.heavyItemsCount} item${appointment.heavyItemsCount > 1 ? 's' : ''} ($${appointment.heavyItemsCount * 20} surcharge)
      </div>`
      : '';

    const pickupInfo = appointment.pickupDate && appointment.pickupTime
      ? `
      <div class="info-row">
        <span class="label">Pickup:</span> ${appointment.pickupDate} at ${appointment.pickupTime}
      </div>`
      : `
      <div class="info-row">
        <span class="label">Pickup:</span> To be scheduled later
      </div>`;

    const specialInstructions = appointment.specialInstructions
      ? `
    <div class="section">
      <div class="section-title">Special Instructions</div>
      <div class="info-row">${appointment.specialInstructions}</div>
    </div>`
      : '';

    const emailContent = `
    <h1>New Appointment Booked!</h1>
    <div class="reference">
      Reference Number: ${appointment.id.substring(0, 8).toUpperCase()}
    </div>

    <div class="section">
      <div class="section-title">Customer Information</div>
      <div class="info-row">
        <span class="label">Name:</span> ${appointment.customerName}
      </div>
      <div class="info-row">
        <span class="label">Phone:</span> ${appointment.customerPhone}
      </div>
      <div class="info-row">
        <span class="label">Email:</span> ${appointment.customerEmail || 'Not provided'}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Appointment Details</div>
      <div class="info-row">
        <span class="label">Drop-off:</span> ${appointment.dropoffDate} at ${appointment.dropoffTime}
      </div>
      ${pickupInfo}
      <div class="info-row">
        <span class="label">Soap Type:</span> ${appointment.soapType}
      </div>
      ${heavyItemsInfo}
    </div>
    ${specialInstructions}
    `;

    const customerConfirmationContent = `
    <h1>Your Booking is Confirmed!</h1>
    <div class="reference">
      Reference Number: ${appointment.id.substring(0, 8).toUpperCase()}
    </div>

    <div class="section">
      <div class="info-row">Thank you for booking with A & F Laundry Service.</div>
      <div class="info-row">We have received your appointment and will be ready for you on <strong>${appointment.dropoffDate}</strong> at <strong>${appointment.dropoffTime}</strong>.</div>
    </div>

    <div class="section">
      <div class="section-title">Booking Details</div>
      <div class="info-row"><span class="label">Drop-off:</span> ${appointment.dropoffDate} at ${appointment.dropoffTime}</div>
      ${pickupInfo}
      <div class="info-row"><span class="label">Soap Type:</span> ${appointment.soapType}</div>
      ${heavyItemsInfo}
    </div>
    ${specialInstructions}
    `;

    const adminEmailResult = await sendTemplatedEmail({
      to: NOTIFICATION_EMAIL,
      subject: `New Booking: ${appointment.customerName} - ${appointment.dropoffDate}`,
      html: createEmailTemplate(emailContent),
    });

    const customerEmailResult = appointment.customerEmail
      ? await sendTemplatedEmail({
        to: appointment.customerEmail,
        subject: `Booking Confirmed: ${appointment.dropoffDate} at ${appointment.dropoffTime}`,
        html: createEmailTemplate(customerConfirmationContent),
      })
      : { success: true, skipped: true };

    return {
      success: Boolean(adminEmailResult.success && customerEmailResult.success),
      adminEmailResult,
      customerEmailResult,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

function createRescheduleButton(rescheduleUrl: string): string {
  return `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${rescheduleUrl}" style="
        background-color: #2563eb;
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        display: inline-block;
      ">Reschedule Appointment</a>
    </div>
    <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 10px;">
      Please cancel or reschedule at least 4 hours in advance
    </div>
  `;
}

export async function sendPickupScheduledNotification(appointment: Appointment) {
  try {
    if (!appointment.pickupDate || !appointment.pickupTime) {
      console.error('Cannot send pickup scheduled notification: pickup date or time is missing');
      return { success: false, error: 'Missing pickup date or time' };
    }

    const heavyItemsInfo = appointment.hasHeavyItems && appointment.heavyItemsCount
      ? `
      <div class="info-row">
        <span class="label">Heavy Items:</span> ${appointment.heavyItemsCount} item${appointment.heavyItemsCount > 1 ? 's' : ''} ($${appointment.heavyItemsCount * 20} surcharge)
      </div>`
      : '';

    const specialInstructions = appointment.specialInstructions
      ? `
    <div class="section">
      <div class="section-title">Special Instructions</div>
      <div class="info-row">${appointment.specialInstructions}</div>
    </div>`
      : '';

    const emailContent = `
    <h1>Pickup Scheduled!</h1>
    <div class="reference">
      Reference Number: ${appointment.id.substring(0, 8).toUpperCase()}
    </div>

    <div class="section">
      <div class="section-title">Customer Information</div>
      <div class="info-row">
        <span class="label">Name:</span> ${appointment.customerName}
      </div>
      <div class="info-row">
        <span class="label">Phone:</span> ${appointment.customerPhone}
      </div>
      <div class="info-row">
        <span class="label">Email:</span> ${appointment.customerEmail || 'Not provided'}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Appointment Details</div>
      <div class="info-row">
        <span class="label">Drop-off:</span> ${appointment.dropoffDate} at ${appointment.dropoffTime}
      </div>
      <div class="info-row">
        <span class="label">Pickup:</span> ${appointment.pickupDate} at ${appointment.pickupTime}
      </div>
      <div class="info-row">
        <span class="label">Soap Type:</span> ${appointment.soapType}
      </div>
      ${heavyItemsInfo}
    </div>
    ${specialInstructions}
    `;

    const adminEmailResult = await sendTemplatedEmail({
      to: NOTIFICATION_EMAIL,
      subject: `Pickup Scheduled: ${appointment.customerName} - ${appointment.pickupDate}`,
      html: createEmailTemplate(emailContent),
    });

    const customerEmailResult = appointment.customerEmail
      ? await sendTemplatedEmail({
        to: appointment.customerEmail,
        subject: `Pickup Scheduled: ${appointment.pickupDate} at ${appointment.pickupTime}`,
        html: createEmailTemplate(emailContent),
      })
      : { success: true, skipped: true };

    return {
      success: Boolean(adminEmailResult.success && customerEmailResult.success),
      adminEmailResult,
      customerEmailResult,
    };
  } catch (error) {
    console.error('Error sending pickup scheduled email:', error);
    return { success: false, error };
  }
}
