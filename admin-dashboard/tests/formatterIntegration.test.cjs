const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

delete process.env.DOCUMENT_FORMATTER_ENABLED;
process.env.SECRET_KEY = 'legacy-test-key-only-never-for-production';
process.env.DOCUMENT_FORMATTER_JWT_SECRET = 'formatter-test-key-only-never-for-production';
const password = bcrypt.hashSync('test-password', 4);
let role = 'admin', subscribed = true, emailCalls = 0;
const queries = [];
const dbPath = path.resolve(__dirname, '../../backend/db.js');
const emailPath = path.resolve(__dirname, '../../backend/services/resendEmail.js');
const integrationPath = path.resolve(__dirname, '../../backend/routes/formatterIntegration.js');
const originalLoad = Module._load;
Module._load = function(request, parent, ...rest) {
  if (request === 'openai') return class MockOpenAI {};
  const resolved = Module._resolveFilename(request, parent);
  if (resolved === dbPath) return { async query(sql) {
    queries.push(sql);
    if (/FROM users/i.test(sql)) return { rows: [{ id: 'fixture-user', name: 'Test', email: 'test@example.invalid', role, password }] };
    if (/SELECT EXISTS/i.test(sql)) return { rows: [{ has_access: subscribed }] };
    return { rows: [] };
  } };
  if (resolved === emailPath) return {
    sendEmail: async () => { emailCalls++; },
    sendDocumentFormatterAccessRequestNotification: async () => {
      emailCalls++; return { admin: { sent: true }, customer: { sent: true } };
    },
  };
  return originalLoad.call(this, request, parent, ...rest);
};
const app = require('../server');
// Test-only legacy routes demonstrate unchanged shared issuer/verifier behavior.
const legacyAuth = require('../../backend/controllers/authController');
const legacyMiddleware = require('../../backend/middleware/authMiddleware');
app.post('/_legacy-login', legacyAuth.login);
app.get('/_legacy-me', legacyMiddleware.authenticateToken, legacyAuth.getCurrentUser);
let server, base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { Module._load = originalLoad; await new Promise(resolve => server.close(resolve)); });
const request = (url, { body, token, headers, ...options } = {}) => fetch(base + url, {
  ...options, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
  ...(body ? { method: options.method || 'POST', body: JSON.stringify(body) } : {}),
});
const prefix = '/document-formatter';
const credentials = { email: 'test@example.invalid', password: 'test-password' };
const formatterToken = (options = {}) => jwt.sign({ id: 'fixture-user' }, process.env.DOCUMENT_FORMATTER_JWT_SECRET, {
  issuer: 'felixplatform:document-formatter', audience: 'document-formatter', ...options,
});

test('disabled by default; only literal true enables; optional modules remain unloaded', async () => {
  for (const flag of [undefined, '', 'false', 'TRUE', '1']) {
    if (flag === undefined) delete process.env.DOCUMENT_FORMATTER_ENABLED;
    else process.env.DOCUMENT_FORMATTER_ENABLED = flag;
    assert.equal((await request(prefix + '/auth/login', { body: credentials })).status, 404);
    assert.equal((await request(prefix + '/api/health')).status, 404);
  }
  assert.equal(require.cache[integrationPath], undefined);
});

test('existing application contracts remain available with Formatter off or on', async () => {
  for (const flag of ['false', 'true']) {
    process.env.DOCUMENT_FORMATTER_ENABLED = flag;
    assert.equal((await (await request('/')).json()).message, 'Felix Platform Backend Running');
    assert.equal((await (await request('/api/health')).json()).service, 'campaign-signal-studio-api');
    for (const p of ['/api', '/api/campaign-signal/api']) {
      assert.equal((await (await request(p + '/auth/login', { body: { email: 'demo@example.invalid' } })).json()).token, 'demo-token');
      assert.equal((await (await request(p + '/auth/signup', { body: { email: 'demo@example.invalid' } })).json()).user.id, 'demo-user');
      assert.equal((await (await request(p + '/organization')).json()).organization.hasPremiumAccess, true);
    }
    assert.equal((await request('/api/campaign-signal/api/health')).status, 200);
    assert.ok((await (await request('/api/campaign-signal', { body: {} })).json()).raceSnapshot);
    assert.equal((await request('/api/election-predictor/races')).status, 200);
    assert.equal((await request('/api/expedition-america/admin/verify', { body: {} })).status, 401);
    assert.equal((await request('/auth/login', { body: credentials })).status, 404);
    assert.equal((await request(prefix + '/api/organization')).status, 404);
  }
});

test('Formatter CORS is exact and cannot alter legacy CORS', async () => {
  process.env.DOCUMENT_FORMATTER_ENABLED = 'true';
  const preflight = (url, origin) => request(url, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } });
  const allowed = await preflight(prefix + '/auth/login', 'https://formatter.felixplatforms.com');
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://formatter.felixplatforms.com');
  assert.match(allowed.headers.get('access-control-allow-headers'), /authorization/);
  for (const origin of ['https://formatter.felixplatforms.com.evil.example', 'https://random.vercel.app', 'http://localhost:5173']) {
    assert.equal((await preflight(prefix + '/auth/login', origin)).headers.get('access-control-allow-origin'), null);
  }
  assert.equal((await preflight('/api/auth/login', 'https://formatter.felixplatforms.com')).headers.get('access-control-allow-origin'), null);
  for (const origin of ['http://localhost:5173', 'https://app-7mggnqfx6-felabayomis-projects.vercel.app', 'https://app-mu-liart-41.vercel.app', 'https://expeditionamerica.online', 'https://www.expeditionamerica.online']) {
    const response = await preflight('/api/auth/login', origin);
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
    assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
  }
});

test('real login; issuer/audience/algorithm and signing keys isolate tokens both ways', async () => {
  const response = await request(prefix + '/auth/login', { body: credentials });
  assert.equal(response.status, 200);
  const data = await response.json();
  const payload = jwt.verify(data.token, process.env.DOCUMENT_FORMATTER_JWT_SECRET, { algorithms: ['HS256'], issuer: 'felixplatform:document-formatter', audience: 'document-formatter' });
  assert.equal(payload.id, 'fixture-user');
  assert.equal(data.user.password, undefined);
  assert.equal((await request(prefix + '/auth/me', { token: data.token })).status, 200);
  assert.equal((await request('/_legacy-me', { token: data.token })).status, 401);
  const legacyLogin = await request('/_legacy-login', { body: credentials });
  const legacyToken = (await legacyLogin.json()).token;
  assert.equal(jwt.verify(legacyToken, process.env.SECRET_KEY).iss, undefined);
  assert.equal((await request('/_legacy-me', { token: legacyToken })).status, 200);
  for (const token of [legacyToken, 'demo-token', jwt.sign({ id: 'fixture-user' }, 'secretkey'), formatterToken({ issuer: 'wrong' }), formatterToken({ audience: 'wrong' }), formatterToken({ algorithm: 'HS384' }), formatterToken({ expiresIn: -1 }), jwt.sign({ id: 'fixture-user' }, process.env.DOCUMENT_FORMATTER_JWT_SECRET)]) {
    assert.equal((await request(prefix + '/auth/me', { token })).status, 401);
    assert.equal((await request(prefix + '/api/format/txt', { token, body: { text: 'Test' } })).status, 401);
  }
  assert.equal((await request(prefix + '/auth/login', { body: { ...credentials, password: 'wrong' } })).status, 401);
});

test('missing/bad Formatter secret disables only Formatter without legacy key mutation', async () => {
  const saved = process.env.DOCUMENT_FORMATTER_JWT_SECRET;
  const legacy = process.env.SECRET_KEY;
  try {
    for (const key of [undefined, '', 'secretkey', 'short', legacy, ' padded-secret-long-enough-but-invalid ']) {
      if (key === undefined) delete process.env.DOCUMENT_FORMATTER_JWT_SECRET;
      else process.env.DOCUMENT_FORMATTER_JWT_SECRET = key;
      queries.length = 0;
      const response = await request(prefix + '/auth/login', { body: credentials, headers: { Origin: 'https://formatter.felixplatforms.com' } });
      assert.equal(response.status, 503);
      assert.equal(response.headers.get('access-control-allow-origin'), 'https://formatter.felixplatforms.com');
      assert.equal((await request(prefix + '/api/format/txt', { body: { text: 'Test' } })).status, 503);
      assert.equal(queries.length, 0);
      assert.equal((await request('/api/health')).status, 200);
      assert.equal((await request('/_legacy-me', { token: jwt.sign({ id: 'fixture-user' }, legacy) })).status, 200);
      assert.equal(process.env.SECRET_KEY, legacy);
    }
    delete process.env.SECRET_KEY;
    process.env.DOCUMENT_FORMATTER_JWT_SECRET = saved;
    const token = (await (await request('/_legacy-login', { body: credentials })).json()).token;
    assert.equal(jwt.verify(token, 'secretkey').id, 'fixture-user');
    assert.equal((await request('/_legacy-me', { token })).status, 200);
    assert.equal((await request(prefix + '/auth/me', { token })).status, 401);
  } finally { process.env.DOCUMENT_FORMATTER_JWT_SECRET = saved; process.env.SECRET_KEY = legacy; }
});

test('admin-only pilot, real document operations, and no DDL or account writes', async () => {
  queries.length = 0;
  role = 'customer';
  try {
    const user = (await (await request(prefix + '/auth/login', { body: credentials })).json()).user;
    assert.equal(user.document_formatter_access, false);
    assert.equal((await request(prefix + '/api/format/txt', { token: formatterToken(), body: { text: 'Test' } })).status, 403);
    assert.equal((await request(prefix + '/api/admin/overview', { token: formatterToken() })).status, 403);
    assert.equal((await (await request('/_legacy-login', { body: credentials })).json()).user.document_formatter_access, true);
  } finally { role = 'admin'; }
  for (const format of ['txt', 'docx', 'pdf']) {
    const response = await request(prefix + '/api/format/' + format, { token: formatterToken(), body: { text: 'Shared Formatter test' } });
    assert.equal(response.status, 200);
    if (format === 'txt') assert.match((await response.json()).formattedText, /Shared Formatter test/);
    else {
      const buffer = Buffer.from(await response.arrayBuffer());
      assert.equal(buffer.subarray(0, format === 'docx' ? 2 : 4).toString(), format === 'docx' ? 'PK' : '%PDF');
      if (format === 'docx') {
        const form = new FormData(); form.append('file', new Blob([buffer]), 'test.docx');
        const extracted = await fetch(base + prefix + '/api/format/extract', { method: 'POST', headers: { Authorization: `Bearer ${formatterToken()}` }, body: form });
        assert.equal(extracted.status, 200);
        assert.match((await extracted.json()).text, /Shared Formatter test/);
      }
    }
  }
  assert.equal((await request(prefix + '/api/admin/overview', { token: formatterToken() })).status, 200);
  assert.equal((await request(prefix + '/api/request-access', { body: { name: 'Test', email: 'test@example.invalid', reason: 'Test' } })).status, 200);
  assert.equal(emailCalls, 1);
  assert.equal(queries.some(sql => /\b(CREATE|ALTER|DROP)\b/i.test(sql)), false);
  assert.equal(queries.some(sql => /\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+(users|subscriptions)\b/i.test(sql)), false);
  process.env.DOCUMENT_FORMATTER_ENABLED = 'false';
  assert.equal((await request(prefix + '/auth/me', { token: formatterToken() })).status, 404);
  assert.equal((await request('/api/health')).status, 200);
});
