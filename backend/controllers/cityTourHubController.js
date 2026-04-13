'use strict';

const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

/** Map a raw cth_tours DB row to the camelCase shape the frontend expects */
function formatTour(row) {
    return {
        id: row.id,
        city: row.city,
        state: row.state,
        description: row.description,
        highlights: row.highlights,
        startDate: row.start_date,
        endDate: row.end_date,
        maxParticipants: row.max_participants,
        currentParticipants: row.current_participants,
        imageUrl: row.image_url,
        createdAt: row.created_at,
    };
}

// ─── Table Bootstrap ─────────────────────────────────────────────────────────

let _tablesReady = null;
async function ensureTables() {
    if (_tablesReady) return _tablesReady;
    _tablesReady = pool.query(`
        CREATE TABLE IF NOT EXISTS cth_tours (
            id          VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            city        TEXT NOT NULL,
            state       TEXT NOT NULL,
            description TEXT NOT NULL,
            highlights  TEXT[] NOT NULL DEFAULT '{}',
            start_date  TEXT NOT NULL,
            end_date    TEXT NOT NULL,
            max_participants     INTEGER NOT NULL,
            current_participants INTEGER NOT NULL DEFAULT 0,
            image_url   TEXT NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS cth_signups (
            id              VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            tour_id         VARCHAR NOT NULL,
            full_name       TEXT NOT NULL,
            email           TEXT NOT NULL,
            phone           TEXT NOT NULL,
            participants    INTEGER NOT NULL,
            receive_updates INTEGER NOT NULL DEFAULT 0,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS cth_local_picks_signups (
            id                VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            full_name         TEXT NOT NULL,
            email             TEXT NOT NULL,
            phone             TEXT NOT NULL,
            preferred_states  TEXT NOT NULL,
            start_date        TEXT NOT NULL,
            end_date          TEXT NOT NULL,
            interests         TEXT NOT NULL,
            created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS cth_contact_messages (
            id         VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            full_name  TEXT NOT NULL,
            email      TEXT NOT NULL,
            subject    TEXT NOT NULL,
            message    TEXT NOT NULL,
            honeypot   TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS cth_newsletter_subscribers (
            id            VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            email         TEXT NOT NULL UNIQUE,
            subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS cth_user_signups (
            id         VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            username   TEXT NOT NULL,
            email      TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name  TEXT NOT NULL,
            website    TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);
    return _tablesReady;
}

// ─── Email helpers ────────────────────────────────────────────────────────────

async function sendEmail({ to, subject, html }) {
    const resendApiKey = process.env.CITY_TOUR_HUB_RESEND_API_KEY
        || process.env.CITYTOURHUB_RESEND_API_KEY
        || process.env.RESEND_API_KEY;
    const configuredFromEmail = process.env.CITY_TOUR_HUB_RESEND_FROM_EMAIL
        || process.env.CITYTOURHUB_RESEND_FROM_EMAIL
        || process.env.RESEND_FROM_EMAIL
        || 'onboarding@resend.dev';
    const fallbackFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    if (!resendApiKey) {
        console.warn('[CityTourHub] RESEND_API_KEY not configured. Email not sent.');
        return {
            sent: false,
            reason: 'Missing RESEND_API_KEY',
        };
    }

    const fromCandidates = [...new Set([configuredFromEmail, fallbackFromEmail].filter(Boolean))];
    let lastError = null;

    for (const fromEmail of fromCandidates) {
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
                body: JSON.stringify({ from: fromEmail, to, subject, html }),
            });

            if (response.ok) {
                return {
                    sent: true,
                    from: fromEmail,
                };
            }

            const errorText = await response.text();
            lastError = `HTTP ${response.status}: ${errorText}`;
            console.error(`[CityTourHub] Email send failed (from: ${fromEmail}):`, errorText);
        } catch (err) {
            lastError = err instanceof Error ? err.message : String(err);
            console.error(`[CityTourHub] Email error (from: ${fromEmail}):`, err);
        }
    }

    return {
        sent: false,
        reason: lastError || 'Unknown email send failure',
    };
}

const ADMIN_EMAIL = () => process.env.CITY_TOUR_HUB_ADMIN_EMAIL
    || process.env.CITYTOURHUB_ADMIN_EMAIL
    || process.env.ADMIN_EMAIL
    || 'discoverercity@gmail.com';

async function emailSignupConfirmation(signup, tour) {
    await sendEmail({
        to: signup.email,
        subject: `Tour Confirmed: ${tour.city}, ${tour.state} - ${tour.start_date}`,
        html: `<!DOCTYPE html><html><head><style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0}
.content{background:#f9fafb;padding:30px;border-radius:0 0 8px 8px}
.tour-details{background:white;padding:20px;margin:20px 0;border-radius:8px;border-left:4px solid #667eea}
.highlight{color:#667eea;font-weight:bold}
.footer{text-align:center;margin-top:30px;font-size:12px;color:#6b7280}
</style></head><body><div class="container">
<div class="header"><h1>🎉 Tour Confirmed!</h1><p>Your spot is reserved for ${tour.city}, ${tour.state}</p></div>
<div class="content">
<p>Hi ${signup.full_name},</p>
<p>Thank you for booking your tour with City Discoverer! We're excited to explore <strong>${tour.city}, ${tour.state}</strong> with you.</p>
<div class="tour-details">
<h3>Tour Details</h3>
<p><strong>Destination:</strong> ${tour.city}, ${tour.state}</p>
<p><strong>Dates:</strong> ${tour.start_date} – ${tour.end_date}</p>
<p><strong>Number of Participants:</strong> ${signup.participants}</p>
<p><strong>Confirmation Email:</strong> ${signup.email}</p>
<p><strong>Contact Phone:</strong> ${signup.phone}</p>
</div>
<h3>What's Next?</h3>
<p>We'll send you detailed information about meeting location, packing suggestions, payment info and the full tour itinerary.</p>
<p>See you soon!<br><span class="highlight">The City Discoverer Team</span></p>
</div>
<div class="footer"><p>City Discoverer – Expedition America Travel Co.</p><p>Discover America, one city at a time</p></div>
</div></body></html>`,
    });
}

async function emailSignupAdminNotification(signup, tour) {
    await sendEmail({
        to: ADMIN_EMAIL(),
        subject: `New Signup: ${tour.city}, ${tour.state} - ${signup.full_name}`,
        html: `<!DOCTYPE html><html><head><style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:#1f2937;color:white;padding:20px;border-radius:8px 8px 0 0}
.content{background:#f9fafb;padding:20px;border-radius:0 0 8px 8px}
.info-box{background:white;padding:15px;margin:10px 0;border-radius:6px}
.label{font-weight:bold;color:#4b5563}
</style></head><body><div class="container">
<div class="header"><h2>🎟️ New Tour Signup</h2></div>
<div class="content">
<p>A new participant has signed up for a tour!</p>
<div class="info-box">
<p><span class="label">Tour:</span> ${tour.city}, ${tour.state}</p>
<p><span class="label">Dates:</span> ${tour.start_date} – ${tour.end_date}</p>
<p><span class="label">Spots:</span> ${Number(tour.current_participants) + Number(signup.participants)} / ${tour.max_participants}</p>
</div>
<div class="info-box">
<p><span class="label">Name:</span> ${signup.full_name}</p>
<p><span class="label">Email:</span> ${signup.email}</p>
<p><span class="label">Phone:</span> ${signup.phone}</p>
<p><span class="label">Participants:</span> ${signup.participants}</p>
<p><span class="label">Receive Updates:</span> ${signup.receive_updates ? 'Yes' : 'No'}</p>
</div>
</div></div></body></html>`,
    });
}

async function emailLocalPicksConfirmation(signup) {
    await sendEmail({
        to: signup.email,
        subject: 'Welcome to City Discoverer Local Picks!',
        html: `<!DOCTYPE html><html><head><style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0}
.content{background:#f9fafb;padding:30px;border-radius:0 0 8px 8px}
.info-box{background:white;padding:20px;margin:20px 0;border-radius:8px;border-left:4px solid #10b981}
.highlight{color:#10b981;font-weight:bold}
.footer{text-align:center;margin-top:30px;font-size:12px;color:#6b7280}
</style></head><body><div class="container">
<div class="header"><h1>🗺️ Thanks for Joining Local Picks!</h1><p>We'll curate personalized tour recommendations just for you</p></div>
<div class="content">
<p>Hi ${signup.full_name},</p>
<p>Thank you for signing up for Local Picks! We're excited to help you discover hidden gems and unique experiences tailored to your interests.</p>
<div class="info-box">
<h3>Your Preferences</h3>
<p><strong>Preferred States:</strong> ${signup.preferred_states}</p>
<p><strong>Travel Dates:</strong> ${signup.start_date} to ${signup.end_date}</p>
<p><strong>Interests:</strong> ${signup.interests}</p>
</div>
<p>Our team will review your preferences and reach out within 2-3 business days!</p>
<p>Happy exploring!<br><span class="highlight">The City Discoverer Team</span></p>
</div>
<div class="footer"><p>City Discoverer – Expedition America Travel Co.</p></div>
</div></body></html>`,
    });
}

async function emailLocalPicksAdminNotification(signup) {
    await sendEmail({
        to: ADMIN_EMAIL(),
        subject: `New Local Picks Signup: ${signup.full_name}`,
        html: `<!DOCTYPE html><html><head><style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:#1f2937;color:white;padding:20px;border-radius:8px 8px 0 0}
.content{background:#f9fafb;padding:20px;border-radius:0 0 8px 8px}
.info-box{background:white;padding:15px;margin:10px 0;border-radius:6px}
.label{font-weight:bold;color:#4b5563}
</style></head><body><div class="container">
<div class="header"><h2>🗺️ New Local Picks Signup</h2></div>
<div class="content">
<div class="info-box">
<p><span class="label">Name:</span> ${signup.full_name}</p>
<p><span class="label">Email:</span> ${signup.email}</p>
<p><span class="label">Phone:</span> ${signup.phone}</p>
</div>
<div class="info-box">
<p><span class="label">Preferred States:</span><br>${signup.preferred_states}</p>
<p><span class="label">Travel Dates:</span><br>${signup.start_date} to ${signup.end_date}</p>
<p><span class="label">Interests:</span><br>${signup.interests}</p>
</div>
<p><strong>Action Required:</strong> Review and send personalized recommendations.</p>
</div></div></body></html>`,
    });
}

async function emailContactConfirmation(msg) {
    return sendEmail({
        to: msg.email,
        subject: 'We received your message - City Discoverer',
        html: `<!DOCTYPE html><html><head><style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0}
.content{background:#f9fafb;padding:30px;border-radius:0 0 8px 8px}
.message-box{background:white;padding:20px;margin:20px 0;border-radius:8px;border-left:4px solid #667eea}
.footer{text-align:center;margin-top:30px;font-size:12px;color:#6b7280}
</style></head><body><div class="container">
<div class="header"><h1>📬 Message Received!</h1></div>
<div class="content">
<p>Hi ${msg.full_name},</p>
<p>Thank you for contacting City Discoverer! We've received your message and will get back to you within 24-48 hours.</p>
<div class="message-box">
<h3>Your Message Details</h3>
<p><strong>Subject:</strong> ${msg.subject}</p>
<p><strong>Message:</strong></p>
<p>${msg.message}</p>
</div>
</div>
<div class="footer"><p>City Discoverer – Expedition America Travel Co.</p></div>
</div></body></html>`,
    });
}

async function emailContactAdminNotification(msg) {
    return sendEmail({
        to: ADMIN_EMAIL(),
        subject: `New Contact Message: ${msg.subject}`,
        html: `<!DOCTYPE html><html><head><style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:#1f2937;color:white;padding:20px;border-radius:8px 8px 0 0}
.content{background:#f9fafb;padding:20px;border-radius:0 0 8px 8px}
.info-box{background:white;padding:15px;margin:10px 0;border-radius:6px}
.label{font-weight:bold;color:#4b5563}
</style></head><body><div class="container">
<div class="header"><h2>📧 New Contact Form Submission</h2></div>
<div class="content">
<div class="info-box">
<p><span class="label">Name:</span> ${msg.full_name}</p>
<p><span class="label">Email:</span> ${msg.email}</p>
<p><span class="label">Subject:</span> ${msg.subject}</p>
</div>
<div class="info-box"><p><span class="label">Message:</span></p><p>${msg.message}</p></div>
<p><strong>Action Required:</strong> Respond to ${msg.email} within 24-48 hours.</p>
</div></div></body></html>`,
    });
}

async function emailNewsletterWelcome(subscriber) {
    await sendEmail({
        to: subscriber.email,
        subject: 'Welcome to City Discoverer Newsletter! 🗺️',
        html: `<!DOCTYPE html><html><head><style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0}
.content{background:#f9fafb;padding:30px;border-radius:0 0 8px 8px}
.info-box{background:white;padding:20px;margin:20px 0;border-radius:8px;border-left:4px solid #667eea}
.footer{text-align:center;margin-top:30px;font-size:12px;color:#6b7280}
</style></head><body><div class="container">
<div class="header"><h1>🎉 Welcome to City Discoverer!</h1></div>
<div class="content">
<p>Hi there!</p>
<p>Thank you for subscribing to the City Discoverer newsletter! We're thrilled to have you join our community of curious travelers.</p>
<div class="info-box">
<h3>What to Expect:</h3>
<ul>
<li><strong>New Tour Announcements:</strong> Be the first to know about our latest group tours</li>
<li><strong>Destination Guides:</strong> Insider tips and hidden gems from local experts</li>
<li><strong>Exclusive Offers:</strong> Special discounts and early-bird pricing for subscribers</li>
<li><strong>Travel Inspiration:</strong> Stories and photos from fellow travelers</li>
</ul>
</div>
</div>
<div class="footer"><p>City Discoverer – Expedition America Travel Co.</p></div>
</div></body></html>`,
    });
}

async function emailUserSignupNotification(userSignup) {
    await sendEmail({
        to: ADMIN_EMAIL(),
        subject: `New Account Request: ${userSignup.username}`,
        html: `<!DOCTYPE html><html><head><style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0}
.content{background:#f9fafb;padding:30px;border-radius:0 0 8px 8px}
.info-box{background:white;padding:20px;margin:20px 0;border-radius:8px;border-left:4px solid #667eea}
.footer{text-align:center;margin-top:30px;font-size:12px;color:#6b7280}
</style></head><body><div class="container">
<div class="header"><h1>🎯 New User Account Request</h1></div>
<div class="content">
<p>A new user has requested an account for personalized city insights.</p>
<div class="info-box">
<h3>Account Details:</h3>
<p><strong>Username:</strong> ${userSignup.username}</p>
<p><strong>Email:</strong> ${userSignup.email}</p>
<p><strong>Name:</strong> ${userSignup.first_name} ${userSignup.last_name}</p>
${userSignup.website ? `<p><strong>Website:</strong> ${userSignup.website}</p>` : ''}
<p><strong>Submitted:</strong> ${new Date(userSignup.created_at).toLocaleString()}</p>
</div>
<p><strong>Next Steps:</strong> Create this user account manually and send login credentials.</p>
</div>
<div class="footer"><p>City Discoverer – User Account Management</p></div>
</div></body></html>`,
    });
}

// ─── Tours ────────────────────────────────────────────────────────────────────

exports.getTours = async (req, res) => {
    try {
        await ensureTables();
        const { rows } = await pool.query(
            "SELECT * FROM cth_tours ORDER BY TO_DATE(start_date, 'FMMonth FMDD, YYYY') ASC, created_at ASC"
        );
        res.json(rows.map(formatTour));
    } catch (err) {
        console.error('[CityTourHub] getTours:', err);
        res.status(500).json({ error: 'Failed to fetch tours' });
    }
};

exports.getTour = async (req, res) => {
    try {
        await ensureTables();
        const { rows } = await pool.query('SELECT * FROM cth_tours WHERE id = $1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Tour not found' });
        res.json(formatTour(rows[0]));
    } catch (err) {
        console.error('[CityTourHub] getTour:', err);
        res.status(500).json({ error: 'Failed to fetch tour' });
    }
};

exports.createTour = async (req, res) => {
    try {
        await ensureTables();
        const { city, state, description, highlights = [], startDate, endDate, maxParticipants, currentParticipants = 0, imageUrl } = req.body;
        if (!city || !state || !description || !startDate || !endDate || !maxParticipants || !imageUrl) {
            return res.status(400).json({ error: 'Missing required tour fields' });
        }
        const { rows } = await pool.query(
            `INSERT INTO cth_tours (city, state, description, highlights, start_date, end_date, max_participants, current_participants, image_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [city, state, description, highlights, startDate, endDate, Number(maxParticipants), Number(currentParticipants), imageUrl]
        );
        res.status(201).json(formatTour(rows[0]));
    } catch (err) {
        console.error('[CityTourHub] createTour:', err);
        res.status(500).json({ error: 'Failed to create tour' });
    }
};

exports.updateTour = async (req, res) => {
    try {
        await ensureTables();
        const { rows: existing } = await pool.query('SELECT * FROM cth_tours WHERE id = $1', [req.params.id]);
        if (!existing.length) return res.status(404).json({ error: 'Tour not found' });

        const tour = existing[0];
        const b = req.body;
        const city = b.city ?? tour.city;
        const state = b.state ?? tour.state;
        const description = b.description ?? tour.description;
        const highlights = b.highlights ?? tour.highlights;
        const startDate = b.startDate ?? tour.start_date;
        const endDate = b.endDate ?? tour.end_date;
        const maxParticipants = b.maxParticipants !== undefined ? Number(b.maxParticipants) : tour.max_participants;
        const currentParticipants = b.currentParticipants !== undefined ? Number(b.currentParticipants) : tour.current_participants;
        const imageUrl = b.imageUrl ?? tour.image_url;

        const { rows } = await pool.query(
            `UPDATE cth_tours SET city=$1, state=$2, description=$3, highlights=$4, start_date=$5, end_date=$6,
             max_participants=$7, current_participants=$8, image_url=$9 WHERE id=$10 RETURNING *`,
            [city, state, description, highlights, startDate, endDate, maxParticipants, currentParticipants, imageUrl, req.params.id]
        );
        res.json(formatTour(rows[0]));
    } catch (err) {
        console.error('[CityTourHub] updateTour:', err);
        res.status(500).json({ error: 'Failed to update tour' });
    }
};

exports.deleteTour = async (req, res) => {
    try {
        await ensureTables();
        const { rowCount } = await pool.query('DELETE FROM cth_tours WHERE id = $1', [req.params.id]);
        if (!rowCount) return res.status(404).json({ error: 'Tour not found' });
        res.status(204).send();
    } catch (err) {
        console.error('[CityTourHub] deleteTour:', err);
        res.status(500).json({ error: 'Failed to delete tour' });
    }
};

exports.handleUploadedImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
    }

    return res.json({ url: req.storedImage?.imageUrl || null, storage: req.storedImage?.storage || 'local' });
};

// ─── Signups ──────────────────────────────────────────────────────────────────

exports.createSignup = async (req, res) => {
    try {
        await ensureTables();
        const { tourId, fullName, email, phone, participants, receiveUpdates = 0 } = req.body;
        if (!tourId || !fullName || !email || !phone || !participants) {
            return res.status(400).json({ error: 'Missing required signup fields' });
        }

        const { rows: tourRows } = await pool.query('SELECT * FROM cth_tours WHERE id = $1', [tourId]);
        if (!tourRows.length) return res.status(404).json({ error: 'Tour not found' });
        const tour = tourRows[0];

        const spotsLeft = tour.max_participants - tour.current_participants;
        if (spotsLeft < Number(participants)) {
            return res.status(400).json({ error: `Not enough spots available. Only ${spotsLeft} spots remaining.` });
        }

        const { rows } = await pool.query(
            `INSERT INTO cth_signups (tour_id, full_name, email, phone, participants, receive_updates)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [tourId, fullName, email, phone, Number(participants), receiveUpdates ? 1 : 0]
        );
        const signup = rows[0];

        // Update participant count
        await pool.query(
            'UPDATE cth_tours SET current_participants = current_participants + $1 WHERE id = $2',
            [Number(participants), tourId]
        );

        emailSignupConfirmation(signup, tour).catch((e) => console.error('[CityTourHub] signup confirmation email:', e));
        emailSignupAdminNotification(signup, tour).catch((e) => console.error('[CityTourHub] signup admin email:', e));

        res.status(201).json(signup);
    } catch (err) {
        console.error('[CityTourHub] createSignup:', err);
        res.status(500).json({ error: 'Failed to create signup' });
    }
};

exports.getSignups = async (req, res) => {
    try {
        await ensureTables();
        const { rows } = await pool.query('SELECT * FROM cth_signups ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('[CityTourHub] getSignups:', err);
        res.status(500).json({ error: 'Failed to fetch signups' });
    }
};

exports.getSignupsByTour = async (req, res) => {
    try {
        await ensureTables();
        const { rows } = await pool.query('SELECT * FROM cth_signups WHERE tour_id = $1 ORDER BY created_at DESC', [req.params.tourId]);
        res.json(rows);
    } catch (err) {
        console.error('[CityTourHub] getSignupsByTour:', err);
        res.status(500).json({ error: 'Failed to fetch signups' });
    }
};

// ─── Local Picks ──────────────────────────────────────────────────────────────

exports.createLocalPicksSignup = async (req, res) => {
    try {
        await ensureTables();
        const { fullName, email, phone, preferredStates, startDate, endDate, interests } = req.body;
        if (!fullName || !email || !phone || !preferredStates || !startDate || !endDate || !interests) {
            return res.status(400).json({ error: 'Missing required local picks fields' });
        }
        const { rows } = await pool.query(
            `INSERT INTO cth_local_picks_signups (full_name, email, phone, preferred_states, start_date, end_date, interests)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [fullName, email, phone, preferredStates, startDate, endDate, interests]
        );
        const signup = rows[0];
        emailLocalPicksConfirmation(signup).catch((e) => console.error('[CityTourHub] local picks confirmation email:', e));
        emailLocalPicksAdminNotification(signup).catch((e) => console.error('[CityTourHub] local picks admin email:', e));
        res.status(201).json(signup);
    } catch (err) {
        console.error('[CityTourHub] createLocalPicksSignup:', err);
        res.status(500).json({ error: 'Failed to create local picks signup' });
    }
};

exports.getLocalPicksSignups = async (req, res) => {
    try {
        await ensureTables();
        const { rows } = await pool.query('SELECT * FROM cth_local_picks_signups ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('[CityTourHub] getLocalPicksSignups:', err);
        res.status(500).json({ error: 'Failed to fetch local picks signups' });
    }
};

// ─── Contact ──────────────────────────────────────────────────────────────────

exports.createContactMessage = async (req, res) => {
    try {
        await ensureTables();
        const { fullName, email, subject, message, honeypot } = req.body;

        // Honeypot check
        if (honeypot && honeypot.length > 0) {
            return res.status(400).json({ error: 'Invalid submission' });
        }

        if (!fullName || !email || !subject || !message) {
            return res.status(400).json({ error: 'Missing required contact fields' });
        }

        const { rows } = await pool.query(
            `INSERT INTO cth_contact_messages (full_name, email, subject, message, honeypot)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [fullName, email, subject, message, honeypot || null]
        );
        const msg = rows[0];
        const [confirmationResult, adminResult] = await Promise.all([
            emailContactConfirmation(msg),
            emailContactAdminNotification(msg),
        ]);

        if (!confirmationResult?.sent || !adminResult?.sent) {
            console.warn('[CityTourHub] contact email delivery issues:', {
                userEmailSent: Boolean(confirmationResult?.sent),
                adminEmailSent: Boolean(adminResult?.sent),
                userEmailReason: confirmationResult?.reason || null,
                adminEmailReason: adminResult?.reason || null,
            });
        }

        res.status(201).json({
            ...msg,
            emailStatus: {
                userEmailSent: Boolean(confirmationResult?.sent),
                adminEmailSent: Boolean(adminResult?.sent),
            },
        });
    } catch (err) {
        console.error('[CityTourHub] createContactMessage:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

exports.getContactMessages = async (req, res) => {
    try {
        await ensureTables();
        const { rows } = await pool.query('SELECT * FROM cth_contact_messages ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('[CityTourHub] getContactMessages:', err);
        res.status(500).json({ error: 'Failed to fetch contact messages' });
    }
};

// ─── Newsletter ───────────────────────────────────────────────────────────────

exports.subscribeNewsletter = async (req, res) => {
    try {
        await ensureTables();
        const { email } = req.body;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Valid email is required' });
        }
        const { rows } = await pool.query(
            'INSERT INTO cth_newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING RETURNING *',
            [email]
        );
        if (!rows.length) {
            return res.status(400).json({ error: 'This email is already subscribed to our newsletter' });
        }
        emailNewsletterWelcome(rows[0]).catch((e) => console.error('[CityTourHub] newsletter welcome email:', e));
        res.status(201).json({ message: 'Successfully subscribed to newsletter!' });
    } catch (err) {
        console.error('[CityTourHub] subscribeNewsletter:', err);
        res.status(500).json({ error: 'Failed to subscribe to newsletter' });
    }
};

exports.getNewsletterSubscribers = async (req, res) => {
    try {
        await ensureTables();
        const { rows } = await pool.query('SELECT * FROM cth_newsletter_subscribers ORDER BY subscribed_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('[CityTourHub] getNewsletterSubscribers:', err);
        res.status(500).json({ error: 'Failed to fetch subscribers' });
    }
};

// ─── User Signups ─────────────────────────────────────────────────────────────

exports.createUserSignup = async (req, res) => {
    try {
        await ensureTables();
        const { username, email, firstName, lastName, website } = req.body;
        if (!username || !email || !firstName || !lastName) {
            return res.status(400).json({ error: 'Missing required user signup fields' });
        }
        const { rows } = await pool.query(
            `INSERT INTO cth_user_signups (username, email, first_name, last_name, website)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [username, email, firstName, lastName, website || null]
        );
        const userSignup = rows[0];
        emailUserSignupNotification(userSignup).catch((e) => console.error('[CityTourHub] user signup email:', e));
        res.status(201).json({ message: 'Account request submitted successfully!' });
    } catch (err) {
        console.error('[CityTourHub] createUserSignup:', err);
        res.status(500).json({ error: 'Failed to submit account request' });
    }
};

exports.getUserSignups = async (req, res) => {
    try {
        await ensureTables();
        const { rows } = await pool.query('SELECT * FROM cth_user_signups ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('[CityTourHub] getUserSignups:', err);
        res.status(500).json({ error: 'Failed to fetch user signups' });
    }
};

// ─── Admin stats ──────────────────────────────────────────────────────────────

exports.getAdminStats = async (req, res) => {
    try {
        await ensureTables();
        const [tours, signups, localPicks, contacts, subscribers, userSignups] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM cth_tours'),
            pool.query('SELECT COUNT(*) FROM cth_signups'),
            pool.query('SELECT COUNT(*) FROM cth_local_picks_signups'),
            pool.query('SELECT COUNT(*) FROM cth_contact_messages'),
            pool.query('SELECT COUNT(*) FROM cth_newsletter_subscribers'),
            pool.query('SELECT COUNT(*) FROM cth_user_signups'),
        ]);
        res.json({
            tours: Number(tours.rows[0].count),
            signups: Number(signups.rows[0].count),
            localPicksSignups: Number(localPicks.rows[0].count),
            contactMessages: Number(contacts.rows[0].count),
            newsletterSubscribers: Number(subscribers.rows[0].count),
            userSignups: Number(userSignups.rows[0].count),
        });
    } catch (err) {
        console.error('[CityTourHub] getAdminStats:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};
