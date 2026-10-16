const Module = require('node:module');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '../..');
const bcrypt = require(path.join(root, 'admin-dashboard/node_modules/bcrypt'));
const password = bcrypt.hashSync('synthetic-password-only', 4);
const queries = [];
let emails = 0;
const load = Module._load;
Module._load = function(request, parent, ...rest) {
  if (request === 'openai') return class SyntheticOpenAI {};
  if (request === 'pg') throw new Error('Real database driver disabled');
  const file = Module._resolveFilename(request, parent);
  if (file === path.join(root, 'backend/db.js')) return { async query(sql) {
    queries.push(sql);
    if (/FROM users/i.test(sql)) return { rows: [{ id: 'synthetic-user', name: 'Synthetic', email: 'synthetic@example.invalid', role: 'admin', password }] };
    if (/SELECT EXISTS/i.test(sql)) return { rows: [{ has_access: false }] };
    return { rows: [] };
  } };
  if (file === path.join(root, 'backend/services/resendEmail.js')) return {
    sendEmail: async () => { emails++; },
    sendDocumentFormatterAccessRequestNotification: async () => { emails++; return { admin: { sent: true }, customer: { sent: true } }; },
  };
  return load.call(this, request, parent, ...rest);
};
global.fetch = () => Promise.reject(new Error('Outbound fetch disabled'));
const listen = http.Server.prototype.listen;
http.Server.prototype.listen = function(...args) {
  this.once('listening', () => console.log('VALIDATION_READY ' + JSON.stringify({ port: this.address().port })));
  return listen.apply(this, args);
};
process.on('message', message => {
  if (message === 'snapshot') process.send({
    formatterLoaded: !!require.cache[path.join(root, 'backend/routes/formatterIntegration.js')],
    multerVersion: Module.createRequire(path.join(root, 'backend/routes/documentFormatter.js'))('multer/package.json').version,
    ddl: queries.some(sql => /\b(CREATE|ALTER|DROP)\b/i.test(sql)),
    accountWrites: queries.some(sql => /\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+(users|subscriptions)\b/i.test(sql)), emails,
  });
});
