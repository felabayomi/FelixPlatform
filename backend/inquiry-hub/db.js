'use strict';
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require('./schema');

const connectionString = process.env.INQUIRY_HUB_DATABASE_URL || process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
});

const db = drizzle(pool, { schema });

module.exports = { db, pool };
