import { Resend } from 'resend';
import type { Appointment } from '@shared/schema';

const RESEND_API_KEY = process.env.AFLAUNDRY_RESEND_API_KEY || process.env.RESEND_API_KEY;
const SENDER_EMAIL = process.env.AFLAUNDRY_RESEND_FROM_EMAIL || process.env.SENDER_EMAIL || 'onboarding@resend.dev';
const SENDER_NAME = 'A&F Laundry Service';
const LOGO_URL = 'https://res.cloudinary.com/do26xsbby/image/upload/v1759950496/348s_byajhr.png';
const BASE_URL = process.env.AFLAUNDRY_APP_BASE_URL || process.env.APP_BASE_URL || (process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : `http://localhost:${process.env.PORT || '5000'}`);

const resend = RESEND_API_KEY
  ? new Resend(RESEND_API_KEY)
  : {
    emails: {
      async send() {
        return {
          data: null,
          error: { message: 'AFLAUNDRY_RESEND_API_KEY is not configured. Reminder emails are disabled.' },
        };
      },
    },
  };

if (!RESEND_API_KEY) {
  console.warn('[Email] AFLAUNDRY_RESEND_API_KEY is not configured. Reminder emails are disabled.');
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
    .button {
      background-color: #2563eb;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      display: inline-block;
    }
    .alert {
      background-color: #fef3c7;
      border-left: 4px solid: #f59e0b;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
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
        Wiley Ford, WV 26767<br>
        Phone: 240-664-2270<br>
        Email: aflaundryservice@gmail.com
      </div>
      <div style="margin-top: 10px; font-size: 12px;">
        Operating Hours: 9am - 6pm daily
      </div>
    </div>
  </div>
</body>
</html>
`;
}

function createRescheduleButton(rescheduleUrl: string): string {
  return `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${rescheduleUrl}" class="button">Reschedule Appointment</a>
    </div>
    <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 10px;">
      Please cancel or reschedule at least 6 hours in advance
    </div>
  `;
}

export async function sendDropoffReminder(appointment: Appointment, rescheduleToken: string) {
  try {
    const rescheduleUrl = `${BASE_URL}/reschedule/${rescheduleToken}`;
    const soapInfo = appointment.soapType === 'I provide my own'
      ? '<div class="alert"><strong>⚠️ Remember to bring your own detergent!</strong></div>'
      : `<div class="info-row"><span class="label">Soap Type:</span> ${appointment.soapType}</div>`;

    const emailContent = `
    <h1>Drop-off Reminder - Tomorrow!</h1>
    <div class="reference">
      Reference Number: ${appointment.id.substring(0, 8).toUpperCase()}
    </div>

    <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
      <strong>Your laundry drop-off is scheduled for tomorrow</strong><br>
      ${appointment.dropoffDate} at ${appointment.dropoffTime}
    </div>

    <div class="section">
      <div class="section-title">Location</div>
      <div class="info-row">
        <strong>A & F Laundry Service</strong><br>
        50 Stately St, Suite 2<br>
        Wiley Ford, WV 26767
      </div>
    </div>

    <div class="section">
      <div class="section-title">What to Bring</div>
      ${soapInfo}
      <div class="info-row">• Your laundry sorted and ready</div>
      ${appointment.hasHeavyItems ? '<div class="info-row">• Heavy items (duvets, rugs, etc.) - $20 surcharge per item</div>' : ''}
    </div>

    ${createRescheduleButton(rescheduleUrl)}
    `;

    const { data, error } = await resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [appointment.customerEmail],
      subject: `Reminder: Drop-off Tomorrow at ${appointment.dropoffTime}`,
      html: createEmailTemplate(emailContent),
    });

    if (error) {
      console.error('Failed to send drop-off reminder:', error);
      return { success: false, error };
    }

    console.log('Drop-off reminder sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending drop-off reminder:', error);
    return { success: false, error };
  }
}

export async function sendPickupReminder(appointment: Appointment, rescheduleToken: string) {
  try {
    if (!appointment.pickupDate || !appointment.pickupTime) {
      return { success: false, error: 'Missing pickup date or time' };
    }

    const rescheduleUrl = `${BASE_URL}/reschedule/${rescheduleToken}`;
    const estimatedCost = appointment.hasHeavyItems && appointment.heavyItemsCount
      ? `
      <div class="alert">
        <strong>Estimated Cost:</strong><br>
        $1.50 per pound + $${appointment.heavyItemsCount * 20} heavy items surcharge<br>
        (Exact amount will be calculated based on actual weight)
      </div>`
      : `
      <div class="info-row">
        <span class="label">Pricing:</span> $1.50 per pound (final amount calculated at pickup)
      </div>`;

    const emailContent = `
    <h1>Pickup Reminder - Tomorrow!</h1>
    <div class="reference">
      Reference Number: ${appointment.id.substring(0, 8).toUpperCase()}
    </div>

    <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
      <strong>Your laundry pickup is scheduled for tomorrow</strong><br>
      ${appointment.pickupDate} at ${appointment.pickupTime}
    </div>

    <div class="section">
      <div class="section-title">Location</div>
      <div class="info-row">
        <strong>A & F Laundry Service</strong><br>
        50 Stately St, Suite 2<br>
        Wiley Ford, WV 26767
      </div>
    </div>

    <div class="section">
      <div class="section-title">Payment Information</div>
      ${estimatedCost}
      <div class="info-row">Payment is collected on-site at pickup</div>
    </div>

    ${createRescheduleButton(rescheduleUrl)}
    `;

    const { data, error } = await resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [appointment.customerEmail],
      subject: `Reminder: Pickup Tomorrow at ${appointment.pickupTime}`,
      html: createEmailTemplate(emailContent),
    });

    if (error) {
      console.error('Failed to send pickup reminder:', error);
      return { success: false, error };
    }

    console.log('Pickup reminder sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending pickup reminder:', error);
    return { success: false, error };
  }
}

export async function sendSameDayReminder(appointment: Appointment, type: 'dropoff' | 'pickup', rescheduleToken: string) {
  try {
    const rescheduleUrl = `${BASE_URL}/reschedule/${rescheduleToken}`;
    const isDropoff = type === 'dropoff';
    const date = isDropoff ? appointment.dropoffDate : appointment.pickupDate;
    const time = isDropoff ? appointment.dropoffTime : appointment.pickupTime;

    if (!date || !time) {
      return { success: false, error: `Missing ${type} date or time` };
    }

    const emailContent = `
    <h1>${isDropoff ? 'Drop-off' : 'Pickup'} Today!</h1>
    <div class="reference">
      Reference Number: ${appointment.id.substring(0, 8).toUpperCase()}
    </div>

    <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
      <strong>Your ${isDropoff ? 'drop-off' : 'pickup'} is scheduled for today</strong><br>
      ${date} at ${time}
    </div>

    <div class="section">
      <div class="section-title">Location</div>
      <div class="info-row">
        <strong>A & F Laundry Service</strong><br>
        50 Stately St, Suite 2<br>
        Wiley Ford, WV 26767<br>
        Phone: 240-664-2270
      </div>
    </div>

    ${createRescheduleButton(rescheduleUrl)}
    `;

    const { data, error } = await resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [appointment.customerEmail],
      subject: `Today: ${isDropoff ? 'Drop-off' : 'Pickup'} at ${time}`,
      html: createEmailTemplate(emailContent),
    });

    if (error) {
      console.error(`Failed to send same-day ${type} reminder:`, error);
      return { success: false, error };
    }

    console.log(`Same-day ${type} reminder sent successfully:`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`Error sending same-day ${type} reminder:`, error);
    return { success: false, error };
  }
}

export async function sendLaundryReadyNotification(appointment: Appointment) {
  try {
    if (!appointment.pickupDate || !appointment.pickupTime) {
      return { success: false, error: 'Missing pickup date or time' };
    }

    const emailContent = `
    <h1>🎉 Your Laundry is Ready!</h1>
    <div class="reference">
      Reference Number: ${appointment.id.substring(0, 8).toUpperCase()}
    </div>

    <div style="background-color: #d1fae5; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
      <strong>Your laundry has been washed, dried, and folded!</strong>
    </div>

    <div class="section">
      <div class="section-title">Scheduled Pickup</div>
      <div class="info-row">
        <span class="label">Date:</span> ${appointment.pickupDate}
      </div>
      <div class="info-row">
        <span class="label">Time:</span> ${appointment.pickupTime}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Pick Up Early?</div>
      <div class="info-row">
        Your laundry is ready now! You can pick it up anytime during our operating hours:
      </div>
      <div class="info-row"><strong>9am - 6pm daily</strong></div>
      <div class="info-row">
        Just give us a call to let us know you're coming: <strong>240-664-2270</strong>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Location</div>
      <div class="info-row">
        <strong>A & F Laundry Service</strong><br>
        50 Stately St, Suite 2<br>
        Wiley Ford, WV 26767
      </div>
    </div>
    `;

    const { data, error } = await resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [appointment.customerEmail],
      subject: 'Your Laundry is Ready for Pickup! 🎉',
      html: createEmailTemplate(emailContent),
    });

    if (error) {
      console.error('Failed to send laundry ready notification:', error);
      return { success: false, error };
    }

    console.log('Laundry ready notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending laundry ready notification:', error);
    return { success: false, error };
  }
}

export async function sendThankYouEmail(appointment: Appointment) {
  try {
    const emailContent = `
    <h1>Thank You for Choosing A&F Laundry! 💙</h1>
    <div class="reference">
      Reference Number: ${appointment.id.substring(0, 8).toUpperCase()}
    </div>

    <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
      <strong>We appreciate your business, ${appointment.customerName}!</strong>
    </div>

    <div class="section">
      <div class="section-title">Your Service Summary</div>
      <div class="info-row">
        <span class="label">Drop-off:</span> ${appointment.dropoffDate}
      </div>
      <div class="info-row">
        <span class="label">Pickup:</span> ${appointment.pickupDate}
      </div>
      <div class="info-row">
        <span class="label">Soap Used:</span> ${appointment.soapType}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Need Laundry Service Again?</div>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${BASE_URL}" class="button">Book Your Next Appointment</a>
      </div>
    </div>

    <div class="section">
      <div class="section-title">We'd Love Your Feedback!</div>
      <div class="info-row">
        If you have any comments or suggestions, please don't hesitate to reach out:
      </div>
      <div class="info-row">
        Phone: <strong>240-664-2270</strong><br>
        Email: <strong>aflaundryservice@gmail.com</strong>
      </div>
    </div>
    `;

    const { data, error } = await resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [appointment.customerEmail],
      subject: 'Thank You for Choosing A&F Laundry Service!',
      html: createEmailTemplate(emailContent),
    });

    if (error) {
      console.error('Failed to send thank you email:', error);
      return { success: false, error };
    }

    console.log('Thank you email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending thank you email:', error);
    return { success: false, error };
  }
}
