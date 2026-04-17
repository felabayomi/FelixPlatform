const pool = require('../db');
const https = require('https');
const { ensureWaciProjectHubSchema } = require('../services/ensureWaciProjectHubSchema');

exports.generateProject = async (req, res) => {
    const { input } = req.body;
    if (!input) return res.status(400).json({ error: 'input is required' });

    const OPENAI_KEY = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) return res.status(500).json({ error: 'Missing OpenAI API key' });

    const systemPrompt = `You are a conservation project designer for WACI (Wildlife Africa Conservation Initiative).
Design a UNIQUE, research-backed, grant-ready conservation project based on the user's input.
Tailor every field specifically to the exact species, ecosystem, and region mentioned.
Do NOT reuse content from any previous project.

STRICT RULES:
- One project = one grantee, monthly funding model
- Must be practical and field-executable in the specific region
- Keep scope small and realistic
- Max 5 objectives, max 6 deliverables
- Reporting must include: daily logs, monthly report, final report
- Monthly funding between $100 and $500

Return ONLY a valid JSON object (no markdown, no code fences) with these exact keys:
title, location, summary, focus, durationMonths, monthlyFunding, objectives (array), deliverables (array), methodology (array), reportingRequirements (array)`;

    const body = JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input },
        ],
        temperature: 0.8,
    });

    try {
        const parsed = await new Promise((resolve, reject) => {
            const reqOptions = {
                hostname: 'api.openai.com',
                path: '/v1/chat/completions',
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${OPENAI_KEY}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                },
            };
            const request = https.request(reqOptions, (response) => {
                let data = '';
                response.on('data', (chunk) => { data += chunk; });
                response.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.error) return reject(new Error(json.error.message));
                        resolve(JSON.parse(json.choices[0].message.content));
                    } catch (e) { reject(e); }
                });
            });
            request.on('error', reject);
            request.write(body);
            request.end();
        });
        return res.json(parsed);
    } catch (err) {
        console.error('[WACI:generateProject]', err.message);
        return res.status(500).json({ error: err.message || 'AI generation failed' });
    }
};

exports.generateProject = async (req, res) => {
    const { input } = req.body;
    if (!input) return res.status(400).json({ error: 'input is required' });

    const OPENAI_KEY = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) return res.status(500).json({ error: 'Missing OpenAI API key' });

    const systemPrompt = `You are a conservation project designer for WACI (Wildlife Africa Conservation Initiative).
Design a UNIQUE, research-backed, grant-ready conservation project based on the user's input.
Tailor every field specifically to the exact species, ecosystem, and region mentioned.
Do NOT reuse content from any previous project.

STRICT RULES:
- One project = one grantee, monthly funding model
- Must be practical and field-executable in the specific region
- Keep scope small and realistic
- Max 5 objectives, max 6 deliverables
- Reporting must include: daily logs, monthly report, final report
- Monthly funding between $100 and $500

Return ONLY a valid JSON object (no markdown, no code fences) with these exact keys:
title, location, summary, focus, durationMonths, monthlyFunding, objectives (array), deliverables (array), methodology (array), reportingRequirements (array)`;

    try {
        const openaiRes = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o',
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: input },
                ],
                temperature: 0.8,
            },
            { headers: { Authorization: `Bearer ${OPENAI_KEY}` } }
        );
        const parsed = JSON.parse(openaiRes.data.choices[0].message.content);
        return res.json(parsed);
    } catch (err) {
        console.error('[WACI:generateProject]', err?.response?.data || err.message);
        return res.status(500).json({ error: err?.response?.data?.error?.message || 'AI generation failed' });
    }
};

// ─── Projects ────────────────────────────────────────────────

exports.getProjects = async (req, res) => {
    try {
        await ensureWaciProjectHubSchema();
        const { status } = req.query;
        const params = [];
        let where = '';
        if (status) {
            params.push(status);
            where = `WHERE p.status = $${params.length}`;
        }
        const result = await pool.query(
            `SELECT p.*,
                    u.name AS created_by_name,
                    COUNT(DISTINCT a.id)::int AS assignment_count
             FROM waci_projects p
             LEFT JOIN users u ON u.id = p.created_by
             LEFT JOIN waci_project_assignments a ON a.project_id = p.id
             ${where}
             GROUP BY p.id, u.name
             ORDER BY p.created_at DESC`,
            params
        );
        res.json(result.rows);
    } catch (err) {
        // Fallback when optional relationship tables are absent in older DB snapshots.
        if (err?.code === '42P01' || err?.code === '42703') {
            try {
                const { status } = req.query;
                const params = [];
                let where = '';
                if (status) {
                    params.push(status);
                    where = `WHERE p.status = $${params.length}`;
                }

                const fallback = await pool.query(
                    `SELECT p.*, 0::int AS assignment_count
                     FROM waci_projects p
                     ${where}
                     ORDER BY p.created_at DESC`,
                    params
                );
                return res.json(fallback.rows);
            } catch (fallbackErr) {
                console.error('[WACI:getProjects:fallback]', fallbackErr);
            }
        }

        console.error('[WACI:getProjects]', err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};

exports.getProject = async (req, res) => {
    try {
        await ensureWaciProjectHubSchema();
        const { slug } = req.params;
        const result = await pool.query(
            `SELECT p.*, u.name AS created_by_name
             FROM waci_projects p
             LEFT JOIN users u ON u.id = p.created_by
             WHERE p.slug = $1 OR p.id::text = $1 LIMIT 1`,
            [slug]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Project not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
};

exports.createProject = async (req, res) => {
    try {
        await ensureWaciProjectHubSchema();
        const {
            title, slug, purpose, objectives, methodology,
            deliverables, expectations, region, status,
            start_date, end_date,
        } = req.body;

        if (!title || !slug) {
            return res.status(400).json({ error: 'title and slug are required' });
        }

        const result = await pool.query(
            `INSERT INTO waci_projects
                (title, slug, purpose, objectives, methodology, deliverables,
                 expectations, region, status, start_date, end_date, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             RETURNING *`,
            [
                title, slug, purpose || null, objectives || null,
                methodology || null, deliverables || null, expectations || null,
                region || null, status || 'active',
                start_date || null, end_date || null,
                req.user?.id || null,
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') return res.status(409).json({ error: 'A project with this slug already exists' });
        res.status(500).json({ error: 'Failed to create project' });
    }
};

exports.updateProject = async (req, res) => {
    try {
        await ensureWaciProjectHubSchema();
        const { id } = req.params;
        const {
            title, slug, purpose, objectives, methodology,
            deliverables, expectations, region, status,
            start_date, end_date,
        } = req.body;

        const result = await pool.query(
            `UPDATE waci_projects SET
                title = COALESCE($1, title),
                slug = COALESCE($2, slug),
                purpose = COALESCE($3, purpose),
                objectives = COALESCE($4, objectives),
                methodology = COALESCE($5, methodology),
                deliverables = COALESCE($6, deliverables),
                expectations = COALESCE($7, expectations),
                region = COALESCE($8, region),
                status = COALESCE($9, status),
                start_date = COALESCE($10, start_date),
                end_date = COALESCE($11, end_date),
                updated_at = NOW()
             WHERE id = $12 RETURNING *`,
            [
                title || null, slug || null, purpose || null, objectives || null,
                methodology || null, deliverables || null, expectations || null,
                region || null, status || null, start_date || null, end_date || null,
                id,
            ]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Project not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') return res.status(409).json({ error: 'Slug already in use' });
        res.status(500).json({ error: 'Failed to update project' });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        await ensureWaciProjectHubSchema();
        const { id } = req.params;
        const result = await pool.query('DELETE FROM waci_projects WHERE id = $1 RETURNING id', [id]);
        if (!result.rows.length) return res.status(404).json({ error: 'Project not found' });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete project' });
    }
};

// ─── Assignments ─────────────────────────────────────────────

exports.getAssignments = async (req, res) => {
    try {
        await ensureWaciProjectHubSchema();
        const { projectId } = req.params;
        const result = await pool.query(
            `SELECT a.*, u.name, u.email, p.title AS project_title
             FROM waci_project_assignments a
             JOIN users u ON u.id = a.user_id
             JOIN waci_projects p ON p.id = a.project_id
             WHERE a.project_id = $1
             ORDER BY a.assigned_at DESC`,
            [projectId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
};

exports.assignVolunteer = async (req, res) => {
    try {
        await ensureWaciProjectHubSchema();
        const { projectId } = req.params;
        const { user_id, role } = req.body;
        if (!user_id) return res.status(400).json({ error: 'user_id is required' });

        const result = await pool.query(
            `INSERT INTO waci_project_assignments (project_id, user_id, role)
             VALUES ($1, $2, $3)
             ON CONFLICT (project_id, user_id)
             DO UPDATE SET role = EXCLUDED.role, status = 'active'
             RETURNING *`,
            [projectId, user_id, role || 'volunteer']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to assign volunteer' });
    }
};

exports.removeAssignment = async (req, res) => {
    try {
        await ensureWaciProjectHubSchema();
        const { projectId, userId } = req.params;
        const result = await pool.query(
            `UPDATE waci_project_assignments SET status = 'removed'
             WHERE project_id = $1 AND user_id = $2 RETURNING id`,
            [projectId, userId]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Assignment not found' });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to remove assignment' });
    }
};

// ─── Project-centric workflow connectors ─────────────────────

exports.getProjectGrant = async (req, res) => {
    try {
        await ensureWaciProjectHubSchema();
        const { id } = req.params;
        const result = await pool.query(
            `SELECT g.*,
                    p.title AS project_title,
                    p.slug AS project_slug,
                    COALESCE(g.volunteer_name, u.name) AS volunteer_name,
                    COALESCE(g.volunteer_email, u.email) AS volunteer_email
             FROM waci_grant_offers g
             JOIN waci_projects p ON p.id = g.project_id
             LEFT JOIN users u ON u.id = g.user_id
             WHERE g.project_id = $1
             ORDER BY g.created_at DESC
             LIMIT 1`,
            [id]
        );

        res.json(result.rows[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch project grant' });
    }
};

exports.getProjectReports = async (req, res) => {
    try {
        await ensureWaciProjectHubSchema();
        const { id } = req.params;
        const reportsResult = await pool.query(
            `SELECT r.*,
                    p.title AS project_title,
                    p.slug AS project_slug,
                    u.name AS volunteer_name,
                    u.email AS volunteer_email,
                    rv.name AS reviewed_by_name,
                    (r.status = 'approved') AS payment_unlock_eligible
             FROM waci_monthly_reports r
             JOIN waci_projects p ON p.id = r.project_id
             JOIN users u ON u.id = r.user_id
             LEFT JOIN users rv ON rv.id = r.reviewed_by
             WHERE r.project_id = $1
             ORDER BY r.submitted_at DESC`,
            [id]
        );

        const reportIds = reportsResult.rows.map((row) => row.id);
        let attachments = [];
        if (reportIds.length) {
            const attachmentResult = await pool.query(
                'SELECT * FROM waci_report_attachments WHERE report_id = ANY($1)',
                [reportIds]
            );
            attachments = attachmentResult.rows;
        }

        const rows = reportsResult.rows.map((row) => ({
            ...row,
            attachments: attachments.filter((attachment) => attachment.report_id === row.id),
        }));

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch project reports' });
    }
};
