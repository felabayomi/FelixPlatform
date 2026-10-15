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

async function assertBlockedConnection(connect = net.connect) {
  // TEST-NET-2: no real external service or production endpoint is contacted.
  await new Promise((resolve, reject) => {
    const socket = connect({ host: '198.51.100.1', port: 443 });
    socket.setTimeout(2000);
    socket.once('connect', () => { socket.destroy(); reject(new Error('External connection succeeded')); });
    socket.once('timeout', () => { socket.destroy(); reject(new Error('Timeout is not proof of isolation')); });
    socket.once('error', error => {
      socket.destroy();
      if (['ENETUNREACH', 'EHOSTUNREACH'].includes(error.code)) resolve();
      else reject(new Error('Isolation not established'));
    });
  });
}

async function verifyNetwork() {
  assertMetadata({ platform: process.platform, interfaces: os.networkInterfaces(),
    routes: fs.readFileSync('/proc/net/route', 'utf8'),
    status: fs.readFileSync('/proc/self/status', 'utf8'), uid: process.getuid() });
  await assertBlockedConnection();
  console.log('PASS Linux isolation checks: loopback only, no capabilities, external route unavailable');
}
module.exports = { assertMetadata, assertBlockedConnection, verifyNetwork };
