const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Never load the real database adapter (including its dotenv configuration).
process.env.SECRET_KEY = 'local-regression-secret-only-never-production';
process.env.DATABASE_URL = 'postgres://test:test@127.0.0.1:1/never-connected';
process.env.ALLOWED_ORIGINS = ' https://formatter.felixplatforms.com,https://formatter.felixplatforms.com,https://extra.example';
const queries = [];
const allQueries = [];
let dbFailure = false;
let missingTables = false;
let role = 'admin';
let userExists = true;
let subscribed = false;
let emailCalls = 0;
const password = bcrypt.hashSync('test-password-only', 4);
const pool = { async query(sql) {
  queries.push(sql);
  allQueries.push(sql);
  if (dbFailure || (missingTables && /document_formatter_/.test(sql))) throw new Error('mock database failure');
  if (/FROM users/i.test(sql)) return { rows: userExists ? [{ id: 'test-user', name: 'Test', email: 'test@example.invalid', role, password }] : [] };
  if (/SELECT EXISTS/i.test(sql)) return { rows: [{ has_access: subscribed }] };
  return { rows: [] };
} };
const originalLoad = Module._load;
Module._load = function(request, parent, ...rest) {
  if (request === 'openai') return class MockOpenAI {
    constructor() { this.chat = { completions: { create() { throw new Error('AI calls disabled in regression tests'); } } }; }
  };
  const resolved = Module._resolveFilename(request, parent);
  if (resolved === path.resolve(__dirname, '../db.js')) return pool;
  if (resolved === path.resolve(__dirname, '../services/resendEmail.js')) return {
    sendEmail: async () => { emailCalls++; },
    sendDocumentFormatterAccessRequestNotification: async () => {
      emailCalls++; return { admin: { sent: true }, customer: { sent: true } };
    },
  };
  return originalLoad.call(this, request, parent, ...rest);
};
let app;
try { app = require('../documentFormatterServer').createDocumentFormatterApp(); } finally { Module._load = originalLoad; }
let server, base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); });
const token = () => jwt.sign({ id: 'test-user', role }, process.env.SECRET_KEY);
const request = (url, { body, auth, ...options } = {}) => fetch(base + url, {
  ...options,
  headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...options.headers },
  ...(body ? { body: JSON.stringify(body), method: options.method || 'POST' } : {}),
});

test('exact configured CORS origins and bearer-header preflights', async () => {
  for (const origin of ['https://formatter.felixplatforms.com', 'https://extra.example']) {
    const res = await request('/auth/login', { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,authorization' } });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), origin);
    assert.equal(res.headers.get('access-control-allow-credentials'), null);
    assert.match(res.headers.get('vary'), /Origin/);
    assert.match(res.headers.get('access-control-allow-headers'), /authorization/);
  }
  for (const origin of ['https://formatter.felixplatforms.com.evil.example', 'https://random.vercel.app', 'https://bad.example', 'null']) {
    const res = await request('/auth/login', { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST' } });
    assert.equal(res.headers.get('access-control-allow-origin'), null);
  }
  assert.equal((await request('/api/health')).status, 200);
});

test('real login, password verification, JWT and me', async () => {
  assert.equal((await request('/auth/login', { body: {} })).status, 400);
  userExists = false;
  try { assert.equal((await request('/auth/login', { body: { email: 'missing@example.invalid', password: 'test-password-only' } })).status, 401); }
  finally { userExists = true; }
  assert.equal((await request('/auth/login', { body: { email: 'test@example.invalid', password: 'wrong' } })).status, 401);
  const res = await request('/auth/login', { body: { email: 'test@example.invalid', password: 'test-password-only' }, headers: { Origin: 'https://formatter.felixplatforms.com' } });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://formatter.felixplatforms.com');
  const data = await res.json();
  assert.equal(jwt.verify(data.token, process.env.SECRET_KEY).id, 'test-user');
  assert.equal(data.user.password, undefined);
  assert.equal(data.user.document_formatter_access, true);
  assert.equal((await request('/auth/me', { auth: data.token })).status, 200);
  for (const auth of [undefined, 'demo-token', jwt.sign({ id: 'test-user' }, process.env.SECRET_KEY, { expiresIn: -1 }), jwt.sign({ id: 'test-user' }, 'wrong-secret')]) {
    assert.equal((await request('/auth/me', { auth })).status, 401);
  }
  dbFailure = true;
  try { assert.equal((await request('/auth/login', { body: { email: 'test@example.invalid', password: 'test-password-only' } })).status, 500); }
  finally { dbFailure = false; }
  assert.equal((await request('/auth/register', { body: {} })).status, 404);
  assert.equal((await request('/auth/forgot-password', { body: {} })).status, 404);
});

test('formatter authorization and real output formats', async () => {
  queries.length = 0;
  assert.equal((await request('/api/format/txt', { body: { text: 'Hello' } })).status, 401);
  role = 'customer';
  try {
    assert.equal((await request('/api/format/txt', { auth: token(), body: { text: 'Hello' } })).status, 403);
    subscribed = true;
    assert.equal((await request('/api/format/txt', { auth: token(), body: { text: 'Hello' } })).status, 403);
    const login = await request('/auth/login', { body: { email: 'test@example.invalid', password: 'test-password-only' } });
    assert.equal((await login.json()).user.document_formatter_access, false);
    assert.equal((await request('/api/admin/overview', { auth: token() })).status, 403);
  } finally { role = 'admin'; subscribed = false; }
  for (const [format, signature] of [['txt', null], ['docx', 'PK'], ['pdf', '%PDF']]) {
    const res = await request(`/api/format/${format}`, { auth: token(), body: { text: 'Hello test document', title: 'Test' } });
    assert.equal(res.status, 200);
    if (signature) {
      const buffer = Buffer.from(await res.arrayBuffer());
      assert.equal(buffer.subarray(0, signature.length).toString(), signature);
      if (format === 'docx') {
        const doc = new FormData();
        doc.append('file', new Blob([buffer]), 'generated.docx');
        const extracted = await fetch(base + '/api/format/extract', { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: doc });
        assert.equal(extracted.status, 200);
        assert.match((await extracted.json()).text, /Hello test document/);
      }
    }
    else assert.match((await res.json()).formattedText, /Hello test document/);
  }
  assert.equal((await request('/api/format/txt', { auth: token(), body: {} })).status, 400);
  const form = new FormData();
  form.append('file', new Blob(['Local extraction text']), 'sample.txt');
  const extracted = await request('/api/format/extract', { method: 'POST', auth: token(), body: undefined, headers: {}, });
  assert.equal(extracted.status, 400);
  const res = await fetch(base + '/api/format/extract', { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: form });
  assert.equal(res.status, 200);
  assert.match(JSON.stringify(await res.json()), /Local extraction text/);
  const invalid = new FormData();
  invalid.append('file', new Blob(['invalid']), 'sample.exe');
  assert.equal((await fetch(base + '/api/format/extract', { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: invalid })).status, 400);
  assert.equal(queries.some(sql => /\b(CREATE|ALTER|DROP)\b/i.test(sql)), false);
});

test('formatter routes suppress DDL and do not expose unrelated products', async () => {
  for (const url of ['/products', '/api/organization', '/api/election-predictor/races', '/api/expedition-america/articles']) assert.equal((await request(url)).status, 404);
  for (const url of ['/api/auth/login', '/api/campaign-signal', '/auth/register', '/auth/reset-password']) assert.equal((await request(url, { body: {} })).status, 404);
  assert.equal((await (await request('/api/health')).json()).service, 'document-formatter');
  queries.length = 0;
  assert.equal((await request('/api/admin/overview', { auth: token() })).status, 200);
  assert.equal((await request('/api/request-access', { body: { name: 'Test', email: 'test@example.invalid', reason: 'Local test' } })).status, 200);
  assert.equal(emailCalls, 1);
  assert.equal(queries.some(sql => /\b(CREATE|ALTER|DROP)\b/i.test(sql)), false);
  missingTables = true;
  try { assert.equal((await request('/api/admin/overview', { auth: token() })).status, 500); }
  finally { missingTables = false; }
  assert.equal(queries.some(sql => /\b(CREATE|ALTER|DROP)\b/i.test(sql)), false);
});

test('other entrypoints retain lazy schema initialization; scoped policy does not leak', async () => {
  const controller = require('../controllers/documentFormatterController');
  queries.length = 0;
  await controller.getAdminOverview({}, { json() {}, status() { return this; } });
  assert.equal(queries.filter(sql => /CREATE TABLE/i.test(sql)).length, 2);
});

test('schema policy remains isolated across concurrent asynchronous work', async () => {
  const { withExistingSchema, usesExistingSchema } = require('../services/schemaPolicy');
  const scopedRequest = {};
  const otherRequest = {};
  await Promise.all([
    new Promise((resolve, reject) => withExistingSchema(scopedRequest, {}, async () => {
      try {
        await new Promise(done => setImmediate(done));
        assert.equal(usesExistingSchema(scopedRequest), true);
        resolve();
      } catch (error) { reject(error); }
    })),
    (async () => {
      await new Promise(done => setImmediate(done));
      assert.equal(usesExistingSchema(otherRequest), false);
    })(),
  ]);
});

test('configuration fails closed and does not load unrelated services', () => {
  const { createDocumentFormatterApp } = require('../documentFormatterServer');
  const savedKey = process.env.SECRET_KEY, savedOrigins = process.env.ALLOWED_ORIGINS;
  const savedDatabase = process.env.DATABASE_URL;
  try {
    for (const key of ['', 'secretkey', 'short-key', ' padded-key-that-is-long-enough-for-validation ']) {
      process.env.SECRET_KEY = key;
      assert.throws(createDocumentFormatterApp, /SECRET_KEY/);
    }
    process.env.SECRET_KEY = savedKey;
    delete process.env.DATABASE_URL;
    assert.throws(createDocumentFormatterApp, /DATABASE_URL/);
    process.env.DATABASE_URL = savedDatabase;
    for (const origins of ['', '*', 'https://bad.example/path', 'https://*.example.com']) {
      process.env.ALLOWED_ORIGINS = origins;
      assert.throws(createDocumentFormatterApp, /ALLOWED_ORIGINS/);
    }
  } finally { process.env.SECRET_KEY = savedKey; process.env.ALLOWED_ORIGINS = savedOrigins; process.env.DATABASE_URL = savedDatabase; }
  assert.equal(Object.keys(require.cache).some(p => /campaign-signal|electionPredictor|expeditionAmericaController|inquiry-hub/.test(p)), false);
});

test('shared entitlement behavior is unchanged outside the dedicated service', async () => {
  const { hasDocumentFormatterAccess } = require('../services/accessControl');
  subscribed = true;
  try {
    assert.equal(await hasDocumentFormatterAccess({ id: 'test-user', role: 'customer' }), true);
    queries.length = 0;
    assert.equal(await hasDocumentFormatterAccess({ id: 'test-user', role: 'customer' }, { formatterAdminOnly: true }), false);
    assert.equal(queries.length, 0);
  } finally { subscribed = false; }
});

test('superadmins retain access and user/subscription records are never mutated', async () => {
  role = 'superadmin';
  try {
    assert.equal((await request('/api/format/txt', { auth: token(), body: { text: 'Test' } })).status, 200);
    assert.equal((await request('/api/admin/overview', { auth: token() })).status, 200);
  } finally { role = 'admin'; }
  assert.equal(allQueries.some(sql => /\b(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+(?:users|subscriptions)\b/i.test(sql)), false);
});

test('JSON parser rejects malformed and oversized requests safely', async () => {
  const response = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'invalid_request' });
  assert.equal((await request('/api/format/txt', { auth: token(), body: { text: 'x'.repeat(1024 * 1024) } })).status, 413);
});
