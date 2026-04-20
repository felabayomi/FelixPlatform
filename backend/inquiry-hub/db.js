'use strict';
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require('./schema');

const connectionString = process.env.INQUIRY_HUB_DATABASE_URL || process.env.DATABASE_URL;
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool, { schema });

module.exports = { db, pool };
