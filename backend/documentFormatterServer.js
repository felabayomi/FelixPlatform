require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const authController = require('./controllers/authController');
const { authenticateToken } = require('./middleware/authMiddleware');
const formatterRoutes = require('./routes/documentFormatter');
const { withExistingSchema } = require('./services/schemaPolicy');

function createDocumentFormatterApp() {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
    const key = process.env.SECRET_KEY;
    if (!key || key.trim() !== key || Buffer.byteLength(key, 'utf8') < 32) {
        throw new Error('A dedicated random SECRET_KEY of at least 32 bytes is required.');
    }
    const origins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!origins.length || origins.some(origin => {
        try {
            const url = new URL(origin);
            return !['http:', 'https:'].includes(url.protocol) || url.origin !== origin || url.hostname.includes('*');
        } catch { return true; }
    })) throw new Error('ALLOWED_ORIGINS must contain exact HTTP(S) origins.');

    const app = express();
    app.disable('x-powered-by');
    app.use(cors({ origin: [...new Set(origins)] }));
    app.use(express.json({ limit: '1mb' }));
    app.use(withExistingSchema);
    // No verified product mapping exists yet. Never use cross-product subscriptions.
    app.use((req, _res, next) => { req.formatterAdminOnly = true; next(); });
    app.post('/auth/login', authController.login);
    app.get('/auth/me', authenticateToken, authController.getCurrentUser);
    app.use('/api', formatterRoutes);
    app.use((error, _req, res, _next) => {
        const status = error.type === 'entity.too.large' ? 413
            : error.type === 'entity.parse.failed' ? 400 : 500;
        res.status(status).json({ error: status === 500 ? 'internal_error' : 'invalid_request' });
    });
    return app;
}

if (require.main === module) {
    try {
        createDocumentFormatterApp().listen(process.env.PORT || 5000, '0.0.0.0', () => {
            console.log('Document Formatter backend listening');
        });
    } catch {
        console.error('Document Formatter configuration invalid; server not started.');
        process.exitCode = 1;
    }
}

module.exports = { createDocumentFormatterApp };
