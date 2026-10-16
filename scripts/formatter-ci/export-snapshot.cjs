const fs = require('node:fs');
const path = require('node:path');

// Copy source only. Never export .git, .env files, records, uploads or credentials.
function exportSnapshot(source, destination) {
  source = fs.realpathSync(source);
  destination = path.resolve(destination);
  if (destination === source || destination.startsWith(source + path.sep)) {
    throw new Error('Snapshot must be outside the checkout');
  }
  if (fs.existsSync(destination)) throw new Error('Snapshot destination must be new');
  const files = [];
  function add(relative) {
    const input = path.join(source, relative);
    if (fs.lstatSync(input).isSymbolicLink()) throw new Error('Symlink source rejected');
    const output = path.join(destination, relative);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.copyFileSync(input, output);
    files.push(relative);
  }
  function walk(relative) {
    for (const entry of fs.readdirSync(path.join(source, relative), { withFileTypes: true })) {
      if (entry.name.startsWith('.') || ['node_modules', 'uploads', 'data', 'backups'].includes(entry.name)) continue;
      const child = path.join(relative, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Symlink source rejected');
      if (entry.isDirectory()) walk(child);
      else if (/\.(?:js|cjs|sh)$/.test(entry.name)) add(child);
    }
  }
  for (const file of ['admin-dashboard/server.js', 'admin-dashboard/package.json', 'admin-dashboard/package-lock.json',
    'backend/db.js', 'backend/documentFormatterServer.js']) add(file);
  for (const directory of ['admin-dashboard/tests', 'backend/controllers', 'backend/middleware',
    'backend/routes', 'backend/services', 'backend/tests', 'scripts/formatter-ci']) walk(directory);
  return files;
}

if (require.main === module) {
  try { console.log(`Exported ${exportSnapshot(process.argv[2], process.argv[3]).length} source files`); }
  catch { console.error('Source export failed; details suppressed'); process.exitCode = 1; }
}
module.exports = { exportSnapshot };
