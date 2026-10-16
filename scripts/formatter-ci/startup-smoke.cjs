const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');

async function startupSmoke() {
  for (const enabled of [false, true]) {
    const preload = path.join(__dirname, 'startup-preload.cjs').replaceAll('\\', '/');
    const env = { PATH: process.env.PATH, HOME: process.env.HOME,
      NODE_ENV: 'production', PORT: '0',
      NODE_OPTIONS: `--max-old-space-size=128 --require="${preload}"`,
      SECRET_KEY: 'legacy-synthetic-signing-key-not-production' };
    for (const name of ['SystemRoot', 'TEMP']) if (process.env[name]) env[name] = process.env[name];
    if (enabled) {
      env.DOCUMENT_FORMATTER_ENABLED = 'true';
      env.DOCUMENT_FORMATTER_JWT_SECRET = 'formatter-synthetic-signing-key-not-production';
    }
    const child = cp.spawn(process.execPath, ['server.js'], {
      cwd: path.join(root, 'admin-dashboard'), env, stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });
    try {
      const port = await new Promise((resolve, reject) => {
        let output = '';
        const timer = setTimeout(() => reject(new Error('Startup timeout')), 20000);
        child.stdout.on('data', chunk => {
          output += chunk;
          const match = output.match(/VALIDATION_READY (\{[^\n]+\})/);
          if (match) { clearTimeout(timer); resolve(JSON.parse(match[1]).port); }
        });
        child.once('error', error => { clearTimeout(timer); reject(error); });
        child.once('exit', () => { clearTimeout(timer); reject(new Error('Startup exited')); });
      });
      const base = `http://127.0.0.1:${port}`;
      assert.equal((await fetch(base + '/api/health')).status, 200);
      if (enabled) {
        const response = await fetch(base + '/document-formatter/auth/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'synthetic@example.invalid', password: 'synthetic-password-only' }),
        });
        assert.equal(response.status, 200);
        const { token } = await response.json();
        assert.equal((await fetch(base + '/document-formatter/auth/me', { headers: { Authorization: `Bearer ${token}` } })).status, 200);
        assert.equal((await fetch(base + '/document-formatter/api/format/txt', {
          method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'Synthetic startup validation' }),
        })).status, 200);
      } else assert.equal((await fetch(base + '/document-formatter/api/health')).status, 404);
      const snapshot = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Snapshot timeout')), 5000);
        child.once('message', message => { clearTimeout(timer); resolve(message); });
        child.send('snapshot');
      });
      assert.equal(snapshot.formatterLoaded, enabled);
      assert.equal(snapshot.multerVersion, '2.4.0', 'Shared backend must resolve the patched upload dependency');
      assert.equal(snapshot.ddl, false);
      assert.equal(snapshot.accountWrites, false);
      assert.equal(snapshot.emails, 0);
      console.log(`PASS node server.js: ${enabled ? 'enabled with synthetic services' : 'flag absent; Formatter unloaded'}`);
    } finally {
      if (child.exitCode === null && child.signalCode === null) {
        const closed = new Promise(resolve => child.once('close', resolve));
        child.kill(); await closed;
      }
    }
  }
}
module.exports = { startupSmoke };
