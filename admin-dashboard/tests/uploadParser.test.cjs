const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const multer = require('multer');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let server, base, directory, sequence = 0;
before(async () => {
  assert.equal(require('multer/package.json').version, '2.4.0');
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'formatter-upload-test-'));
  const app = express();
  const limits = { fileSize: 1024, fieldNameSize: 32, fieldSize: 128, fields: 4 };
  const respond = (req, res) => res.json({ received: Boolean(req.file) });
  app.post('/memory', multer({ storage: multer.memoryStorage(), limits }).single('file'), respond);
  app.post('/disk', multer({ storage: multer.diskStorage({
    destination: directory,
    filename: (_req, _file, callback) => setTimeout(() => callback(null, `synthetic-${sequence++}.txt`), 30),
  }), limits }).single('file'), respond);
  app.post('/json', express.json({ limit: '1kb' }), (_req, res) => res.json({ ok: true }));
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use((error, _req, res, _next) => res.status(error.type === 'entity.too.large' ? 413 : 400).json({ code: error.code || error.type }));
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (directory) {
    const target = fs.realpathSync(directory), temporary = fs.realpathSync(os.tmpdir());
    assert.ok(target.startsWith(temporary + path.sep) && path.basename(target).startsWith('formatter-upload-test-'));
    fs.rmSync(target, { recursive: true, force: true });
  }
});
const post = (route, body) => fetch(base + route, { method: 'POST', body });

test('updated Multer accepts files and enforces file and field limits', async () => {
  const valid = new FormData(); valid.append('file', new Blob(['Synthetic']), 'test.txt');
  assert.equal((await post('/memory', valid)).status, 200);
  const large = new FormData(); large.append('file', new Blob(['x'.repeat(2048)]), 'large.txt');
  assert.equal((await (await post('/memory', large)).json()).code, 'LIMIT_FILE_SIZE');
  const field = new FormData(); field.append('x'.repeat(64), 'synthetic');
  assert.equal((await (await post('/memory', field)).json()).code, 'LIMIT_FIELD_KEY');
});

test('large multipart array indices do not terminate the application', async () => {
  const form = new FormData();
  form.append('items[4294967295]', 'synthetic');
  form.append('items[9007199254740991]', 'synthetic');
  assert.ok([200, 400].includes((await post('/memory', form)).status));
  assert.equal((await fetch(base + '/health')).status, 200);
});

test('aborted disk uploads clean up files and leave the parser usable', async () => {
  for (let i = 0; i < 3; i++) {
    await new Promise(resolve => {
      const request = http.request(base + '/disk', {
        method: 'POST', headers: { 'Content-Type': 'multipart/form-data; boundary=fixture', 'Content-Length': '10000' },
      });
      request.on('error', () => {});
      request.once('close', resolve);
      request.write('--fixture\r\nContent-Disposition: form-data; name="file"; filename="test.txt"\r\nContent-Type: text/plain\r\n\r\nSynthetic',
        () => setTimeout(() => request.destroy(), 10));
    });
  }
  await new Promise(resolve => setTimeout(resolve, 200));
  assert.deepEqual(fs.readdirSync(directory), []);
  const valid = new FormData(); valid.append('file', new Blob(['Synthetic']), 'test.txt');
  assert.equal((await post('/memory', valid)).status, 200);
});

test('updated JSON parser enforces limits and rejects malformed JSON', async () => {
  const send = body => fetch(base + '/json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  assert.equal((await send('{}')).status, 200);
  assert.equal((await send('{')).status, 400);
  assert.equal((await send(JSON.stringify({ text: 'x'.repeat(2048) }))).status, 413);
});
