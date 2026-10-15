const path = require('node:path');
const fs = require('node:fs');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const { verifyNetwork } = require('./verify-network.cjs');

async function runValidation() {
  if (process.versions.node.split('.')[0] !== '22') throw new Error('Node 22 is required');
  const isolated = process.env.FORMATTER_REQUIRE_NET_ISOLATION === '1';
  if (process.env.CI === 'true' && !isolated) throw new Error('CI requires verified Linux isolation');
  if (isolated) await verifyNetwork();
  else console.log('NOT VERIFIED: Linux network isolation (local harness mode)');
  await require('./startup-smoke.cjs').startupSmoke();
  const suites = [
    ...fs.readdirSync(path.join(root, 'admin-dashboard/tests')).filter(f => f.endsWith('.test.cjs')).map(f => path.join(root, 'admin-dashboard/tests', f)),
    ...fs.readdirSync(path.join(root, 'backend/tests')).filter(f => f.endsWith('.test.cjs')).map(f => path.join(root, 'backend/tests', f)),
    path.join(__dirname, 'strategy.test.cjs'),
  ];
  // Sequential test processes keep memory bounded, including on a local machine.
  for (const suite of suites) {
    const result = cp.spawnSync(process.execPath, ['--test', suite], {
      cwd: path.join(root, 'admin-dashboard'), stdio: 'inherit',
      env: { ...process.env, NODE_PATH: path.join(root, 'admin-dashboard/node_modules') },
      timeout: 120000,
    });
    if (result.status !== 0) throw new Error('Regression suite failed');
  }
  if (isolated) await verifyNetwork();
}
if (require.main === module) runValidation().catch(() => {
  console.error('Validation failed; no production services are used'); process.exitCode = 1;
});
module.exports = { runValidation };
