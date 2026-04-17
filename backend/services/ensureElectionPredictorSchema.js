const pool = require('../db');

let schemaPromise = null;

async function ensureElectionPredictorSchema() {
    if (schemaPromise) return schemaPromise;
    schemaPromise = _run();
    return schemaPromise;
}

async function _run() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ep_races (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
            type VARCHAR(20) NOT NULL,
            title TEXT NOT NULL,
            state TEXT,
            district TEXT,
            election_date TEXT NOT NULL,
            description TEXT,
            view_count INTEGER DEFAULT 0
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS ep_candidates (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
            name TEXT NOT NULL,
            party VARCHAR(20) NOT NULL,
            photo_url TEXT,
            position TEXT,
            district TEXT,
            state TEXT,
            polling_average DOUBLE PRECISION,
            fundraising_total DOUBLE PRECISION,
            is_incumbent INTEGER DEFAULT 0,
            years_experience INTEGER,
            major_endorsements INTEGER
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS ep_race_candidates (
            race_id VARCHAR NOT NULL REFERENCES ep_races(id) ON DELETE CASCADE,
            candidate_id VARCHAR NOT NULL REFERENCES ep_candidates(id) ON DELETE CASCADE,
            PRIMARY KEY (race_id, candidate_id)
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS ep_predictions (
            race_id VARCHAR NOT NULL REFERENCES ep_races(id) ON DELETE CASCADE,
            candidate_id VARCHAR NOT NULL REFERENCES ep_candidates(id) ON DELETE CASCADE,
            win_probability DOUBLE PRECISION NOT NULL,
            confidence_interval_low DOUBLE PRECISION NOT NULL,
            confidence_interval_high DOUBLE PRECISION NOT NULL,
            factors JSONB NOT NULL,
            last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            methodology TEXT NOT NULL,
            ai_analysis TEXT,
            PRIMARY KEY (race_id, candidate_id)
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS ep_featured_matchups (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            url TEXT NOT NULL,
            display_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
}

module.exports = ensureElectionPredictorSchema;
