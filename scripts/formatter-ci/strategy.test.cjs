const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { assertMetadata, assertBlockedConnection } = require('./verify-network.cjs');
const { exportSnapshot } = require('./export-snapshot.cjs');
const valid = { platform: 'linux', interfaces: { lo: [{ internal: true }] }, routes: 'Iface Destination\n',
  status: 'CapEff:\t00000000\nCapBnd:\t00000000\nNoNewPrivs:\t1\n', uid: 1001 };

test('network metadata guard accepts only the expected restricted state', () => {
  assert.doesNotThrow(() => assertMetadata(valid));
  for (const change of [{ platform: 'win32' }, { uid: 0 }, { interfaces: { ...valid.interfaces, eth0: [] } },
    { routes: 'Iface Destination\neth0 00000000\n' }, { status: valid.status.replace('CapEff:\t00000000', 'CapEff:\t00000001') },
    { status: valid.status.replace('CapBnd:\t00000000', 'CapBnd:\t00000001') },
    { status: valid.status.replace('NoNewPrivs:\t1', 'NoNewPrivs:\t0') }]) {
    assert.throws(() => assertMetadata({ ...valid, ...change }));
  }
});

test('source export excludes credentials, records, dependencies and Git objects', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'formatter-export-test-'));
  try {
    const source = path.join(temporary, 'source'), destination = path.join(temporary, 'snapshot');
    for (const directory of ['admin-dashboard/tests', 'backend/controllers', 'backend/middleware', 'backend/routes',
      'backend/services', 'backend/tests', 'scripts/formatter-ci', '.git', 'backend/data']) fs.mkdirSync(path.join(source, directory), { recursive: true });
    for (const file of ['admin-dashboard/server.js', 'admin-dashboard/package.json', 'admin-dashboard/package-lock.json',
      'backend/db.js', 'backend/documentFormatterServer.js', 'backend/services/fixture.js', 'scripts/formatter-ci/fixture.sh']) {
      fs.writeFileSync(path.join(source, file), 'synthetic');
    }
    for (const file of ['backend/services/.env', 'backend/data/records.js', '.git/config', 'backend/services/records.json']) {
      fs.writeFileSync(path.join(source, file), 'synthetic secret marker');
    }
    const files = exportSnapshot(source, destination);
    assert.ok(files.includes(path.join('backend/services', 'fixture.js')));
    for (const file of ['backend/services/.env', 'backend/data/records.js', '.git/config', 'backend/services/records.json']) {
      assert.equal(fs.existsSync(path.join(destination, file)), false);
    }
    assert.throws(() => exportSnapshot(source, path.join(source, 'nested')));
    assert.throws(() => exportSnapshot(source, destination));
  } finally {
    const target = fs.realpathSync(temporary), parent = fs.realpathSync(os.tmpdir());
    assert.ok(target.startsWith(parent + path.sep) && path.basename(target).startsWith('formatter-export-test-'));
    fs.rmSync(target, { recursive: true, force: true });
  }
});

test('network probe fails closed on successful connections, timeout and ambiguous errors', async () => {
  const connect = (event, code) => () => {
    const socket = new EventEmitter();
    socket.setTimeout = () => socket;
    socket.destroy = () => {};
    queueMicrotask(() => socket.emit(event, { code }));
    return socket;
  };
  for (const code of ['ENETUNREACH', 'EHOSTUNREACH']) {
    await assert.doesNotReject(assertBlockedConnection(connect('error', code)));
  }
  await assert.rejects(assertBlockedConnection(connect('connect')), /succeeded/);
  await assert.rejects(assertBlockedConnection(connect('timeout')), /not proof/);
  await assert.rejects(assertBlockedConnection(connect('error', 'ECONNREFUSED')), /not established/);
});
