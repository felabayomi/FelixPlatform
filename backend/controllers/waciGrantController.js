const pool = require('../db');
const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { sendEmail } = require('../services/resendEmail');

const GRANT_PDF_DIR = path.join(__dirname, '..', 'uploads', 'waci-grants');

const ensureGrantPdfDir = async () => {
    await fs.promises.mkdir(GRANT_PDF_DIR, { recursive: true });
};

const buildGrantAcceptancePdf = async ({ offer, signatureName, acceptedAt }) => {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const margin = 56;
    let y = 740;
    const lineHeight = 16;

    const writeLine = (text, { size = 11, isBold = false, color = rgb(0.1, 0.1, 0.1) } = {}) => {
        page.drawText(String(text || ''), {
            x: margin,
            y,
            size,
            font: isBold ? bold : font,
            color,
        });
        y -= lineHeight;
    };

    const writeBlock = (title, value) => {
        if (!value) return;
        writeLine(title, { size: 11, isBold: true });
        String(value)
            .split(/\r?\n/)
            .filter(Boolean)
            .forEach((line) => writeLine(line, { size: 10 }));
        y -= 8;
    };

    writeLine('WACI Grant Offer Acceptance', { size: 16, isBold: true });
    y -= 8;
    writeLine(`Project: ${offer.project_title || ''}`, { size: 12, isBold: true });
    writeLine(`Grant Title: ${offer.title || ''}`, { size: 11 });
    writeLine(`Volunteer: ${offer.volunteer_name || ''} (${offer.volunteer_email || ''})`, { size: 10 });
    writeLine(`Accepted At: ${new Date(acceptedAt).toISOString()}`, { size: 10 });
    y -= 8;

    writeBlock('Purpose', offer.purpose);
    writeBlock('Objectives', offer.objectives);
    writeBlock('Methodology', offer.methodology);
    writeBlock('Deliverables', offer.deliverables);
    writeBlock('Expectations', offer.expectations);
    writeBlock('Funding Structure', offer.funding_structure);
    writeBlock('Reporting Deadlines', offer.reporting_deadlines);
    writeBlock('Final Reporting Requirement', offer.final_reporting_requirement);

    writeLine('Signed Acceptance', { size: 12, isBold: true, color: rgb(0.05, 0.4, 0.2) });
    writeLine(`Signed By: ${signatureName}`, { size: 11 });

    return Buffer.from(await pdf.save());
};

const nowIso = () => new Date().toISOString();

const toSlug = (value = '') => String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const parseList = (text) => String(text || '')
    .split(/\r?\n|;|,/)
    .map((part) => part.trim())
    .filter(Boolean);

const parseDurationMonths = (project = {}) => {
    const expectationsText = String(project.expectations || '');
    const tagged = expectationsText.match(/DURATION_MONTHS\s*:\s*(\d{1,3})/i);
    if (tagged) {
        return Math.max(1, Number(tagged[1]));
    }

    const start = project.start_date ? new Date(project.start_date) : null;
    const end = project.end_date ? new Date(project.end_date) : null;
    if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        const months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth()) + 1;
        return Math.max(1, months);
    }

    return 12;
};

const parseMonthlyFundingCents = (project = {}) => {
    const text = String(project.funding_structure || project.monthly_funding || project.expectations || '');
    const tagged = text.match(/MONTHLY_FUNDING_USD\s*:\s*(\d{2,6})/i);
    const match = tagged || text.match(/\$\s*(\d{2,6})/);
    if (!match) return 30000;
    return Math.max(10000, Math.min(50000, Number(match[1]) * 100));
};

const buildGrantOfferFromProject = (project = {}) => {
    const durationMonths = parseDurationMonths(project);
    const monthlyFundingCents = parseMonthlyFundingCents(project);
    const slug = toSlug(project.slug || project.title || `project-${project.id}`);

    return {
        offer_code: `WACI-${slug.toUpperCase()}-${Date.now()}`,
        title: `${project.title || 'WACI Project'} Grant Offer`,
        purpose: project.purpose || '',
        objectives: project.objectives || '',
        methodology: project.methodology || '',
        deliverables: project.deliverables || '',
        expectations: project.expectations || '',
        funding_structure: `Monthly funding: $${Math.round(monthlyFundingCents / 100)} for ${durationMonths} months`,
        reporting_deadlines: 'Daily logs; Monthly report; Final report',
        final_reporting_requirement: 'Submit final impact report at project close',
        total_amount_cents: monthlyFundingCents * durationMonths,
        currency: 'usd',
        durationMonths,
        monthlyFundingCents,
        deliverablesList: parseList(project.deliverables),
        reportingRequirementsList: parseList(project.expectations || 'Daily logs; Monthly report; Final report'),
    };
};

const firstOfUtcMonth = (date = new Date()) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const addMonthsUtc = (date, delta) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, date.getUTCDate()));

const toDateOnly = (date) => date.toISOString().slice(0, 10);

const provisionDashboardFromAgreement = async ({
    client,
    project,
    agreement,
    grantOffer,
}) => {
    const durationMonths = parseDurationMonths(project);
    const monthlyFundingCents = grantOffer?.total_amount_cents
        ? Math.round(Number(grantOffer.total_amount_cents) / durationMonths)
        : parseMonthlyFundingCents(project);

    const baseDate = firstOfUtcMonth(new Date());
    const firstDue = addMonthsUtc(baseDate, 1);

    const dashboardProfileResult = await client.query(
        `INSERT INTO waci_dashboard_profiles
            (project_id, grant_agreement_id, user_id, grantee_email, next_report_due, active_month, funding_status, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [
            agreement.project_id,
            agreement.id,
            agreement.user_id,
            agreement.grantee_email,
            toDateOnly(firstDue),
            1,
            'awaiting_report',
            'active',
        ]
    );

    const dashboardProfile = dashboardProfileResult.rows[0];
    const reports = [];
    const milestones = [];

    for (let i = 0; i < durationMonths; i += 1) {
        const monthNumber = i + 1;
        const dueDate = addMonthsUtc(firstDue, i);

        const reportResult = await client.query(
            `INSERT INTO waci_report_schedules
                (project_id, grant_agreement_id, dashboard_profile_id, user_id, month_number, due_date, status, narrative, attachments)
             VALUES ($1,$2,$3,$4,$5,$6,'pending','',$7)
             RETURNING *`,
            [
                agreement.project_id,
                agreement.id,
                dashboardProfile.id,
                agreement.user_id,
                monthNumber,
                toDateOnly(dueDate),
                JSON.stringify([]),
            ]
        );
        reports.push(reportResult.rows[0]);

        const milestoneResult = await client.query(
            `INSERT INTO waci_funding_milestones
                (project_id, grant_agreement_id, month_number, amount_cents, release_status)
             VALUES ($1,$2,$3,$4,$5)
             RETURNING *`,
            [
                agreement.project_id,
                agreement.id,
                monthNumber,
                monthlyFundingCents,
                monthNumber === 1 ? 'eligible' : 'locked',
            ]
        );
        milestones.push(milestoneResult.rows[0]);
    }

    return {
        dashboardProfile,
        reports,
        fundingMilestones: milestones,
    };
};

let ensureLifecycleSchemaPromise = null;

const ensureLifecycleSchema = async () => {
    if (!ensureLifecycleSchemaPromise) {
        ensureLifecycleSchemaPromise = (async () => {
            await pool.query('ALTER TABLE waci_grant_offers ADD COLUMN IF NOT EXISTS offer_code VARCHAR(255)');
            await pool.query('ALTER TABLE waci_grant_offers ADD COLUMN IF NOT EXISTS volunteer_name VARCHAR(255)');
            await pool.query('ALTER TABLE waci_grant_offers ADD COLUMN IF NOT EXISTS volunteer_email VARCHAR(255)');
            await pool.query('ALTER TABLE waci_grant_offers ALTER COLUMN user_id DROP NOT NULL');

            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_grant_agreements (
                    id SERIAL PRIMARY KEY,
                    grant_offer_id INTEGER NOT NULL UNIQUE REFERENCES waci_grant_offers(id) ON DELETE CASCADE,
                    project_id INTEGER NOT NULL REFERENCES waci_projects(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    grantee_name VARCHAR(255) NOT NULL,
                    grantee_email VARCHAR(255) NOT NULL,
                    signature_name VARCHAR(255) NOT NULL,
                    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    status VARCHAR(50) NOT NULL DEFAULT 'active',
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

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
            `);

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
            `);

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
            `);
        })();
    }

    return ensureLifecycleSchemaPromise;
};

// ─── Grant Offers ─────────────────────────────────────────────

exports.createGrantOffer = async (req, res) => {
    try {
        await ensureLifecycleSchema();
        const {
            project_id, user_id, volunteer_name, volunteer_email, offer_code,
            title, purpose, objectives, methodology,
            deliverables, expectations, funding_structure, reporting_deadlines,
            final_reporting_requirement, total_amount_cents, currency, expires_at,
        } = req.body;

        if (!project_id || !title) {
            return res.status(400).json({ error: 'project_id and title are required' });
        }

        const result = await pool.query(
            `INSERT INTO waci_grant_offers
                (project_id, user_id, volunteer_name, volunteer_email, offer_code, title, purpose, objectives, methodology,
                 deliverables, expectations, funding_structure, reporting_deadlines,
                 final_reporting_requirement, total_amount_cents, currency, expires_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
             RETURNING *`,
            [
                project_id, user_id || null,
                volunteer_name || null, volunteer_email || null,
                offer_code || null,
                title,
                purpose || null, objectives || null, methodology || null,
                deliverables || null, expectations || null, funding_structure || null,
                reporting_deadlines || null, final_reporting_requirement || null,
                total_amount_cents || 0, currency || 'usd',
                expires_at || null,
            ]
        );

        await pool.query(
            `UPDATE waci_projects
             SET status = 'grant_generated', updated_at = NOW()
             WHERE id = $1 AND status IN ('draft', 'published')`,
            [project.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create grant offer' });
    }
};

exports.generateGrantOfferFromProject = async (req, res) => {
    try {
        await ensureLifecycleSchema();
        const { projectId } = req.params;
        const projectResult = await pool.query(
            'SELECT * FROM waci_projects WHERE id = $1 LIMIT 1',
            [projectId]
        );
        if (!projectResult.rows.length) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const project = projectResult.rows[0];
        const generated = buildGrantOfferFromProject(project);

        const result = await pool.query(
            `INSERT INTO waci_grant_offers
                (project_id, user_id, volunteer_name, volunteer_email, offer_code, title,
                 purpose, objectives, methodology, deliverables, expectations,
                 funding_structure, reporting_deadlines, final_reporting_requirement,
                 total_amount_cents, currency, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
             RETURNING *`,
            [
                project.id,
                null,
                null,
                null,
                generated.offer_code,
                generated.title,
                generated.purpose,
                generated.objectives,
                generated.methodology,
                generated.deliverables,
                generated.expectations,
                generated.funding_structure,
                generated.reporting_deadlines,
                generated.final_reporting_requirement,
                generated.total_amount_cents,
                generated.currency,
                'draft',
            ]
        );

        res.status(201).json({
            ...result.rows[0],
            duration_months: generated.durationMonths,
            monthly_funding_cents: generated.monthlyFundingCents,
            deliverables_list: generated.deliverablesList,
            reporting_requirements_list: generated.reportingRequirementsList,
            generated_at: nowIso(),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate grant offer from project' });
    }
};

exports.sendGrantOffer = async (req, res) => {
    try {
        await ensureLifecycleSchema();
        const { id } = req.params;
        const { volunteer_name, volunteer_email } = req.body;

        if (!volunteer_name || !volunteer_email) {
            return res.status(400).json({ error: 'volunteer_name and volunteer_email are required' });
        }

        const userLookup = await pool.query(
            'SELECT id, email, name FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
            [volunteer_email]
        );
        const user = userLookup.rows[0] || null;

        const updateResult = await pool.query(
            `UPDATE waci_grant_offers SET
                user_id = $1,
                volunteer_name = $2,
                volunteer_email = $3,
                status = 'sent'
             WHERE id = $4
             RETURNING *`,
            [user?.id || null, volunteer_name, volunteer_email, id]
        );
        if (!updateResult.rows.length) {
            return res.status(404).json({ error: 'Grant offer not found' });
        }

        const offer = updateResult.rows[0];

        await pool.query(
            `UPDATE waci_projects
             SET status = 'offer_sent', updated_at = NOW()
             WHERE id = $1 AND status IN ('grant_generated', 'published', 'draft')`,
            [offer.project_id]
        );

        const acceptanceUrl = `${process.env.WACI_HUB_PUBLIC_URL || 'https://waci-hub.felixplatforms.com'}/volunteer/grant/${offer.id}`;

        await sendEmail({
            to: volunteer_email,
            subject: `WACI Grant Offer: ${offer.title}`,
            text: [
                `Hi ${volunteer_name},`,
                '',
                'You have received a WACI grant offer.',
                `Offer: ${offer.title}`,
                `Acceptance link: ${acceptanceUrl}`,
                '',
                'Please review and accept the offer to activate your dashboard.',
                '— WACI Project Hub',
            ].join('\n'),
            html: `
                <p>Hi <strong>${volunteer_name}</strong>,</p>
                <p>You have received a WACI grant offer.</p>
                <p><strong>Offer:</strong> ${offer.title}</p>
                <p><a href="${acceptanceUrl}">Review & Accept Offer</a></p>
                <p>Please review and accept the offer to activate your dashboard.</p>
                <p>— WACI Project Hub</p>
            `,
            appName: 'WACI',
        });

        res.json({
            ...offer,
            acceptance_url: acceptanceUrl,
            sent_to: volunteer_email,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send grant offer' });
    }
};

exports.getMyProvisionedDashboard = async (req, res) => {
    try {
        await ensureLifecycleSchema();

        const profileResult = await pool.query(
            `SELECT dp.*, ga.id AS agreement_id, ga.grantee_name, ga.grantee_email,
                    go.id AS grant_offer_id, go.title AS grant_title, go.deliverables,
                    go.reporting_deadlines, go.total_amount_cents, go.currency,
                    p.title AS project_title, p.slug AS project_slug, p.purpose, p.region,
                    p.objectives, p.methodology
             FROM waci_dashboard_profiles dp
             JOIN waci_grant_agreements ga ON ga.id = dp.grant_agreement_id
             JOIN waci_grant_offers go ON go.id = ga.grant_offer_id
             JOIN waci_projects p ON p.id = dp.project_id
             WHERE dp.user_id = $1 AND dp.status = 'active'
             ORDER BY dp.created_at DESC
             LIMIT 1`,
            [req.user.id]
        );

        if (!profileResult.rows.length) {
            return res.json(null);
        }

        const profile = profileResult.rows[0];

        const [scheduleResult, milestoneResult] = await Promise.all([
            pool.query(
                `SELECT *
                 FROM waci_report_schedules
                 WHERE grant_agreement_id = $1
                 ORDER BY month_number ASC`,
                [profile.agreement_id]
            ),
            pool.query(
                `SELECT *
                 FROM waci_funding_milestones
                 WHERE grant_agreement_id = $1
                 ORDER BY month_number ASC`,
                [profile.agreement_id]
            ),
        ]);

        res.json({
            profile,
            reportSchedules: scheduleResult.rows,
            fundingMilestones: milestoneResult.rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load provisioned dashboard' });
    }
};

exports.getGrantOffers = async (req, res) => {
    try {
        const { project_id, user_id, status } = req.query;
        const params = [];
        const conditions = [];

        if (project_id) { params.push(project_id); conditions.push(`g.project_id = $${params.length}`); }
        if (user_id) { params.push(user_id); conditions.push(`g.user_id = $${params.length}`); }
        if (status) { params.push(status); conditions.push(`g.status = $${params.length}`); }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await pool.query(
            `SELECT g.*,
                    p.title AS project_title, p.slug AS project_slug,
                    p.status AS project_status,
                    COALESCE(g.volunteer_name, u.name) AS volunteer_name,
                    COALESCE(g.volunteer_email, u.email) AS volunteer_email,
                    mr.id AS latest_report_id,
                    mr.status AS latest_report_status,
                    fm.release_status AS latest_funding_status
             FROM waci_grant_offers g
             JOIN waci_projects p ON p.id = g.project_id
             LEFT JOIN users u ON u.id = g.user_id
             LEFT JOIN LATERAL (
                 SELECT r.id, r.status
                 FROM waci_monthly_reports r
                 WHERE r.project_id = g.project_id
                 ORDER BY r.submitted_at DESC
                 LIMIT 1
             ) mr ON TRUE
             LEFT JOIN LATERAL (
                 SELECT f.release_status
                 FROM waci_grant_agreements ga
                 JOIN waci_funding_milestones f ON f.grant_agreement_id = ga.id
                 WHERE ga.grant_offer_id = g.id
                 ORDER BY f.month_number DESC
                 LIMIT 1
             ) fm ON TRUE
             ${where}
             ORDER BY g.created_at DESC`,
            params
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch grant offers' });
    }
};

exports.getMyGrantOffers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT g.*,
                    p.title AS project_title, p.slug AS project_slug,
                    p.region AS project_region,
                  COALESCE(g.volunteer_name, u.name) AS volunteer_name,
                  COALESCE(g.volunteer_email, u.email) AS volunteer_email,
                    a.accepted_at, a.pdf_url
             FROM waci_grant_offers g
             JOIN waci_projects p ON p.id = g.project_id
              LEFT JOIN users u ON u.id = g.user_id
             LEFT JOIN waci_grant_acceptances a ON a.grant_offer_id = g.id AND a.user_id = g.user_id
             WHERE g.user_id = $1
             ORDER BY g.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch your grant offers' });
    }
};

exports.getGrantOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT g.*,
                    p.title AS project_title, p.slug AS project_slug,
                    p.region AS project_region,
                    COALESCE(g.volunteer_name, u.name) AS volunteer_name,
                    COALESCE(g.volunteer_email, u.email) AS volunteer_email,
                    a.signature_name, a.accepted_at, a.pdf_url
             FROM waci_grant_offers g
             JOIN waci_projects p ON p.id = g.project_id
             LEFT JOIN users u ON u.id = g.user_id
             LEFT JOIN waci_grant_acceptances a ON a.grant_offer_id = g.id AND a.user_id = g.user_id
             WHERE g.id = $1 LIMIT 1`,
            [id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Grant offer not found' });
        const offer = result.rows[0];
        const isAdmin = req.user?.role === 'admin' || req.user?.role === 'superadmin';
        const emailMatch = offer.volunteer_email && req.user?.email
            ? String(offer.volunteer_email).toLowerCase() === String(req.user.email).toLowerCase()
            : false;
        if (!isAdmin && offer.user_id !== req.user?.id && !emailMatch) {
            return res.status(403).json({ error: 'You do not have access to this grant offer' });
        }

        res.json({
            ...offer,
            signed_at: offer.accepted_at || null,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch grant offer' });
    }
};

exports.updateGrantOfferStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const VALID = ['draft', 'sent', 'pending', 'accepted', 'declined', 'expired'];
        if (!VALID.includes(status)) return res.status(400).json({ error: 'Invalid status' });

        const result = await pool.query(
            'UPDATE waci_grant_offers SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Grant offer not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update grant offer status' });
    }
};

// ─── Grant Acceptance ─────────────────────────────────────────

exports.acceptGrantOffer = async (req, res) => {
    try {
        await ensureLifecycleSchema();
        const { id } = req.params; // grant_offer_id
        const { signature_name, signature_data } = req.body;
        const user_id = req.user?.id;

        if (!signature_name) return res.status(400).json({ error: 'signature_name is required' });

        // Verify offer belongs to this user (or email match for unassigned offers)
        const offerResult = await pool.query(
            `SELECT g.*, p.title AS project_title, p.slug AS project_slug,
                    u.name AS assigned_user_name, u.email AS assigned_user_email,
                    p.start_date, p.end_date
             FROM waci_grant_offers g
             JOIN waci_projects p ON p.id = g.project_id
             LEFT JOIN users u ON u.id = g.user_id
             WHERE g.id = $1
             LIMIT 1`,
            [id]
        );
        if (!offerResult.rows.length) return res.status(404).json({ error: 'Grant offer not found' });
        const offer = offerResult.rows[0];

        const emailMatch = offer.volunteer_email && req.user?.email
            ? String(offer.volunteer_email).toLowerCase() === String(req.user.email).toLowerCase()
            : false;
        const assignedToRequester = Number(offer.user_id) === Number(user_id);
        if (!assignedToRequester && !emailMatch) {
            return res.status(403).json({ error: 'You do not have access to this grant offer' });
        }

        const existingAcceptance = await pool.query(
            `SELECT id, accepted_at, pdf_url
             FROM waci_grant_acceptances
             WHERE grant_offer_id = $1 AND user_id = $2
             LIMIT 1`,
            [id, user_id]
        );
        if (existingAcceptance.rows.length) {
            return res.status(409).json({
                error: 'Grant offer already accepted',
                signed_at: existingAcceptance.rows[0].accepted_at,
                pdf_url: existingAcceptance.rows[0].pdf_url || null,
            });
        }

        if (!['pending', 'sent'].includes(offer.status)) {
            return res.status(409).json({ error: 'Grant offer is no longer pending' });
        }

        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;
        const acceptedAt = new Date();

        await ensureGrantPdfDir();
        const pdfBytes = await buildGrantAcceptancePdf({
            offer,
            signatureName: signature_name,
            acceptedAt,
        });
        const safeSignatureName = String(signature_name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'signed';
        const pdfFileName = `grant-${id}-user-${user_id}-${safeSignatureName}-${Date.now()}.pdf`;
        const pdfDiskPath = path.join(GRANT_PDF_DIR, pdfFileName);
        await fs.promises.writeFile(pdfDiskPath, pdfBytes);
        const pdfPublicUrl = `/uploads/waci-grants/${pdfFileName}`;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const acceptance = await client.query(
                `INSERT INTO waci_grant_acceptances
                    (grant_offer_id, user_id, signature_name, signature_data, acceptance_ip, pdf_url, accepted_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)
                 RETURNING *`,
                [id, user_id, signature_name, signature_data || null, ip, pdfPublicUrl, acceptedAt]
            );
            const updateOffer = await client.query(
                `UPDATE waci_grant_offers SET
                    status = 'accepted',
                    user_id = $2,
                    volunteer_name = COALESCE(volunteer_name, $3),
                    volunteer_email = COALESCE(volunteer_email, $4)
                 WHERE id = $1 AND status IN ('pending', 'sent')
                 RETURNING *`,
                [id, user_id, req.user?.name || null, req.user?.email || null]
            );
            if (!updateOffer.rows.length) {
                throw new Error('Grant offer is no longer pending');
            }

            const acceptedOffer = updateOffer.rows[0];

            const agreementResult = await client.query(
                `INSERT INTO waci_grant_agreements
                    (grant_offer_id, project_id, user_id, grantee_name, grantee_email, signature_name, signed_at, status)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,'active')
                 ON CONFLICT (grant_offer_id)
                 DO UPDATE SET
                    grantee_name = EXCLUDED.grantee_name,
                    grantee_email = EXCLUDED.grantee_email,
                    signature_name = EXCLUDED.signature_name,
                    signed_at = EXCLUDED.signed_at,
                    status = 'active'
                 RETURNING *`,
                [
                    id,
                    acceptedOffer.project_id,
                    user_id,
                    req.user?.name || offer.volunteer_name || 'Grantee',
                    req.user?.email || offer.volunteer_email || '',
                    signature_name,
                    acceptedAt,
                ]
            );
            const agreement = agreementResult.rows[0];

            await client.query(
                `UPDATE waci_projects
                 SET status = 'active', updated_at = NOW()
                 WHERE id = $1 AND status IN ('draft', 'published', 'awarded', 'paused')`,
                [acceptedOffer.project_id]
            );

            const lifecycle = await provisionDashboardFromAgreement({
                client,
                project: offer,
                agreement,
                grantOffer: acceptedOffer,
            });

            await client.query('COMMIT');
            res.status(201).json({
                ...acceptance.rows[0],
                signed_at: acceptance.rows[0].accepted_at,
                agreement,
                dashboard_profile: lifecycle.dashboardProfile,
                report_schedules: lifecycle.reports,
                funding_milestones: lifecycle.fundingMilestones,
            });
        } catch (innerErr) {
            await client.query('ROLLBACK');
            throw innerErr;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to accept grant offer' });
    }
};

exports.getGrantAcceptance = async (req, res) => {
    try {
        const { id } = req.params; // grant_offer_id
        const user_id = req.user?.role === 'admin' || req.user?.role === 'superadmin'
            ? req.query.user_id || req.user.id
            : req.user.id;

        const result = await pool.query(
            `SELECT a.*, g.title AS grant_title, p.title AS project_title
             FROM waci_grant_acceptances a
             JOIN waci_grant_offers g ON g.id = a.grant_offer_id
             JOIN waci_projects p ON p.id = g.project_id
             WHERE a.grant_offer_id = $1 AND a.user_id = $2
             LIMIT 1`,
            [id, user_id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Acceptance not found' });
        res.json({
            ...result.rows[0],
            signed_at: result.rows[0].accepted_at,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch acceptance' });
    }
};
