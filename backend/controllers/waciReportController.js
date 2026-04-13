const pool = require('../db');
const { sendEmail } = require('../services/resendEmail');
const { ensureWaciProjectHubSchema } = require('../services/ensureWaciProjectHubSchema');

const REPORT_DUE_DAY = 25;

const parseReportMonth = (value) => {
    const reportMonth = new Date(value);
    return Number.isNaN(reportMonth.getTime()) ? null : reportMonth;
};

const buildDueDate = (reportMonthDate) =>
    new Date(Date.UTC(reportMonthDate.getUTCFullYear(), reportMonthDate.getUTCMonth(), REPORT_DUE_DAY));

const toDateOnly = (value) => value.toISOString().slice(0, 10);

const isLateSubmission = (dueDate, submittedAt = new Date()) => submittedAt.getTime() > dueDate.getTime();

let ensureReportLifecycleSchemaPromise = null;

const ensureReportLifecycleSchema = async () => {
    if (!ensureReportLifecycleSchemaPromise) {
        ensureReportLifecycleSchemaPromise = (async () => {
            await ensureWaciProjectHubSchema();
            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_dashboard_profiles (
                    id SERIAL PRIMARY KEY,
                    project_id INTEGER NOT NULL REFERENCES waci_projects(id) ON DELETE CASCADE,
                    grant_agreement_id INTEGER NOT NULL UNIQUE REFERENCES waci_grant_agreements(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    grantee_email VARCHAR(255) NOT NULL,
                    next_report_due DATE,
                    active_month INTEGER NOT NULL DEFAULT 1,
                    funding_status VARCHAR(50) NOT NULL DEFAULT 'awaiting_report',
                    status VARCHAR(50) NOT NULL DEFAULT 'active',
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `).catch(() => null);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_report_schedules (
                    id SERIAL PRIMARY KEY,
                    project_id INTEGER NOT NULL REFERENCES waci_projects(id) ON DELETE CASCADE,
                    grant_agreement_id INTEGER NOT NULL REFERENCES waci_grant_agreements(id) ON DELETE CASCADE,
                    dashboard_profile_id INTEGER NOT NULL REFERENCES waci_dashboard_profiles(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    month_number INTEGER NOT NULL,
                    due_date DATE NOT NULL,
                    submitted_at TIMESTAMPTZ,
                    status VARCHAR(50) NOT NULL DEFAULT 'pending',
                    narrative TEXT NOT NULL DEFAULT '',
                    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    UNIQUE (grant_agreement_id, month_number)
                )
            `).catch(() => null);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_funding_milestones (
                    id SERIAL PRIMARY KEY,
                    project_id INTEGER NOT NULL REFERENCES waci_projects(id) ON DELETE CASCADE,
                    grant_agreement_id INTEGER NOT NULL REFERENCES waci_grant_agreements(id) ON DELETE CASCADE,
                    month_number INTEGER NOT NULL,
                    amount_cents INTEGER NOT NULL DEFAULT 0,
                    release_status VARCHAR(50) NOT NULL DEFAULT 'locked',
                    released_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    UNIQUE (grant_agreement_id, month_number)
                )
            `).catch(() => null);
        })();
    }

    return ensureReportLifecycleSchemaPromise;
};

const monthStartFromDate = (value) => {
    const date = new Date(value);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
};

const syncDashboardAfterApproval = async (client, scheduleRow) => {
    await client.query(
        `UPDATE waci_report_schedules
         SET status = 'approved'
         WHERE id = $1`,
        [scheduleRow.id]
    );

    await client.query(
        `UPDATE waci_funding_milestones
         SET release_status = 'released', released_at = NOW()
         WHERE grant_agreement_id = $1 AND month_number = $2`,
        [scheduleRow.grant_agreement_id, scheduleRow.month_number]
    );

    await client.query(
        `UPDATE waci_funding_milestones
         SET release_status = 'eligible'
         WHERE grant_agreement_id = $1 AND month_number = $2 AND release_status = 'locked'`,
        [scheduleRow.grant_agreement_id, scheduleRow.month_number + 1]
    );

    const nextScheduleResult = await client.query(
        `SELECT month_number, due_date
         FROM waci_report_schedules
         WHERE grant_agreement_id = $1 AND month_number > $2
         ORDER BY month_number ASC
         LIMIT 1`,
        [scheduleRow.grant_agreement_id, scheduleRow.month_number]
    );
    const nextSchedule = nextScheduleResult.rows[0];

    await client.query(
        `UPDATE waci_dashboard_profiles
         SET
            next_report_due = $1,
            active_month = $2,
            funding_status = $3,
            updated_at = NOW()
         WHERE grant_agreement_id = $4`,
        [
            nextSchedule?.due_date || null,
            nextSchedule?.month_number || scheduleRow.month_number,
            nextSchedule ? 'awaiting_report' : 'released',
            scheduleRow.grant_agreement_id,
        ]
    );
};

// ─── Monthly Reports ──────────────────────────────────────────

exports.submitReport = async (req, res) => {
    try {
        await ensureReportLifecycleSchema();
        const user_id = req.user?.id;
        const {
            project_id, grant_offer_id, report_month,
            summary, challenges, next_steps,
        } = req.body;

        if (!project_id || !report_month || !summary) {
            return res.status(400).json({ error: 'project_id, report_month, and summary are required' });
        }

        const parsedMonth = parseReportMonth(report_month);
        if (!parsedMonth) {
            return res.status(400).json({ error: 'Invalid report_month format' });
        }

        const dueDate = buildDueDate(parsedMonth);
        const submittedAt = new Date();
        const late = isLateSubmission(dueDate, submittedAt);
        const status = late ? 'late' : 'pending';

        const result = await pool.query(
            `INSERT INTO waci_monthly_reports
                (project_id, user_id, grant_offer_id, report_month, summary, challenges, next_steps, due_date, is_late, status, submitted_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
             RETURNING *`,
            [
                project_id, user_id, grant_offer_id || null,
                report_month, summary,
                challenges || null, next_steps || null,
                toDateOnly(dueDate),
                late,
                status,
                submittedAt,
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'A report already exists for this project and month' });
        }
        res.status(500).json({ error: 'Failed to submit report' });
    }
};

exports.getReports = async (req, res) => {
    try {
        await ensureReportLifecycleSchema();
        const { project_id, user_id, status } = req.query;
        const params = [];
        const conditions = [];

        if (project_id) { params.push(project_id); conditions.push(`r.project_id = $${params.length}`); }
        if (user_id) { params.push(user_id); conditions.push(`r.user_id = $${params.length}`); }
        if (status) { params.push(status); conditions.push(`r.status = $${params.length}`); }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await pool.query(
            `SELECT r.*,
                    p.title AS project_title, p.slug AS project_slug,
                    u.name AS volunteer_name, u.email AS volunteer_email,
                    rv.name AS reviewed_by_name,
                    (r.status = 'approved') AS payment_unlock_eligible
             FROM waci_monthly_reports r
             JOIN waci_projects p ON p.id = r.project_id
             JOIN users u ON u.id = r.user_id
             LEFT JOIN users rv ON rv.id = r.reviewed_by
             ${where}
             ORDER BY r.submitted_at DESC`,
            params
        );

        // Attach attachments
        const reportIds = result.rows.map((r) => r.id);
        let attachments = [];
        if (reportIds.length) {
            const attResult = await pool.query(
                'SELECT * FROM waci_report_attachments WHERE report_id = ANY($1)',
                [reportIds]
            );
            attachments = attResult.rows;
        }

        const rows = result.rows.map((r) => ({
            ...r,
            attachments: attachments.filter((a) => a.report_id === r.id),
        }));

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
};

exports.getMyReports = async (req, res) => {
    try {
        await ensureReportLifecycleSchema();
        const user_id = req.user?.id;
        const result = await pool.query(
            `SELECT r.*,
                    p.title AS project_title, p.slug AS project_slug
             FROM waci_monthly_reports r
             JOIN waci_projects p ON p.id = r.project_id
             WHERE r.user_id = $1
             ORDER BY r.submitted_at DESC`,
            [user_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch your reports' });
    }
};

exports.getMyScheduledReports = async (req, res) => {
    try {
        await ensureReportLifecycleSchema();
        const result = await pool.query(
            `SELECT rs.*, p.title AS project_title, p.slug AS project_slug, dp.funding_status,
                    ga.grantee_email, ga.grantee_name
             FROM waci_report_schedules rs
             JOIN waci_projects p ON p.id = rs.project_id
             JOIN waci_dashboard_profiles dp ON dp.id = rs.dashboard_profile_id
             JOIN waci_grant_agreements ga ON ga.id = rs.grant_agreement_id
             WHERE rs.user_id = $1
             ORDER BY rs.month_number ASC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch report schedule' });
    }
};

exports.getScheduledReport = async (req, res) => {
    try {
        await ensureReportLifecycleSchema();
        const { id } = req.params;
        const result = await pool.query(
            `SELECT rs.*, p.title AS project_title, p.slug AS project_slug, dp.funding_status
             FROM waci_report_schedules rs
             JOIN waci_projects p ON p.id = rs.project_id
             JOIN waci_dashboard_profiles dp ON dp.id = rs.dashboard_profile_id
             WHERE rs.id = $1 AND rs.user_id = $2
             LIMIT 1`,
            [id, req.user.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Scheduled report not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch scheduled report' });
    }
};

exports.submitScheduledReport = async (req, res) => {
    const client = await pool.connect();
    try {
        await ensureReportLifecycleSchema();
        const { id } = req.params;
        const { narrative, attachments, challenges, next_steps } = req.body;

        if (!narrative) {
            return res.status(400).json({ error: 'narrative is required' });
        }

        await client.query('BEGIN');

        const scheduleResult = await client.query(
            `SELECT rs.*, ga.grant_offer_id, dp.id AS dashboard_profile_id
             FROM waci_report_schedules rs
             JOIN waci_grant_agreements ga ON ga.id = rs.grant_agreement_id
             JOIN waci_dashboard_profiles dp ON dp.id = rs.dashboard_profile_id
             WHERE rs.id = $1 AND rs.user_id = $2
             LIMIT 1`,
            [id, req.user.id]
        );
        if (!scheduleResult.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Scheduled report not found' });
        }

        const schedule = scheduleResult.rows[0];
        const submittedAt = new Date();
        const late = isLateSubmission(new Date(schedule.due_date), submittedAt);
        const reportMonth = toDateOnly(monthStartFromDate(schedule.due_date));

        const updatedScheduleResult = await client.query(
            `UPDATE waci_report_schedules
             SET narrative = $1,
                 attachments = $2::jsonb,
                 submitted_at = $3,
                 status = 'submitted'
             WHERE id = $4
             RETURNING *`,
            [narrative, JSON.stringify(Array.isArray(attachments) ? attachments : []), submittedAt, id]
        );

        const lifecycleReport = updatedScheduleResult.rows[0];

        const monthlyReportResult = await client.query(
            `INSERT INTO waci_monthly_reports
                (project_id, user_id, grant_offer_id, report_month, due_date, is_late, summary, challenges, next_steps, status, submitted_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
             ON CONFLICT (project_id, user_id, report_month)
             DO UPDATE SET
                grant_offer_id = EXCLUDED.grant_offer_id,
                due_date = EXCLUDED.due_date,
                is_late = EXCLUDED.is_late,
                summary = EXCLUDED.summary,
                challenges = EXCLUDED.challenges,
                next_steps = EXCLUDED.next_steps,
                status = EXCLUDED.status,
                submitted_at = EXCLUDED.submitted_at
             RETURNING *`,
            [
                schedule.project_id,
                req.user.id,
                schedule.grant_offer_id || null,
                reportMonth,
                schedule.due_date,
                late,
                narrative,
                challenges || null,
                next_steps || null,
                late ? 'late' : 'pending',
                submittedAt,
            ]
        );

        await client.query(
            `UPDATE waci_dashboard_profiles
             SET funding_status = 'review', updated_at = NOW()
             WHERE id = $1`,
            [schedule.dashboard_profile_id]
        );

        await client.query('COMMIT');
        res.json({
            schedule: lifecycleReport,
            report: monthlyReportResult.rows[0],
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to submit scheduled report' });
    } finally {
        client.release();
    }
};

exports.getReport = async (req, res) => {
    try {
        await ensureReportLifecycleSchema();
        const { id } = req.params;
        const reportResult = await pool.query(
            `SELECT r.*,
                    p.title AS project_title, p.slug AS project_slug,
                    u.name AS volunteer_name, u.email AS volunteer_email,
                    rv.name AS reviewed_by_name,
                    (r.status = 'approved') AS payment_unlock_eligible
             FROM waci_monthly_reports r
             JOIN waci_projects p ON p.id = r.project_id
             JOIN users u ON u.id = r.user_id
             LEFT JOIN users rv ON rv.id = r.reviewed_by
             WHERE r.id = $1 LIMIT 1`,
            [id]
        );
        if (!reportResult.rows.length) return res.status(404).json({ error: 'Report not found' });

        const attResult = await pool.query(
            'SELECT * FROM waci_report_attachments WHERE report_id = $1',
            [id]
        );
        res.json({ ...reportResult.rows[0], attachments: attResult.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch report' });
    }
};

exports.reviewReport = async (req, res) => {
    try {
        await ensureReportLifecycleSchema();
        const { id } = req.params;
        const { status, admin_notes } = req.body;
        const VALID = ['approved', 'rejected', 'revision_requested'];
        if (!VALID.includes(status)) return res.status(400).json({ error: 'Invalid review status' });

        const result = await pool.query(
            `UPDATE waci_monthly_reports SET
                status = $1,
                admin_notes = $2,
                reviewed_at = NOW(),
                reviewed_by = $3
             WHERE id = $4 RETURNING *`,
            [status, admin_notes || null, req.user?.id, id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Report not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to review report' });
    }
};

// ─── Report Attachments ───────────────────────────────────────

exports.addAttachment = async (req, res) => {
    try {
        await ensureReportLifecycleSchema();
        const { id } = req.params; // report_id
        const { file_url, file_name } = req.body;
        if (!file_url) return res.status(400).json({ error: 'file_url is required' });

        const result = await pool.query(
            'INSERT INTO waci_report_attachments (report_id, file_url, file_name) VALUES ($1,$2,$3) RETURNING *',
            [id, file_url, file_name || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add attachment' });
    }
};

// ─── Payments ─────────────────────────────────────────────────

exports.getPayments = async (req, res) => {
    try {
        await ensureReportLifecycleSchema();
        const { project_id, user_id, status } = req.query;
        const params = [];
        const conditions = [];

        if (project_id) { params.push(project_id); conditions.push(`pay.project_id = $${params.length}`); }
        if (user_id) { params.push(user_id); conditions.push(`pay.user_id = $${params.length}`); }
        if (status) { params.push(status); conditions.push(`pay.status = $${params.length}`); }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await pool.query(
            `SELECT pay.*,
                    p.title AS project_title,
                    u.name AS volunteer_name, u.email AS volunteer_email,
                      g.title AS grant_title,
                      r.status AS report_status,
                      (r.status = 'approved') AS payment_unlock_eligible
             FROM waci_payments pay
             JOIN waci_projects p ON p.id = pay.project_id
             JOIN users u ON u.id = pay.user_id
             JOIN waci_grant_offers g ON g.id = pay.grant_offer_id
                  LEFT JOIN waci_monthly_reports r ON r.id = pay.report_id
             ${where}
             ORDER BY pay.created_at DESC`,
            params
        );
        res.json(result.rows);
    } catch (err) {
        if (err?.code === '42P01' || err?.code === '42703') {
            try {
                const reportFallback = await pool.query(
                    `SELECT
                        (-1 * r.id) AS id,
                        r.project_id,
                        r.user_id,
                        r.id AS report_id,
                        NULL::integer AS grant_offer_id,
                        COALESCE(ROUND(g.total_amount_cents / 12.0), 0)::integer AS amount_cents,
                        COALESCE(g.currency, 'usd') AS currency,
                        NULL::text AS payout_method,
                        r.report_month AS payment_month,
                        CASE
                            WHEN r.status = 'approved' THEN 'pending'
                            WHEN r.status IN ('pending', 'late') THEN 'locked'
                            ELSE 'failed'
                        END AS status,
                        p.title AS project_title,
                        u.name AS volunteer_name,
                        u.email AS volunteer_email,
                        g.title AS grant_title,
                        r.status AS report_status,
                        (r.status = 'approved') AS payment_unlock_eligible,
                        r.submitted_at AS created_at
                    FROM waci_monthly_reports r
                    JOIN waci_projects p ON p.id = r.project_id
                    JOIN users u ON u.id = r.user_id
                    LEFT JOIN LATERAL (
                        SELECT gg.*
                        FROM waci_grant_offers gg
                        WHERE gg.project_id = r.project_id
                          AND gg.user_id = r.user_id
                        ORDER BY gg.created_at DESC
                        LIMIT 1
                    ) g ON true
                    ORDER BY r.submitted_at DESC`
                );

                let rows = reportFallback.rows;
                const { project_id, user_id, status } = req.query;
                if (project_id) rows = rows.filter((row) => String(row.project_id) === String(project_id));
                if (user_id) rows = rows.filter((row) => String(row.user_id) === String(user_id));
                if (status) rows = rows.filter((row) => String(row.status) === String(status));

                return res.json(rows);
            } catch (fallbackErr) {
                console.error('[WACI:getPayments:fallback]', fallbackErr);
            }
        }

        console.error('[WACI:getPayments]', err);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
};

exports.getMyPayments = async (req, res) => {
    try {
        await ensureReportLifecycleSchema();
        const result = await pool.query(
            `SELECT pay.*,
                    p.title AS project_title,
                    g.title AS grant_title,
                    r.status AS report_status,
                    (r.status = 'approved') AS payment_unlock_eligible
             FROM waci_payments pay
             JOIN waci_projects p ON p.id = pay.project_id
             JOIN waci_grant_offers g ON g.id = pay.grant_offer_id
             LEFT JOIN waci_monthly_reports r ON r.id = pay.report_id
             WHERE pay.user_id = $1
             ORDER BY pay.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch your payments' });
    }
};

exports.createPayment = async (req, res) => {
    try {
        await ensureReportLifecycleSchema();
        const {
            grant_offer_id, user_id, project_id, report_id,
            amount_cents, currency, payout_method, payment_month, scheduled_at,
        } = req.body;

        if (!grant_offer_id || !user_id || !project_id || !report_id) {
            return res.status(400).json({ error: 'grant_offer_id, user_id, project_id, and report_id are required' });
        }

        const reportResult = await pool.query(
            `SELECT id, status, user_id, project_id
             FROM waci_monthly_reports
             WHERE id = $1
             LIMIT 1`,
            [report_id]
        );
        if (!reportResult.rows.length) {
            return res.status(404).json({ error: 'Linked report not found' });
        }
        const report = reportResult.rows[0];
        if (String(report.user_id) !== String(user_id) || String(report.project_id) !== String(project_id)) {
            return res.status(400).json({ error: 'Linked report does not match this volunteer/project' });
        }
        if (report.status !== 'approved') {
            return res.status(409).json({ error: 'Payment can be unlocked only after report approval' });
        }

        const result = await pool.query(
            `INSERT INTO waci_payments
                (grant_offer_id, user_id, project_id, report_id,
                 amount_cents, currency, payout_method, payment_month, scheduled_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             RETURNING *`,
            [
                grant_offer_id, user_id, project_id, report_id,
                amount_cents || 0, currency || 'usd',
                payout_method || null, payment_month || null, scheduled_at || null,
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create payment' });
    }
};

exports.updatePaymentStatus = async (req, res) => {
    try {
        await ensureReportLifecycleSchema();
        const { id } = req.params;
        const { status, payout_reference } = req.body;
        const VALID = ['pending', 'approved', 'processing', 'completed', 'failed'];
        if (!VALID.includes(status)) return res.status(400).json({ error: 'Invalid payment status' });

        if (['approved', 'processing', 'completed'].includes(status)) {
            const paymentLinkResult = await pool.query(
                `SELECT pay.id, r.status AS report_status
                 FROM waci_payments pay
                 LEFT JOIN waci_monthly_reports r ON r.id = pay.report_id
                 WHERE pay.id = $1
                 LIMIT 1`,
                [id]
            );
            if (!paymentLinkResult.rows.length) {
                return res.status(404).json({ error: 'Payment not found' });
            }
            if (paymentLinkResult.rows[0].report_status !== 'approved') {
                return res.status(409).json({ error: 'Payment status cannot progress until linked report is approved' });
            }
        }

        const result = await pool.query(
            `UPDATE waci_payments SET
                status = $1,
                payout_reference = COALESCE($2, payout_reference),
                processed_at = CASE WHEN $1 IN ('completed','failed') THEN NOW() ELSE processed_at END
             WHERE id = $3 RETURNING *`,
            [status, payout_reference || null, id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Payment not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update payment status' });
    }
};

// ─── Approve Report + Auto-unlock Payment + Notify ───────────

exports.approveReport = async (req, res) => {
    await ensureReportLifecycleSchema();
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { admin_notes } = req.body;

        await client.query('BEGIN');

        // 1. Load report + volunteer info
        const reportResult = await client.query(
            `SELECT r.*, u.email AS volunteer_email, u.name AS volunteer_name,
                    p.title AS project_title
             FROM waci_monthly_reports r
             JOIN users u ON u.id = r.user_id
             JOIN waci_projects p ON p.id = r.project_id
             WHERE r.id = $1 LIMIT 1`,
            [id]
        );
        if (!reportResult.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Report not found' });
        }
        const report = reportResult.rows[0];
        if (report.status === 'approved') {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Report is already approved' });
        }

        // 2. Mark report approved
        const updatedReport = await client.query(
            `UPDATE waci_monthly_reports SET
                status = 'approved',
                admin_notes = COALESCE($1, admin_notes),
                reviewed_at = NOW(),
                reviewed_by = $2
             WHERE id = $3 RETURNING *`,
            [admin_notes || null, req.user?.id, id]
        );

        const scheduleResult = await client.query(
            `SELECT rs.*
             FROM waci_report_schedules rs
             WHERE rs.project_id = $1
               AND rs.user_id = $2
               AND date_trunc('month', rs.due_date::timestamp) = date_trunc('month', $3::date::timestamp)
             ORDER BY rs.month_number ASC
             LIMIT 1`,
            [report.project_id, report.user_id, report.report_month]
        );
        const schedule = scheduleResult.rows[0] || null;

        if (schedule) {
            await syncDashboardAfterApproval(client, schedule);
        }

        // 3. Find the active grant offer for this volunteer + project
        const grantResult = await client.query(
            `SELECT g.id, g.total_amount_cents, g.currency
             FROM waci_grant_offers g
             WHERE g.user_id = $1 AND g.project_id = $2
               AND g.status IN ('accepted', 'active')
             ORDER BY g.created_at DESC LIMIT 1`,
            [report.user_id, report.project_id]
        );
        const grant = grantResult.rows[0];

        // 4. Auto-create payment record (idempotent — skip if one exists for this report)
        let payment = null;
        if (grant) {
            const existingPayment = await client.query(
                'SELECT id FROM waci_payments WHERE report_id = $1 LIMIT 1',
                [id]
            );
            if (!existingPayment.rows.length) {
                const monthlyCents = grant.total_amount_cents
                    ? Math.round(grant.total_amount_cents / 12)
                    : 0;
                const paymentResult = await client.query(
                    `INSERT INTO waci_payments
                        (grant_offer_id, user_id, project_id, report_id,
                         amount_cents, currency, payment_month, status)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')
                     RETURNING *`,
                    [
                        grant.id, report.user_id, report.project_id, id,
                        monthlyCents, grant.currency || 'usd',
                        report.report_month,
                    ]
                );
                payment = paymentResult.rows[0];
            }
        }

        await client.query('COMMIT');

        // 5. Send notification email (fire-and-forget — do not fail the request)
        sendEmail({
            to: report.volunteer_email,
            subject: 'Report Approved — Next Funding Released',
            text: [
                `Hi ${report.volunteer_name || 'Volunteer'},`,
                '',
                `Your monthly report for ${report.project_title} has been approved.`,
                payment
                    ? `Your next payment of $${(payment.amount_cents / 100).toFixed(2)} has been queued for release.`
                    : 'Your payment will be processed shortly.',
                '',
                admin_notes ? `Admin notes: ${admin_notes}` : '',
                '',
                'Thank you for your continued service.',
                '— WACI Project Hub',
            ].filter((line) => line !== undefined).join('\n'),
            html: `
                <p>Hi <strong>${report.volunteer_name || 'Volunteer'}</strong>,</p>
                <p>Your monthly report for <strong>${report.project_title}</strong> has been <strong>approved</strong>.</p>
                ${payment ? `<p>Your next payment of <strong>$${(payment.amount_cents / 100).toFixed(2)}</strong> has been queued for release.</p>` : '<p>Your payment will be processed shortly.</p>'}
                ${admin_notes ? `<blockquote><strong>Admin notes:</strong> ${admin_notes}</blockquote>` : ''}
                <p>Thank you for your continued service.</p>
                <p>— WACI Project Hub</p>
            `,
            appName: 'WACI',
        }).catch((err) => console.error('[WACI] Approval email failed:', err));

        res.json({
            report: updatedReport.rows[0],
            payment,
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to approve report' });
    } finally {
        client.release();
    }
};
