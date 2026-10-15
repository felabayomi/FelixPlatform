const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const net = require('node:net');

function assertMetadata({ platform, interfaces, routes, status, uid }) {
  assert.equal(platform, 'linux', 'Linux is required');
  assert.notEqual(uid, 0, 'Tests must run without root');
  assert.deepEqual(Object.keys(interfaces).sort(), ['lo'], 'Only loopback may exist');
  assert.ok(Object.values(interfaces).flat().every(address => address.internal), 'External address rejected');
  assert.ok(routes.trim().split('\n').slice(1).every(line => !line.trim() || line.trim().split(/\s+/)[0] === 'lo'), 'External route rejected');
  for (const field of ['CapEff', 'CapBnd']) {
    const value = status.match(new RegExp(`^${field}:\\s*([0-9a-f]+)$`, 'mi'))?.[1];
    assert.ok(value && BigInt('0x' + value) === 0n, 'Capabilities must be dropped');
  }
  assert.match(status, /^NoNewPrivs:\s*1$/m, 'Privilege escalation must be disabled');
}

function assertSameNamespace(actual, expected) {
  const valid = value => typeof value === 'string' && /^net:\[[0-9]+\]$/.test(value);
  assert.ok(valid(actual) && valid(expected) && actual === expected, 'Network namespace mismatch');
}

function verifyNamespace() {
  assertSameNamespace(fs.readlinkSync('/proc/self/ns/net'), process.env.FORMATTER_EXPECTED_NET_NAMESPACE);
}

async function assertBlockedConnection(connect = net.connect, timeoutMs = 2000) {
  assert.ok(Number.isInteger(timeoutMs) && timeoutMs > 0 && timeoutMs <= 2000, 'Invalid probe deadline');
  // Numeric TEST-NET-2 address: no DNS lookup or production service is involved.
  await new Promise((resolve, reject) => {
    let socket, settled = false;
    const timer = setTimeout(() => finish(new Error('Timeout is not proof of isolation')), timeoutMs);
    function finish(error) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket?.destroy();
      if (error) reject(error); else resolve();
    }
    try {
      socket = connect({ host: '198.51.100.1', port: 443 });
      socket.once('connect', () => finish(new Error('External connection succeeded')));
      socket.once('timeout', () => finish(new Error('Timeout is not proof of isolation')));
      socket.once('close', () => finish(new Error('Probe closed without isolation evidence')));
      socket.once('error', error => {
        if (['ENETUNREACH', 'EHOSTUNREACH'].includes(error.code)) finish();
        else finish(new Error('Isolation not established'));
      });
    } catch {
      finish(new Error('Probe setup failed'));
    }
  });
}

async function verifyNetwork() {
  if (process.env.FORMATTER_REQUIRE_NET_ISOLATION === '1') verifyNamespace();
  assertMetadata({ platform: process.platform, interfaces: os.networkInterfaces(),
    routes: fs.readFileSync('/proc/net/route', 'utf8'),
    status: fs.readFileSync('/proc/self/status', 'utf8'), uid: process.getuid() });
  await assertBlockedConnection();
  console.log('PASS Linux isolation checks: loopback only, no capabilities, external route unavailable');
}
// NODE_OPTIONS preloads this guard in the coordinator and every regression Node process.
if (process.env.FORMATTER_REQUIRE_NET_ISOLATION === '1') {
  try { verifyNamespace(); }
  catch {
    console.error('FAIL isolation stage=node-network-namespace');
    process.exit(1);
  }
}
module.exports = { assertMetadata, assertBlockedConnection, assertSameNamespace, verifyNetwork };
