const pool = require('../db');
const { sendEmail } = require('../services/resendEmail');

const WACI_ADMIN_EMAIL = process.env.WACI_ADMIN_EMAIL || 'wildlifeaboutafrica@gmail.com';
const WACI_FROM_EMAIL = process.env.WACI_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'WACI Project Hub <noreply@wildlifeafrica.org>';

const ensureTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS waci_applications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id INTEGER REFERENCES waci_projects(id) ON DELETE SET NULL,
            project_slug TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            role_interest TEXT NOT NULL DEFAULT 'volunteer',
            motivation TEXT NOT NULL,
            experience TEXT,
            location TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            admin_notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            reviewed_at TIMESTAMPTZ
        )
    `);
};

/**
 * POST /api/waci-hub/apply
 * Public — no auth required
 */
exports.submitApplication = async (req, res) => {
    const { project_slug, name, email, phone, role_interest, motivation, experience, location } = req.body;

    if (!project_slug || !name || !email || !motivation) {
        return res.status(400).json({ error: 'project_slug, name, email, and motivation are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    try {
        await ensureTable();

        // Resolve project id from slug
        const projectResult = await pool.query(
            'SELECT id FROM waci_projects WHERE slug = $1 LIMIT 1',
            [project_slug]
        );
        const projectId = projectResult.rows[0]?.id || null;

        // Prevent duplicate submissions from the same email for the same project
        const dupe = await pool.query(
            `SELECT id FROM waci_applications WHERE email = $1 AND project_slug = $2 AND status != 'rejected' LIMIT 1`,
            [email.trim().toLowerCase(), project_slug]
        );
        if (dupe.rows.length) {
            return res.status(409).json({ error: 'You have already applied for this project.' });
        }

        const result = await pool.query(
            `INSERT INTO waci_applications
                (project_id, project_slug, name, email, phone, role_interest, motivation, experience, location)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id, created_at`,
            [
                projectId,
                project_slug,
                name.trim(),
                email.trim().toLowerCase(),
                phone?.trim() || null,
                role_interest || 'volunteer',
                motivation.trim(),
                experience?.trim() || null,
                location?.trim() || null,
            ]
        );

        res.status(201).json({ ok: true, id: result.rows[0].id });

        // Send emails after responding (fire-and-forget)
        const projectTitle = project_slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const roleLabel = role_interest === 'both' ? 'Volunteer & Grantee' : (role_interest === 'grantee' ? 'Grantee' : 'Volunteer');

        // Confirmation to applicant
        sendEmail({
            to: email.trim().toLowerCase(),
            subject: `Application received — ${projectTitle}`,
            appName: 'WACI Project Hub',
            html: `
                <p>Hi ${name.trim()},</p>
                <p>Thank you for applying to be a <strong>${roleLabel}</strong> on the <strong>${projectTitle}</strong> project with Wildlife Africa Conservation Initiative.</p>
                <p>Your application has been received and will be reviewed by our team. We will reach out to you if you are selected to move forward.</p>
                <p>Application details:</p>
                <ul>
                    <li><strong>Project:</strong> ${projectTitle}</li>
                    <li><strong>Role:</strong> ${roleLabel}</li>
                    ${location ? `<li><strong>Location:</strong> ${location}</li>` : ''}
                </ul>
                <p>If you have any questions, reply to this email or contact us at <a href="mailto:${WACI_ADMIN_EMAIL}">${WACI_ADMIN_EMAIL}</a>.</p>
                <p>Warm regards,<br>WACI Project Hub Team</p>
            `,
            text: `Hi ${name.trim()},\n\nThank you for applying to the ${projectTitle} project. We will review your application and contact you if selected.\n\nWACI Project Hub Team`,
        }).catch((err) => console.error('Applicant confirmation email error:', err));

        // Admin notification
        sendEmail({
            to: WACI_ADMIN_EMAIL,
            subject: `New application: ${name.trim()} — ${projectTitle}`,
            appName: 'WACI Project Hub',
            html: `
                <p>A new application was submitted on WACI Project Hub.</p>
                <table style="border-collapse:collapse;width:100%;max-width:540px">
                    <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:bold">Name</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${name.trim()}</td></tr>
                    <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:bold">Email</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${email.trim().toLowerCase()}</td></tr>
                    ${phone ? `<tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:bold">Phone</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${phone}</td></tr>` : ''}
                    <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:bold">Project</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${projectTitle}</td></tr>
                    <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:bold">Role interest</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${roleLabel}</td></tr>
                    ${location ? `<tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:bold">Location</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${location}</td></tr>` : ''}
                    <tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:bold">Motivation</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${motivation}</td></tr>
                    ${experience ? `<tr><td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:bold">Experience</td><td style="padding:6px 10px;border:1px solid #e5e7eb">${experience}</td></tr>` : ''}
                </table>
                <p style="margin-top:16px"><a href="https://felix-admin.vercel.app/#/waci-project-hub" style="background:#111827;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none">Review in Admin Dashboard</a></p>
            `,
            text: `New application from ${name.trim()} (${email}) for ${projectTitle} as ${roleLabel}.\n\nMotivation: ${motivation}`,
        }).catch((err) => console.error('Admin notification email error:', err));
    } catch (err) {
        console.error('submitApplication error:', err);
        res.status(500).json({ error: 'Failed to submit application' });
    }
};

/**
 * GET /api/waci-hub/applications
 * Admin only — list all applications
 */
exports.listApplications = async (req, res) => {
    try {
        await ensureTable();
        const result = await pool.query(
            `SELECT id, project_slug, name, email, phone, role_interest, motivation, experience, location, status, admin_notes, created_at, reviewed_at
             FROM waci_applications
             ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('listApplications error:', err);
        res.status(500).json({ error: 'Failed to load applications' });
    }
};

/**
 * PUT /api/waci-hub/applications/:id/status
 * Admin only — approve / reject / shortlist
 * Body: { status, admin_notes }
 */
exports.updateApplicationStatus = async (req, res) => {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    const allowed = ['pending', 'shortlisted', 'approved', 'rejected'];
    if (!allowed.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    }
    try {
        await ensureTable();
        await pool.query(
            `UPDATE waci_applications SET status = $1, admin_notes = $2, reviewed_at = NOW() WHERE id = $3`,
            [status, admin_notes || null, id]
        );
        res.json({ ok: true });
    } catch (err) {
        console.error('updateApplicationStatus error:', err);
        res.status(500).json({ error: 'Failed to update application' });
    }
};
