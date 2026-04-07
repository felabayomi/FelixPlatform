# A & F Laundry Service - Scheduling Application

## Project Overview
A scheduling application for A & F Laundry Service located at EasyDesk by City Discoverer office, 50 Stately St, Suite 2, Wiley Ford, WV 26767. The application allows customers to schedule drop-off and pickup appointments for wash, dry, and fold laundry service.

## Contact Information
- **Phone**: 240-664-2270
- **Email**: aflaundryservice@gmail.com

## Business Requirements

### Service Details
- **Service Type**: Wash, dry, and fold
- **Location**: By appointment only at 50 Stately St, Suite 2, Wiley Ford, WV 26767
- **Operating Hours**: 9am - 6pm daily
- **Advance Booking**: Minimum 1 day in advance

### Pricing (Information Only - Payment Collected On-Site)
- **Standard Service**: $1.50 per pound
- **Heavy Items Surcharge**: $20 per item (duvets, rugs, etc.)
- Payment is collected on-site at drop-off

### Scheduling Options
- Customers can schedule drop-off appointments
- Pickup can be scheduled either:
  - During drop-off booking, OR
  - Separately at a later time
- **24-Hour Processing Requirement**: Pickup must be scheduled at least 24 hours after drop-off
- **Same-Day Service**: Not available through standard booking
  - Same-day drop-off and pickup requires special arrangement
  - Must be requested directly (not through online booking)
  - Fee: Double the standard rate
  - Final fee determined at drop-off based on volume and availability
  - Subject to availability and capacity

### Required Information
- **Customer Name**: Required
- **Customer Phone**: Required (minimum 10 digits)
- **Customer Email**: Required (valid email format)
- **Soap Type**: Required selection from:
  - Tide Regular
  - Tide Hypoallergenic
  - I provide my own

## Features Implemented

### Frontend Features
- ✅ Hero section with business branding
- ✅ Pricing information display
- ✅ Multi-step booking form (drop-off and pickup)
- ✅ Date/time validation (1 day advance, 9am-6pm slots)
- ✅ Soap type selection (required: Tide Regular, Tide Hypoallergenic, or customer-provided)
- ✅ Heavy items tracking with surcharge display
- ✅ Special instructions field
- ✅ Booking confirmation with reference number
- ✅ Location information with map
- ✅ Dark mode toggle
- ✅ Responsive mobile-first design
- ✅ **Progressive Web App (PWA)** - Installable to mobile home screens
  - Fullscreen display mode (no browser chrome)
  - Laundry service app icons (192x192, 512x512)
  - iOS and Android compatibility
  - Theme color integration (#2563eb blue)
  - Quick action shortcut for booking

### Backend Features
- ✅ REST API routes with Zod validation
  - POST /api/appointments - Create appointment
  - GET /api/appointments - List all appointments
  - PATCH /api/appointments/:id - Update appointment
  - DELETE /api/appointments/:id - Delete appointment
- ✅ In-memory storage (MemStorage) for appointments
- ✅ Email notifications via Resend API
  - Sends booking confirmations to aflaundryservice@gmail.com
  - Includes customer info, appointment details, reference number
  - Sent asynchronously (non-blocking)

### Admin Dashboard (/felabayomi/appointments)
- ✅ **Security**: Two-layer protection
  - Hidden URL: `/felabayomi/appointments` (obscured from customers)
  - Password Protection: Required password `19770520$&?`
  - Authentication persists via localStorage
- ✅ **Access**: Admin-only page (no public links)
- ✅ **Create Appointments**: Ability to create appointments for walk-ins and phone orders
  - All fields available (customer info, dates/times, soap type, heavy items, special instructions)
  - Automatic email notifications sent
- ✅ **Search & Filter**: 
  - Search by customer name, email, or phone
  - Filter by appointment status (all, scheduled, in-progress, completed, cancelled)
- ✅ **Appointment Management**:
  - Update status via dropdown (scheduled → in-progress → completed/cancelled)
  - Edit appointment details (customer info, dates/times, special instructions)
  - Delete appointments with confirmation dialog
- ✅ **Status Tracking**: Color-coded status badges
  - Scheduled (blue), In Progress (yellow), Completed (green), Cancelled (red)

## Testing
- ✅ End-to-end Playwright test covering complete booking flow
- ✅ Form validation tested (client and server-side)
- ✅ Admin dashboard features tested (search, filter, edit, delete, status updates)

## Email Configuration & Notification System
- **Service**: Resend API
- **Template**: Professional HTML email with company logo and brand styling
- **Recipients**: 
  - Business: aflaundryservice@gmail.com (receives booking confirmations only)
  - Customer: Receives all notifications (reminders, confirmations, thank you)
- **Sender**: Currently using onboarding@resend.dev (default)
  - To use custom domain (e.g., hello@aflaundryservice.com):
    1. Add and verify your domain in Resend dashboard
    2. Set up DNS records (SPF, DKIM, DMARC) with your domain provider
    3. Add SENDER_EMAIL environment variable with your custom email
- **Environment Variables**: 
  - RESEND_API_KEY (required, configured in Replit Secrets)
  - SENDER_EMAIL (optional, defaults to onboarding@resend.dev)

### Automated Email Notifications:
1. **Initial Booking Confirmation** - Sent immediately when appointment is created
2. **Drop-off Reminder (24 hours before)** - Includes location, what to bring, reschedule link
3. **Same-Day Drop-off Reminder (3 hours before)** - Quick reminder with reschedule option
4. **Same-Day Drop-off Reminder (2 hours before)** - Final reminder before appointment
5. **Pickup Reminder (24 hours before)** - Includes estimated cost, payment info, reschedule link
6. **Same-Day Pickup Reminder (3 hours before)** - Quick reminder with reschedule option
7. **Same-Day Pickup Reminder (2 hours before)** - Final reminder before pickup
8. **Laundry Ready Notification** - Sent when status changes to "Completed"
   - Informs customer their laundry is ready
   - Reminds them of scheduled pickup time
   - Offers option to pick up early during operating hours
9. **Thank You Email** - Sent after pickup time passes (status must be "Completed")
   - Service summary
   - Link to book next appointment
   - Request for feedback

### Reschedule System:
- ✅ **One-Click Reschedule Links** in all reminder emails
- ✅ **6-Hour Cutoff Policy** - Cannot reschedule within 6 hours of appointment
- ✅ **Secure Tokens** - Unique reschedule token for each appointment
- ✅ **Customer-Friendly** - No login required, just click link in email
- ✅ **Automatic Updates** - Changes reflected immediately in admin dashboard

### Reminder Scheduler:
- ✅ **Automated Checks** - Runs every hour via cron job
- ✅ **Smart Timing** - Sends reminders at optimal times (24h, 3h, 2h before)
- ✅ **No Duplicates** - Tracks sent reminders to prevent re-sending
- ✅ **Starts on Boot** - Begins checking immediately when server starts

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Routing**: Wouter
- **Storage**: In-memory (MemStorage) - can be upgraded to PostgreSQL later

## Design Guidelines
- Color scheme: Primary blue (#2563eb), clean white backgrounds
- Typography: Inter font family
- Mobile-first responsive design
- Professional, trust-inspiring aesthetic
