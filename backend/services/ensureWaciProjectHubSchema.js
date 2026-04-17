const pool = require('../db');

let ensureWaciProjectHubSchemaPromise = null;

const PILOT_PROJECT = {
    title: 'HUKIA Airport Wildlife Hazard Control Unit',
    slug: 'hukia-airport',
    purpose:
        'A pilot conservation operations project focused on reducing bird and wildlife strike risk through field observation, logging, reporting, and habitat response support.',
    objectives: [
        'Track wildlife activity near airport operational zones.',
        'Maintain practical field logs and monthly reports.',
        'Support low-cost habitat and risk observations that inform mitigation.',
    ].join('\n'),
    methodology: [
        'Field observation patrols around operational zones.',
        'Practical wildlife logging and evidence capture.',
        'Monthly reporting with mitigation recommendations.',
    ].join('\n'),
    deliverables: [
        'Daily field notebook logs',
        'Monthly narrative report',
        'Monthly photo evidence upload',
        'Final project summary report',
    ].join('\n'),
    expectations: [
        'DURATION_MONTHS: 12',
        'MONTHLY_FUNDING_USD: 300',
        'Daily logs',
        'Monthly report',
        'Final report',
    ].join('\n'),
    region: 'Katsina, Nigeria',
    status: 'pilot',
};

async function ensureWaciProjectHubSchema() {
    if (!ensureWaciProjectHubSchemaPromise) {
        ensureWaciProjectHubSchemaPromise = (async () => {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_projects (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    slug VARCHAR(255) NOT NULL UNIQUE,
                    purpose TEXT,
                    objectives TEXT,
                    methodology TEXT,
                    deliverables TEXT,
                    expectations TEXT,
                    funding_structure TEXT,
                    monthly_funding TEXT,
                    region VARCHAR(255),
                    status VARCHAR(50) NOT NULL DEFAULT 'draft',
                    start_date DATE,
                    end_date DATE,
                    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            // Add columns that may not exist in older deployments
            for (const col of [
                `ALTER TABLE waci_projects ADD COLUMN IF NOT EXISTS monthly_funding TEXT`,
                `ALTER TABLE waci_projects ADD COLUMN IF NOT EXISTS funding_structure TEXT`,
            ]) {
                await pool.query(col).catch(() => {});
            }

            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_project_assignments (
                    id SERIAL PRIMARY KEY,
                    project_id INTEGER NOT NULL REFERENCES waci_projects(id) ON DELETE CASCADE,
                    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    role VARCHAR(100) NOT NULL DEFAULT 'volunteer',
                    status VARCHAR(50) NOT NULL DEFAULT 'active',
                    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    UNIQUE (project_id, user_id)
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_grant_offers (
                    id SERIAL PRIMARY KEY,
                    project_id INTEGER NOT NULL REFERENCES waci_projects(id) ON DELETE CASCADE,
                    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                    volunteer_name VARCHAR(255),
                    volunteer_email VARCHAR(255),
                    offer_code VARCHAR(255),
                    title VARCHAR(255) NOT NULL,
                    purpose TEXT,
                    objectives TEXT,
                    methodology TEXT,
                    deliverables TEXT,
                    expectations TEXT,
                    funding_structure TEXT,
                    reporting_deadlines TEXT,
                    final_reporting_requirement TEXT,
                    total_amount_cents INTEGER NOT NULL DEFAULT 0,
                    currency VARCHAR(20) NOT NULL DEFAULT 'usd',
                    status VARCHAR(50) NOT NULL DEFAULT 'draft',
                    expires_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_grant_acceptances (
                    id SERIAL PRIMARY KEY,
                    grant_offer_id INTEGER NOT NULL REFERENCES waci_grant_offers(id) ON DELETE CASCADE,
                    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    signature_name VARCHAR(255) NOT NULL,
                    signature_data TEXT,
                    acceptance_ip VARCHAR(255),
                    pdf_url TEXT,
                    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    UNIQUE (grant_offer_id, user_id)
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_monthly_reports (
                    id SERIAL PRIMARY KEY,
                    project_id INTEGER NOT NULL REFERENCES waci_projects(id) ON DELETE CASCADE,
                    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    grant_offer_id INTEGER REFERENCES waci_grant_offers(id) ON DELETE SET NULL,
                    report_month DATE NOT NULL,
                    due_date DATE,
                    is_late BOOLEAN NOT NULL DEFAULT FALSE,
                    summary TEXT NOT NULL,
                    challenges TEXT,
                    next_steps TEXT,
                    status VARCHAR(50) NOT NULL DEFAULT 'pending',
                    admin_notes TEXT,
                    reviewed_at TIMESTAMPTZ,
                    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
                    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    UNIQUE (project_id, user_id, report_month)
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_report_attachments (
                    id SERIAL PRIMARY KEY,
                    report_id INTEGER NOT NULL REFERENCES waci_monthly_reports(id) ON DELETE CASCADE,
                    file_url TEXT NOT NULL,
                    file_name VARCHAR(255),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS waci_payments (
                    id SERIAL PRIMARY KEY,
                    grant_offer_id INTEGER REFERENCES waci_grant_offers(id) ON DELETE SET NULL,
                    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    project_id INTEGER NOT NULL REFERENCES waci_projects(id) ON DELETE CASCADE,
                    report_id INTEGER REFERENCES waci_monthly_reports(id) ON DELETE SET NULL,
                    amount_cents INTEGER NOT NULL DEFAULT 0,
                    currency VARCHAR(20) NOT NULL DEFAULT 'usd',
                    payout_method VARCHAR(100),
                    payment_month DATE,
                    status VARCHAR(50) NOT NULL DEFAULT 'pending',
                    payout_reference VARCHAR(255),
                    scheduled_at TIMESTAMPTZ,
                    processed_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            await pool.query(`
                INSERT INTO waci_projects
                    (title, slug, purpose, objectives, methodology, deliverables, expectations, region, status)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                ON CONFLICT (slug) DO NOTHING
            `, [
                PILOT_PROJECT.title,
                PILOT_PROJECT.slug,
                PILOT_PROJECT.purpose,
                PILOT_PROJECT.objectives,
                PILOT_PROJECT.methodology,
                PILOT_PROJECT.deliverables,
                PILOT_PROJECT.expectations,
                PILOT_PROJECT.region,
                PILOT_PROJECT.status,
            ]);
        })().catch((error) => {
            ensureWaciProjectHubSchemaPromise = null;
            throw error;
        });
    }

    return ensureWaciProjectHubSchemaPromise;
}

module.exports = {
    ensureWaciProjectHubSchema,
};
