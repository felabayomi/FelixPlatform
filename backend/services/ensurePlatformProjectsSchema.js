const pool = require('../db');

let ensurePlatformProjectsSchemaPromise = null;

async function ensurePlatformProjectsSchema() {
    if (!ensurePlatformProjectsSchemaPromise) {
        ensurePlatformProjectsSchemaPromise = (async () => {
            await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

            await pool.query(`
                CREATE TABLE IF NOT EXISTS platform_projects (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name TEXT NOT NULL,
                    slug TEXT UNIQUE NOT NULL,
                    app_path TEXT,
                    public_url TEXT,
                    admin_path TEXT NOT NULL,
                    sidebar_label TEXT NOT NULL,
                    quick_access_label TEXT,
                    icon_name TEXT,
                    category TEXT,
                    status TEXT NOT NULL DEFAULT 'draft',
                    show_in_sidebar BOOLEAN NOT NULL DEFAULT false,
                    show_in_quick_access BOOLEAN NOT NULL DEFAULT false,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);
        })().catch((error) => {
            ensurePlatformProjectsSchemaPromise = null;
            throw error;
        });
    }

    return ensurePlatformProjectsSchemaPromise;
}

module.exports = {
    ensurePlatformProjectsSchema,
};
