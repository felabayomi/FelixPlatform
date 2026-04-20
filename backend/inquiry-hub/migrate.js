'use strict';
// Migration script: Replit Neon → Felix Platform Neon
// Creates iq_* tables and copies data from Replit source tables

const { Pool } = require('pg');

const SOURCE_URL = 'postgresql://neondb_owner:npg_XHxhIRsS6J9p@ep-polished-snow-ae9106ed.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const DEST_URL = 'postgresql://neondb_owner:npg_Jv3njPmOYpD5@ep-cold-paper-an3vfznb-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const src = new Pool({ connectionString: SOURCE_URL, ssl: { rejectUnauthorized: false } });
const dst = new Pool({ connectionString: DEST_URL, ssl: { rejectUnauthorized: false } });

const DDL = `
CREATE TABLE IF NOT EXISTS users_iq (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_inquiries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users_iq(id) NOT NULL,
  question TEXT NOT NULL,
  pathway TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_reflections (
  id SERIAL PRIMARY KEY,
  inquiry_id INTEGER REFERENCES iq_inquiries(id) NOT NULL,
  week_of TIMESTAMP NOT NULL,
  content TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_resources (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users_iq(id) NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  tags TEXT[],
  annotation TEXT,
  visibility TEXT NOT NULL DEFAULT 'cohort',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_meetings (
  id SERIAL PRIMARY KEY,
  date TIMESTAMP NOT NULL,
  title TEXT NOT NULL,
  agenda TEXT,
  notes TEXT,
  action_items TEXT,
  zoom_link TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_report_sections (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  slug TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS iq_inquiry_comments (
  id SERIAL PRIMARY KEY,
  inquiry_id INTEGER REFERENCES iq_inquiries(id) NOT NULL,
  user_id INTEGER REFERENCES users_iq(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_report_versions (
  id SERIAL PRIMARY KEY,
  section_id INTEGER REFERENCES iq_report_sections(id) NOT NULL,
  user_id INTEGER REFERENCES users_iq(id) NOT NULL,
  content TEXT NOT NULL,
  justice_lens_tags TEXT[],
  visibility TEXT NOT NULL DEFAULT 'cohort',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_comments (
  id SERIAL PRIMARY KEY,
  section_id INTEGER REFERENCES iq_report_sections(id) NOT NULL,
  user_id INTEGER REFERENCES users_iq(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS iq_justice_lenses (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  indices TEXT[]
);

CREATE TABLE IF NOT EXISTS iq_inquiry_mappings (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_section_lens_mappings (
  id SERIAL PRIMARY KEY,
  mapping_id INTEGER REFERENCES iq_inquiry_mappings(id) NOT NULL,
  section_slug TEXT NOT NULL,
  lens_slug TEXT NOT NULL,
  indices TEXT[]
);

CREATE TABLE IF NOT EXISTS iq_section_focus_context (
  id SERIAL PRIMARY KEY,
  mapping_id INTEGER REFERENCES iq_inquiry_mappings(id) NOT NULL,
  section_slug TEXT NOT NULL,
  focus_context TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS iq_post_reads (
  id SERIAL PRIMARY KEY,
  version_id INTEGER REFERENCES iq_report_versions(id) NOT NULL,
  user_id INTEGER REFERENCES users_iq(id) NOT NULL,
  read_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_post_reactions (
  id SERIAL PRIMARY KEY,
  version_id INTEGER REFERENCES iq_report_versions(id) NOT NULL,
  user_id INTEGER REFERENCES users_iq(id) NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_ai_content_chunks (
  id SERIAL PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_id INTEGER NOT NULL,
  user_id INTEGER REFERENCES users_iq(id) NOT NULL,
  section_id INTEGER REFERENCES iq_report_sections(id),
  chunk_index INTEGER NOT NULL DEFAULT 0,
  chunk_text TEXT NOT NULL,
  start_offset INTEGER,
  end_offset INTEGER,
  content_hash TEXT NOT NULL,
  metadata JSONB,
  visibility TEXT NOT NULL DEFAULT 'cohort',
  exclude_from_ai BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_ai_summaries (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  scope TEXT NOT NULL,
  user_id INTEGER REFERENCES users_iq(id),
  section_id INTEGER REFERENCES iq_report_sections(id),
  time_range_start TIMESTAMP,
  time_range_end TIMESTAMP,
  content JSONB NOT NULL,
  evidence_chunk_ids INTEGER[],
  generated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_user_ai_settings (
  user_id INTEGER REFERENCES users_iq(id) PRIMARY KEY,
  include_private_in_ai BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW()
);
`;

// Map: source table name → destination table name (with iq_ prefix)
const TABLE_MAP = [
  { src: 'users',                dst: 'users_iq' },
  { src: 'inquiries',           dst: 'iq_inquiries' },
  { src: 'reflections',         dst: 'iq_reflections' },
  { src: 'resources',           dst: 'iq_resources' },
  { src: 'meetings',            dst: 'iq_meetings' },
  { src: 'report_sections',     dst: 'iq_report_sections' },
  { src: 'inquiry_comments',    dst: 'iq_inquiry_comments' },
  { src: 'report_versions',     dst: 'iq_report_versions' },
  { src: 'comments',            dst: 'iq_comments' },
  { src: 'app_settings',        dst: 'iq_app_settings' },
  { src: 'justice_lenses',      dst: 'iq_justice_lenses' },
  { src: 'inquiry_mappings',    dst: 'iq_inquiry_mappings' },
  { src: 'section_lens_mappings', dst: 'iq_section_lens_mappings' },
  { src: 'section_focus_context', dst: 'iq_section_focus_context' },
  { src: 'post_reads',          dst: 'iq_post_reads' },
  { src: 'post_reactions',      dst: 'iq_post_reactions' },
  { src: 'ai_content_chunks',   dst: 'iq_ai_content_chunks' },
  { src: 'ai_summaries',        dst: 'iq_ai_summaries' },
  { src: 'user_ai_settings',    dst: 'iq_user_ai_settings' },
];

async function migrate() {
  console.log('Creating iq_* schema in destination...');
  await dst.query(DDL);
  console.log('Schema created.\n');

  for (const { src: srcTable, dst: dstTable } of TABLE_MAP) {
    const { rows } = await src.query(`SELECT * FROM "${srcTable}" ORDER BY 1`);
    if (rows.length === 0) {
      console.log(`  ${srcTable} → ${dstTable}: 0 rows — skipping`);
      continue;
    }

    const cols = Object.keys(rows[0]);
    const colList = cols.map(c => `"${c}"`).join(', ');

    let inserted = 0;
    for (const row of rows) {
      const vals = cols.map((_, i) => `$${i + 1}`).join(', ');
      const values = cols.map(c => row[c]);
      try {
        await dst.query(
          `INSERT INTO "${dstTable}" (${colList}) VALUES (${vals}) ON CONFLICT DO NOTHING`,
          values
        );
        inserted++;
      } catch (e) {
        console.error(`  Error inserting into ${dstTable}: ${e.message}`);
      }
    }
    console.log(`  ${srcTable} → ${dstTable}: ${inserted}/${rows.length} rows`);

    // Reset sequence
    if (cols.includes('id')) {
      await dst.query(`SELECT setval(pg_get_serial_sequence('"${dstTable}"', 'id'), COALESCE(MAX(id), 1)) FROM "${dstTable}"`).catch(() => {});
    }
  }

  console.log('\nMigration complete!');
  await src.end();
  await dst.end();
}

migrate().catch(e => { console.error('Migration failed:', e.message); process.exit(1); });orm Neon
// Creates iq_* tables and copies data from Replit source tables

const { Pool } = require('pg');

const SOURCE_URL = 'postgresql://neondb_owner:npg_XHxhIRsS6J9p@ep-polished-snow-ae9106ed.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const DEST_URL = 'postgresql://neondb_owner:npg_Jv3njPmOYpD5@ep-cold-paper-an3vfznb-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const src = new Pool({ connectionString: SOURCE_URL, ssl: { rejectUnauthorized: false } });
const dst = new Pool({ connectionString: DEST_URL, ssl: { rejectUnauthorized: false } });

const DDL = `
CREATE TABLE IF NOT EXISTS users_iq (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_inquiries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users_iq(id) NOT NULL,
  question TEXT NOT NULL,
  pathway TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_reflections (
  id SERIAL PRIMARY KEY,
  inquiry_id INTEGER REFERENCES iq_inquiries(id) NOT NULL,
  week_of TIMESTAMP NOT NULL,
  content TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_resources (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users_iq(id) NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  tags TEXT[],
  annotation TEXT,
  visibility TEXT NOT NULL DEFAULT 'cohort',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_meetings (
  id SERIAL PRIMARY KEY,
  date TIMESTAMP NOT NULL,
  title TEXT NOT NULL,
  agenda TEXT,
  notes TEXT,
  action_items TEXT,
  zoom_link TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_report_sections (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  slug TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS iq_inquiry_comments (
  id SERIAL PRIMARY KEY,
  inquiry_id INTEGER REFERENCES iq_inquiries(id) NOT NULL,
  user_id INTEGER REFERENCES users_iq(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_report_versions (
  id SERIAL PRIMARY KEY,
  section_id INTEGER REFERENCES iq_report_sections(id) NOT NULL,
  user_id INTEGER REFERENCES users_iq(id) NOT NULL,
  content TEXT NOT NULL,
  justice_lens_tags TEXT[],
  visibility TEXT NOT NULL DEFAULT 'cohort',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_comments (
  id SERIAL PRIMARY KEY,
  section_id INTEGER REFERENCES iq_report_sections(id) NOT NULL,
  user_id INTEGER REFERENCES users_iq(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS iq_justice_lenses (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  indices TEXT[]
);

CREATE TABLE IF NOT EXISTS iq_inquiry_mappings (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_section_lens_mappings (
  id SERIAL PRIMARY KEY,
  mapping_id INTEGER REFERENCES iq_inquiry_mappings(id) NOT NULL,
  section_slug TEXT NOT NULL,
  lens_slug TEXT NOT NULL,
  indices TEXT[]
);

CREATE TABLE IF NOT EXISTS iq_section_focus_context (
  id SERIAL PRIMARY KEY,
  mapping_id INTEGER REFERENCES iq_inquiry_mappings(id) NOT NULL,
  section_slug TEXT NOT NULL,
  focus_context TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS iq_post_reads (
  id SERIAL PRIMARY KEY,
  version_id INTEGER REFERENCES iq_report_versions(id) NOT NULL,
  user_id INTEGER REFERENCES users_iq(id) NOT NULL,
  read_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_post_reactions (
  id SERIAL PRIMARY KEY,
  version_id INTEGER REFERENCES iq_report_versions(id) NOT NULL,
  user_id INTEGER REFERENCES users_iq(id) NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_ai_content_chunks (
  id SERIAL PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_id INTEGER NOT NULL,
  user_id INTEGER REFERENCES users_iq(id) NOT NULL,
  section_id INTEGER REFERENCES iq_report_sections(id),
  chunk_index INTEGER NOT NULL DEFAULT 0,
  chunk_text TEXT NOT NULL,
  start_offset INTEGER,
  end_offset INTEGER,
  content_hash TEXT NOT NULL,
  metadata JSONB,
  visibility TEXT NOT NULL DEFAULT 'cohort',
  exclude_from_ai BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_ai_summaries (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  scope TEXT NOT NULL,
  user_id INTEGER REFERENCES users_iq(id),
  section_id INTEGER REFERENCES iq_report_sections(id),
  time_range_start TIMESTAMP,
  time_range_end TIMESTAMP,
  content JSONB NOT NULL,
  evidence_chunk_ids INTEGER[],
  generated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iq_user_ai_settings (
  user_id INTEGER REFERENCES users_iq(id) PRIMARY KEY,
  include_private_in_ai BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW()
);
`;

// Map: source table name → destination table name (with iq_ prefix)
const TABLE_MAP = [
  { src: 'users',                dst: 'users_iq' },
  { src: 'inquiries',           dst: 'iq_inquiries' },
  { src: 'reflections',         dst: 'iq_reflections' },
  { src: 'resources',           dst: 'iq_resources' },
  { src: 'meetings',            dst: 'iq_meetings' },
  { src: 'report_sections',     dst: 'iq_report_sections' },
  { src: 'inquiry_comments',    dst: 'iq_inquiry_comments' },
  { src: 'report_versions',     dst: 'iq_report_versions' },
  { src: 'comments',            dst: 'iq_comments' },
  { src: 'app_settings',        dst: 'iq_app_settings' },
  { src: 'justice_lenses',      dst: 'iq_justice_lenses' },
  { src: 'inquiry_mappings',    dst: 'iq_inquiry_mappings' },
  { src: 'section_lens_mappings', dst: 'iq_section_lens_mappings' },
  { src: 'section_focus_context', dst: 'iq_section_focus_context' },
  { src: 'post_reads',          dst: 'iq_post_reads' },
  { src: 'post_reactions',      dst: 'iq_post_reactions' },
  { src: 'ai_content_chunks',   dst: 'iq_ai_content_chunks' },
  { src: 'ai_summaries',        dst: 'iq_ai_summaries' },
  { src: 'user_ai_settings',    dst: 'iq_user_ai_settings' },
];

async function migrate() {
  console.log('Creating iq_* schema in destination...');
  await dst.query(DDL);
  console.log('Schema created.\n');

  for (const { src: srcTable, dst: dstTable } of TABLE_MAP) {
    const { rows } = await src.query(`SELECT * FROM "${srcTable}" ORDER BY 1`);
    if (rows.length === 0) {
      console.log(`  ${srcTable} → ${dstTable}: 0 rows — skipping`);
      continue;
    }

    const cols = Object.keys(rows[0]);
    const colList = cols.map(c => `"${c}"`).join(', ');

    let inserted = 0;
    for (const row of rows) {
      const vals = cols.map((_, i) => `$${i + 1}`).join(', ');
      const values = cols.map(c => row[c]);
      try {
        await dst.query(
          `INSERT INTO "${dstTable}" (${colList}) VALUES (${vals}) ON CONFLICT DO NOTHING`,
          values
        );
        inserted++;
      } catch (e) {
        console.error(`  Error inserting into ${dstTable}: ${e.message}`);
      }
    }
    console.log(`  ${srcTable} → ${dstTable}: ${inserted}/${rows.length} rows`);

    // Reset sequence
    if (cols.includes('id')) {
      await dst.query(`SELECT setval(pg_get_serial_sequence('"${dstTable}"', 'id'), COALESCE(MAX(id), 1)) FROM "${dstTable}"`).catch(() => {});
    }
  }

  console.log('\nMigration complete!');
  await src.end();
  await dst.end();
}

migrate().catch(e => { console.error('Migration failed:', e.message); process.exit(1); });
