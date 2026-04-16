const pool = require('../db');

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
