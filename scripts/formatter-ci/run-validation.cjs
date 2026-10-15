const path = require('node:path');
const fs = require('node:fs');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../..');
let stage = 'initialization';

async function runValidation() {
  console.log('INFO validation Node process entered');
  stage = 'node22';
  if (process.versions.node.split('.')[0] !== '22') throw new Error('Node 22 is required');
  stage = 'isolation-required';
  const isolated = process.env.FORMATTER_REQUIRE_NET_ISOLATION === '1';
  if (process.env.CI === 'true' && !isolated) throw new Error('CI requires verified Linux isolation');
  stage = 'load-network-verifier';
  const { verifyNetwork } = require('./verify-network.cjs');
  stage = 'network-before-tests';
  if (isolated) await verifyNetwork();
  else console.log('NOT VERIFIED: Linux network isolation (local harness mode)');
  stage = 'source-and-home-permissions';
  for (const directory of ['.', 'admin-dashboard', 'admin-dashboard/node_modules',
    'admin-dashboard/tests', 'backend', 'backend/tests', 'scripts/formatter-ci']) {
    stage = `directory-access-${directory}`;
    fs.accessSync(path.join(root, directory), fs.constants.R_OK | fs.constants.X_OK);
  }
  for (const file of ['admin-dashboard/server.js', 'scripts/formatter-ci/startup-preload.cjs',
    'scripts/formatter-ci/startup-smoke.cjs']) {
    stage = `file-access-${file}`;
    fs.accessSync(path.join(root, file), fs.constants.R_OK);
  }
  stage = 'node-executable-access';
  fs.accessSync(process.execPath, fs.constants.X_OK);
  stage = 'temporary-home-access';
  fs.accessSync(process.env.HOME, fs.constants.R_OK | fs.constants.W_OK | fs.constants.X_OK);
  console.log('PASS validation source, dependencies and temporary home access');
  stage = 'startup-configurations';
  await require('./startup-smoke.cjs').startupSmoke();
  stage = 'discover-test-suites';
  const suites = [
    ...fs.readdirSync(path.join(root, 'admin-dashboard/tests')).filter(f => f.endsWith('.test.cjs')).map(f => path.join(root, 'admin-dashboard/tests', f)),
    ...fs.readdirSync(path.join(root, 'backend/tests')).filter(f => f.endsWith('.test.cjs')).map(f => path.join(root, 'backend/tests', f)),
    path.join(__dirname, 'strategy.test.cjs'),
  ];
  // Sequential test processes keep memory bounded, including on a local machine.
  for (const suite of suites) {
    stage = `regression-${path.basename(suite)}`;
    const result = cp.spawnSync(process.execPath, ['--test', suite], {
      cwd: path.join(root, 'admin-dashboard'), stdio: 'inherit',
      env: { ...process.env, NODE_PATH: path.join(root, 'admin-dashboard/node_modules') },
      timeout: 120000,
    });
    if (result.status !== 0) throw new Error('Regression suite failed');
  }
  stage = 'network-after-tests';
  if (isolated) await verifyNetwork();
}
if (require.main === module) runValidation().catch(() => {
  console.error(`FAIL validation stage=${stage}; no production services are used`); process.exitCode = 1;
});
module.exports = { runValidation };
