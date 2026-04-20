'use strict';
const { drizzle } = require('drizzle-orm/node-postgres');
const pool = require('../db');
const schema = require('./schema');

const db = drizzle(pool, { schema });

module.exports = { db, pool };
