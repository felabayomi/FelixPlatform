const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { assertMetadata, assertBlockedConnection, assertSameNamespace } = require('./verify-network.cjs');
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
  for (const code of ['ENOTFOUND', 'EAI_AGAIN', 'EACCES', 'EPERM']) {
    await assert.rejects(assertBlockedConnection(connect('error', code)), /not established/);
  }
  await assert.rejects(assertBlockedConnection(connect('close')), /without isolation evidence/);
  await assert.rejects(assertBlockedConnection(() => { throw new Error('synthetic tool failure'); }), /setup failed/);
  const idle = new EventEmitter();
  idle.destroy = () => {};
  await assert.rejects(assertBlockedConnection(() => idle, 20), /not proof/);
  await assert.rejects(assertBlockedConnection(connect('error', 'ENETUNREACH'), 0), /deadline/);
});

test('Node namespace identity must match the launcher and be well formed', () => {
  assert.doesNotThrow(() => assertSameNamespace('net:[42]', 'net:[42]'));
  for (const expected of [undefined, '', 'net:[43]', 'mnt:[42]', 'synthetic secret marker']) {
    assert.throws(() => assertSameNamespace('net:[42]', expected), /namespace mismatch/);
  }
  assert.throws(() => assertSameNamespace('invalid', 'net:[42]'), /namespace mismatch/);
});

test('launcher guards reject external interfaces, routes and prerequisite failures without sysfs', () => {
  const { spawnSync } = require('node:child_process');
  const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : '/usr/bin/bash';
  const launcher = fs.readFileSync(path.join(__dirname, 'run-isolated.sh'), 'utf8').replace(/\r\n/g, '\n');
  const body = launcher.split("<<'ISOLATED'\n")[1].split('\nISOLATED')[0];
  const mocks = `set -Eeuo pipefail
ip() {
  if [[ "$1" == link ]]; then
    [[ "$CASE" != loopback-up ]] || return 1
  elif [[ "$1" == -o ]]; then
    [[ "$CASE" != namespace-interface-query ]] || return 1
    printf '1: lo: <LOOPBACK>\\n'
    if [[ "$CASE" == external-interface ]]; then printf '2: eth0: <UP>\\n'; fi
  else
    [[ "$CASE" != default-route-query ]] || return 1
    if [[ "$CASE" == default-route ]]; then printf 'default via fixture\\n'; fi
  fi
  return 0
}
ls() { printf 'Unexpected sysfs access\\n' >&2; return 99; }
readlink() {
  [[ "$CASE" != namespace-read-failure ]] || return 1
  if [[ "$CASE" == bad-namespace ]]; then printf 'invalid\\n'; else printf 'net:[42]\\n'; fi
}
setpriv() {
  [[ "$CASE" != privilege-drop ]] || return 1
  [[ "$*" == *--clear-groups* && "$*" == *--bounding-set=-all* && "$*" == *--no-new-privs* ]]
  [[ "$*" == *'FORMATTER_EXPECTED_NET_NAMESPACE=net:[42]'* && "$*" == *--require=*verify-network.cjs* ]]
}
`;
  const cases = [['pass', null], ['loopback-up', 'loopback-up'],
    ['namespace-interface-query', 'namespace-interface-query'], ['external-interface', 'namespace-loopback-only'],
    ['default-route-query', 'default-route-query'], ['default-route', 'no-default-route'],
    ['namespace-read-failure', 'namespace-identity'], ['bad-namespace', 'namespace-identity'],
    ['privilege-drop', 'privilege-drop-or-validation']];
  for (const [scenario, stage] of cases) {
    const result = spawnSync(bash, ['-c', mocks + body, 'fixture', '/snapshot', '/node', '1001', '1001', '/home'], {
      env: { ...process.env, CASE: scenario, PRIVATE_SENTINEL: 'synthetic secret marker' },
      encoding: 'utf8', timeout: 5000,
    });
    assert.equal(result.status, stage ? 1 : 0, scenario);
    if (stage) assert.ok(result.stderr.includes(`stage=${stage}`), scenario);
    assert.ok(!`${result.stdout}${result.stderr}`.includes('synthetic secret marker'));
  }
});
