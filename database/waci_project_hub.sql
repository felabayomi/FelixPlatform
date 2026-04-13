-- WACI Project Hub Schema
-- Felix Platform shared database
-- Project: WACI-Project-Hub
-- Slug: waci-project-hub

-- ─────────────────────────────────────────────────────────────
-- Projects
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waci_projects (
    id                  SERIAL PRIMARY KEY,
    title               VARCHAR(255) NOT NULL,
    slug                VARCHAR(255) NOT NULL UNIQUE,
    purpose             TEXT,
    objectives          TEXT,
    methodology         TEXT,
    deliverables        TEXT,
    expectations        TEXT,
    region              VARCHAR(255),
    status              VARCHAR(50)  NOT NULL DEFAULT 'active', -- active | completed | paused | archived
    start_date          DATE,
    end_date            DATE,
    created_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Project Volunteer Assignments
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waci_project_assignments (
    id              SERIAL PRIMARY KEY,
    project_id      INTEGER NOT NULL REFERENCES waci_projects(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(100) NOT NULL DEFAULT 'volunteer', -- volunteer | lead | coordinator
    status          VARCHAR(50)  NOT NULL DEFAULT 'active',    -- active | completed | removed
    assigned_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- Grant Offers
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waci_grant_offers (
    id                          SERIAL PRIMARY KEY,
    project_id                  INTEGER NOT NULL REFERENCES waci_projects(id) ON DELETE CASCADE,
    user_id                     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title                       VARCHAR(255) NOT NULL,
    purpose                     TEXT,
    objectives                  TEXT,
    methodology                 TEXT,
    deliverables                TEXT,
    expectations                TEXT,
    funding_structure           TEXT,
    reporting_deadlines         TEXT,
    final_reporting_requirement TEXT,
    total_amount_cents          INTEGER NOT NULL DEFAULT 0,
    currency                    VARCHAR(10) NOT NULL DEFAULT 'usd',
    status                      VARCHAR(50)  NOT NULL DEFAULT 'pending', -- pending | accepted | declined | expired
    issued_at                   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at                  TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE waci_grant_offers
    ADD COLUMN IF NOT EXISTS offer_code VARCHAR(255);

ALTER TABLE waci_grant_offers
    ADD COLUMN IF NOT EXISTS volunteer_name VARCHAR(255);

ALTER TABLE waci_grant_offers
    ADD COLUMN IF NOT EXISTS volunteer_email VARCHAR(255);

ALTER TABLE waci_grant_offers
    ALTER COLUMN user_id DROP NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- Grant Acceptances (digital signature records)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waci_grant_acceptances (
    id                  SERIAL PRIMARY KEY,
    grant_offer_id      INTEGER NOT NULL REFERENCES waci_grant_offers(id) ON DELETE CASCADE,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    signature_name      VARCHAR(255) NOT NULL,
    signature_data      TEXT,        -- base64 drawn signature or null for typed
    acceptance_ip       VARCHAR(100),
    pdf_url             TEXT,
    accepted_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (grant_offer_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- Grant Agreements (created after acceptance)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waci_grant_agreements (
    id                  SERIAL PRIMARY KEY,
    grant_offer_id      INTEGER NOT NULL UNIQUE REFERENCES waci_grant_offers(id) ON DELETE CASCADE,
    project_id          INTEGER NOT NULL REFERENCES waci_projects(id) ON DELETE CASCADE,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    grantee_name        VARCHAR(255) NOT NULL,
    grantee_email       VARCHAR(255) NOT NULL,
    signature_name      VARCHAR(255) NOT NULL,
    signed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status              VARCHAR(50) NOT NULL DEFAULT 'active', -- active | terminated | completed
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Dashboard Profile (auto-provisioned post-acceptance)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waci_dashboard_profiles (
    id                  SERIAL PRIMARY KEY,
    project_id          INTEGER NOT NULL REFERENCES waci_projects(id) ON DELETE CASCADE,
    grant_agreement_id  INTEGER NOT NULL UNIQUE REFERENCES waci_grant_agreements(id) ON DELETE CASCADE,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    grantee_email       VARCHAR(255) NOT NULL,
    next_report_due     DATE,
    active_month        INTEGER NOT NULL DEFAULT 1,
    funding_status      VARCHAR(50) NOT NULL DEFAULT 'awaiting_report', -- on_track | awaiting_report | review | released
    status              VARCHAR(50) NOT NULL DEFAULT 'active',           -- active | completed
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Report Schedule Placeholders
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waci_report_schedules (
    id                  SERIAL PRIMARY KEY,
    project_id          INTEGER NOT NULL REFERENCES waci_projects(id) ON DELETE CASCADE,
    grant_agreement_id  INTEGER NOT NULL REFERENCES waci_grant_agreements(id) ON DELETE CASCADE,
    dashboard_profile_id INTEGER NOT NULL REFERENCES waci_dashboard_profiles(id) ON DELETE CASCADE,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month_number        INTEGER NOT NULL,
    due_date            DATE NOT NULL,
    submitted_at        TIMESTAMPTZ,
    status              VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending | submitted | approved | rejected
    narrative           TEXT NOT NULL DEFAULT '',
    attachments         JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (grant_agreement_id, month_number)
);

-- ─────────────────────────────────────────────────────────────
-- Funding Milestones
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waci_funding_milestones (
    id                  SERIAL PRIMARY KEY,
    project_id          INTEGER NOT NULL REFERENCES waci_projects(id) ON DELETE CASCADE,
    grant_agreement_id  INTEGER NOT NULL REFERENCES waci_grant_agreements(id) ON DELETE CASCADE,
    month_number        INTEGER NOT NULL,
    amount_cents        INTEGER NOT NULL DEFAULT 0,
    release_status      VARCHAR(50) NOT NULL DEFAULT 'locked', -- locked | eligible | released
    released_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (grant_agreement_id, month_number)
);

-- ─────────────────────────────────────────────────────────────
-- Monthly Reports
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waci_monthly_reports (
    id                  SERIAL PRIMARY KEY,
    project_id          INTEGER NOT NULL REFERENCES waci_projects(id) ON DELETE CASCADE,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    grant_offer_id      INTEGER REFERENCES waci_grant_offers(id) ON DELETE SET NULL,
    report_month        DATE         NOT NULL,
    due_date            DATE,
    is_late             BOOLEAN      NOT NULL DEFAULT FALSE,
    summary             TEXT         NOT NULL,
    challenges          TEXT,
    next_steps          TEXT,
    status              VARCHAR(50)  NOT NULL DEFAULT 'pending', -- pending | late | approved | rejected | revision_requested
    submitted_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    reviewed_at         TIMESTAMPTZ,
    reviewed_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    admin_notes         TEXT,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE waci_monthly_reports
    ADD COLUMN IF NOT EXISTS due_date DATE;

ALTER TABLE waci_monthly_reports
    ADD COLUMN IF NOT EXISTS is_late BOOLEAN NOT NULL DEFAULT FALSE;

-- ─────────────────────────────────────────────────────────────
-- Report Attachments
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waci_report_attachments (
    id          SERIAL PRIMARY KEY,
    report_id   INTEGER NOT NULL REFERENCES waci_monthly_reports(id) ON DELETE CASCADE,
    file_url    TEXT         NOT NULL,
    file_name   VARCHAR(255),
    uploaded_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Payments
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waci_payments (
    id                  SERIAL PRIMARY KEY,
    grant_offer_id      INTEGER NOT NULL REFERENCES waci_grant_offers(id) ON DELETE CASCADE,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id          INTEGER NOT NULL REFERENCES waci_projects(id) ON DELETE CASCADE,
    report_id           INTEGER REFERENCES waci_monthly_reports(id) ON DELETE SET NULL,
    amount_cents        INTEGER      NOT NULL DEFAULT 0,
    currency            VARCHAR(10)  NOT NULL DEFAULT 'usd',
    status              VARCHAR(50)  NOT NULL DEFAULT 'pending', -- pending | approved | processing | completed | failed
    payout_method       VARCHAR(100),
    payout_reference    VARCHAR(255),
    payment_month       DATE,
    scheduled_at        TIMESTAMPTZ,
    processed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_waci_projects_slug         ON waci_projects(slug);
CREATE INDEX IF NOT EXISTS idx_waci_projects_status       ON waci_projects(status);
CREATE INDEX IF NOT EXISTS idx_waci_assignments_project   ON waci_project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_waci_assignments_user      ON waci_project_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_waci_grant_offers_project  ON waci_grant_offers(project_id);
CREATE INDEX IF NOT EXISTS idx_waci_grant_offers_user     ON waci_grant_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_waci_grant_offers_status   ON waci_grant_offers(status);
CREATE INDEX IF NOT EXISTS idx_waci_grant_offers_email    ON waci_grant_offers(LOWER(volunteer_email));
CREATE INDEX IF NOT EXISTS idx_waci_reports_project       ON waci_monthly_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_waci_reports_user          ON waci_monthly_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_waci_reports_status        ON waci_monthly_reports(status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_waci_reports_project_user_month
    ON waci_monthly_reports(project_id, user_id, report_month);
CREATE INDEX IF NOT EXISTS idx_waci_payments_grant        ON waci_payments(grant_offer_id);
CREATE INDEX IF NOT EXISTS idx_waci_payments_user         ON waci_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_waci_payments_status       ON waci_payments(status);
CREATE INDEX IF NOT EXISTS idx_waci_agreements_project    ON waci_grant_agreements(project_id);
CREATE INDEX IF NOT EXISTS idx_waci_agreements_user       ON waci_grant_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_waci_dashboard_user        ON waci_dashboard_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_waci_report_sched_agree    ON waci_report_schedules(grant_agreement_id);
CREATE INDEX IF NOT EXISTS idx_waci_funding_agree         ON waci_funding_milestones(grant_agreement_id);

-- ─────────────────────────────────────────────────────────────
-- Seed: Airport Wildlife Watch – Katsina pilot
-- ─────────────────────────────────────────────────────────────
INSERT INTO waci_projects (title, slug, purpose, objectives, region, status)
VALUES (
    'Airport Wildlife Watch – Katsina',
    'airport-wildlife-watch-katsina',
    'Monitor and document wildlife activity in and around Umaru Musa Yar''adua International Airport, Katsina, to establish a baseline dataset and inform wildlife risk management strategies.',
    'Document species present in the airport buffer zone; establish observation protocols; produce monthly field reports; inform airport wildlife management policy.',
    'Katsina, Nigeria',
    'active'
) ON CONFLICT (slug) DO NOTHING;
