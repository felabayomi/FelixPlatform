import type { Tour, Signup, LocalPicksSignup, ContactMessage, NewsletterSubscriber, UserSignup } from "@shared/schema";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured. Email not sent.");
      return false;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to send email:", error);
      return false;
    }

    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export async function sendSignupConfirmation(
  signup: Signup,
  tour: Tour
): Promise<void> {
  const confirmationHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .tour-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .highlight { color: #667eea; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Tour Confirmed!</h1>
            <p>Your spot is reserved for ${tour.city}, ${tour.state}</p>
          </div>
          <div class="content">
            <p>Hi ${signup.fullName},</p>
            <p>Thank you for booking your tour with City Discoverer! We're excited to explore <strong>${tour.city}, ${tour.state}</strong> with you.</p>
            
            <div class="tour-details">
              <h3>Tour Details</h3>
              <p><strong>Destination:</strong> ${tour.city}, ${tour.state}</p>
              <p><strong>Dates:</strong> ${tour.startDate} - ${tour.endDate}</p>
              <p><strong>Number of Participants:</strong> ${signup.participants}</p>
              <p><strong>Confirmation Email:</strong> ${signup.email}</p>
              <p><strong>Contact Phone:</strong> ${signup.phone}</p>
            </div>

            <h3>What's Next?</h3>
            <p>We'll send you detailed information about:</p>
            <ul>
              <li>Meeting location and time</li>
              <li>What to bring and packing recommendations</li>
              <li>Payment information</li>
              <li>Tour itinerary and highlights</li>
            </ul>

            <p>If you have any questions, feel free to reply to this email.</p>
            
            <p>See you soon!<br>
            <span class="highlight">The City Discoverer Team</span></p>
          </div>
          <div class="footer">
            <p>City Discoverer - Expedition America Travel Co.</p>
            <p>Discover America, one city at a time</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: signup.email,
    subject: `Tour Confirmed: ${tour.city}, ${tour.state} - ${tour.startDate}`,
    html: confirmationHtml,
  });
}

export async function sendAdminNotification(
  signup: Signup,
  tour: Tour
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL;
  
  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not configured. Admin notification not sent.");
    return;
  }

  const notificationHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; }
          .label { font-weight: bold; color: #4b5563; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🎟️ New Tour Signup</h2>
          </div>
          <div class="content">
            <p>A new participant has signed up for a tour!</p>
            
            <div class="info-box">
              <p><span class="label">Tour:</span> ${tour.city}, ${tour.state}</p>
              <p><span class="label">Dates:</span> ${tour.startDate} - ${tour.endDate}</p>
              <p><span class="label">Current Spots Filled:</span> ${tour.currentParticipants + signup.participants} / ${tour.maxParticipants}</p>
            </div>

            <div class="info-box">
              <p><span class="label">Customer Name:</span> ${signup.fullName}</p>
              <p><span class="label">Email:</span> ${signup.email}</p>
              <p><span class="label">Phone:</span> ${signup.phone}</p>
              <p><span class="label">Participants:</span> ${signup.participants}</p>
              <p><span class="label">Receive Updates:</span> ${signup.receiveUpdates ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: adminEmail,
    subject: `New Signup: ${tour.city}, ${tour.state} - ${signup.fullName}`,
    html: notificationHtml,
  });
}

export async function sendLocalPicksConfirmation(
  signup: LocalPicksSignup
): Promise<void> {
  const confirmationHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
          .highlight { color: #10b981; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🗺️ Thanks for Joining Local Picks!</h1>
            <p>We'll curate personalized tour recommendations just for you</p>
          </div>
          <div class="content">
            <p>Hi ${signup.fullName},</p>
            <p>Thank you for signing up for Local Picks! We're excited to help you discover hidden gems and unique experiences tailored to your interests.</p>
            
            <div class="info-box">
              <h3>Your Preferences</h3>
              <p><strong>Preferred States:</strong> ${signup.preferredStates}</p>
              <p><strong>Travel Dates:</strong> ${signup.startDate} to ${signup.endDate}</p>
              <p><strong>Interests:</strong> ${signup.interests}</p>
              <p><strong>Email:</strong> ${signup.email}</p>
              <p><strong>Phone:</strong> ${signup.phone}</p>
            </div>

            <h3>What's Next?</h3>
            <p>Our team will review your preferences and send you:</p>
            <ul>
              <li>Handpicked tour recommendations based on your interests</li>
              <li>Exclusive early access to new tours in your preferred states</li>
              <li>Special local insights and hidden gems</li>
              <li>Priority booking for popular destinations</li>
            </ul>

            <p>You'll hear from us within 2-3 business days with your first personalized recommendations!</p>
            
            <p>Happy exploring!<br>
            <span class="highlight">The City Discoverer Team</span></p>
          </div>
          <div class="footer">
            <p>City Discoverer - Expedition America Travel Co.</p>
            <p>Discover America, one city at a time</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: signup.email,
    subject: "Welcome to City Discoverer Local Picks!",
    html: confirmationHtml,
  });
}

export async function sendLocalPicksAdminNotification(
  signup: LocalPicksSignup
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL;
  
  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not configured. Admin notification not sent.");
    return;
  }

  const notificationHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; }
          .label { font-weight: bold; color: #4b5563; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🗺️ New Local Picks Signup</h2>
          </div>
          <div class="content">
            <p>A new person has signed up for Local Picks!</p>
            
            <div class="info-box">
              <p><span class="label">Name:</span> ${signup.fullName}</p>
              <p><span class="label">Email:</span> ${signup.email}</p>
              <p><span class="label">Phone:</span> ${signup.phone}</p>
            </div>

            <div class="info-box">
              <p><span class="label">Preferred States:</span><br>${signup.preferredStates}</p>
              <p><span class="label">Travel Dates:</span><br>${signup.startDate} to ${signup.endDate}</p>
              <p><span class="label">Interests:</span><br>${signup.interests}</p>
            </div>

            <p><strong>Action Required:</strong> Review preferences and send personalized tour recommendations.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: adminEmail,
    subject: `New Local Picks Signup: ${signup.fullName}`,
    html: notificationHtml,
  });
}

export async function sendContactConfirmation(
  message: ContactMessage
): Promise<void> {
  const confirmationHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .message-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📬 Message Received!</h1>
          </div>
          <div class="content">
            <p>Hi ${message.fullName},</p>
            <p>Thank you for contacting City Discoverer! We've received your message and will get back to you within 24-48 hours.</p>
            
            <div class="message-box">
              <h3>Your Message Details</h3>
              <p><strong>Subject:</strong> ${message.subject}</p>
              <p><strong>Message:</strong></p>
              <p>${message.message}</p>
            </div>

            <p>If you have any urgent questions, feel free to reply to this email.</p>
            
            <div class="footer">
              <p>City Discoverer - Expedition America Travel Co.</p>
              <p>discoverercity@gmail.com</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: message.email,
    subject: "We received your message - City Discoverer",
    html: confirmationHtml,
  });
}

export async function sendContactAdminNotification(
  message: ContactMessage
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || "discoverercity@gmail.com";
  
  const notificationHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; }
          .label { font-weight: bold; color: #4b5563; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📧 New Contact Form Submission</h2>
          </div>
          <div class="content">
            <p>A new contact form message has been received!</p>
            
            <div class="info-box">
              <p><span class="label">Name:</span> ${message.fullName}</p>
              <p><span class="label">Email:</span> ${message.email}</p>
              <p><span class="label">Subject:</span> ${message.subject}</p>
            </div>

            <div class="info-box">
              <p><span class="label">Message:</span></p>
              <p>${message.message}</p>
            </div>

            <p><strong>Action Required:</strong> Respond to ${message.email} within 24-48 hours.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: adminEmail,
    subject: `New Contact Message: ${message.subject}`,
    html: notificationHtml,
  });
}

export async function sendNewsletterWelcome(
  subscriber: NewsletterSubscriber
): Promise<void> {
  const welcomeHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
          ul { padding-left: 20px; }
          li { margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to City Discoverer!</h1>
          </div>
          <div class="content">
            <p>Hi there!</p>
            <p>Thank you for subscribing to the City Discoverer newsletter! We're thrilled to have you join our community of curious travelers.</p>
            
            <div class="info-box">
              <h3>What to Expect:</h3>
              <ul>
                <li><strong>New Tour Announcements:</strong> Be the first to know about our latest group tours to exciting U.S. cities</li>
                <li><strong>Destination Guides:</strong> Insider tips and hidden gems from our local experts</li>
                <li><strong>Exclusive Offers:</strong> Special discounts and early-bird pricing for our subscribers</li>
                <li><strong>Travel Inspiration:</strong> Stories and photos from fellow travelers exploring America</li>
              </ul>
            </div>

            <p>We send updates about once a week, and you can unsubscribe at any time.</p>
            
            <p>Ready to start exploring? Browse our current tours and find your next adventure!</p>
            
            <div class="footer">
              <p>City Discoverer - Expedition America Travel Co.</p>
              <p>discoverercity@gmail.com</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: subscriber.email,
    subject: "Welcome to City Discoverer Newsletter! 🗺️",
    html: welcomeHtml,
  });
}

export async function sendUserSignupNotification(
  userSignup: UserSignup
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || "discoverercity@gmail.com";
  
  const notificationHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .info-row { margin-bottom: 12px; }
          .label { font-weight: bold; color: #374151; }
          .value { color: #6b7280; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 New User Account Request</h1>
          </div>
          <div class="content">
            <p>A new user has requested an account for personalized city insights.</p>
            
            <div class="info-box">
              <h3>Account Details:</h3>
              <div class="info-row">
                <span class="label">Username:</span>
                <span class="value">${userSignup.username}</span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">${userSignup.email}</span>
              </div>
              <div class="info-row">
                <span class="label">First Name:</span>
                <span class="value">${userSignup.firstName}</span>
              </div>
              <div class="info-row">
                <span class="label">Last Name:</span>
                <span class="value">${userSignup.lastName}</span>
              </div>
              ${userSignup.website ? `
              <div class="info-row">
                <span class="label">Website:</span>
                <span class="value">${userSignup.website}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">Submitted:</span>
                <span class="value">${new Date(userSignup.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <p><strong>Next Steps:</strong></p>
            <p>Create this user account manually in WordPress and send them their login credentials.</p>
            
            <div class="footer">
              <p>City Discoverer - User Account Management</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: adminEmail,
    subject: `New Account Request: ${userSignup.username}`,
    html: notificationHtml,
  });
}
