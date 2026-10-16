const express = require('express');
const cors = require('cors');
const auth = require('../controllers/authController');
const { createAuthenticateToken } = require('../middleware/authMiddleware');
const { createDocumentFormatterRoutes } = require('./documentFormatter');
const { withExistingSchema } = require('../services/schemaPolicy');

const issuer = 'felixplatform:document-formatter';
const audience = 'document-formatter';
const getSecret = () => {
    const key = process.env.DOCUMENT_FORMATTER_JWT_SECRET;
    if (!key || key.trim() !== key || Buffer.byteLength(key, 'utf8') < 32
        || key === process.env.SECRET_KEY) {
        throw new Error('Formatter signing key unavailable');
    }
    return key;
};

function createFormatterIntegration() {
    const router = express.Router();
    // This policy is deliberately independent of all legacy origin policies.
    router.use(cors({ origin: ['https://formatter.felixplatforms.com'] }));
    router.use((_req, res, next) => {
        try { getSecret(); next(); }
        catch { res.status(503).json({ error: 'formatter_unavailable' }); }
    });
    router.use(express.json({ limit: '1mb' }));
    router.use(withExistingSchema);
    router.use((req, _res, next) => { req.formatterAdminOnly = true; next(); });
    const authenticate = createAuthenticateToken({
        getSecret, verifyOptions: { algorithms: ['HS256'], issuer, audience },
    });
    router.post('/auth/login', auth.createLogin({
        getSecret, signOptions: { algorithm: 'HS256', issuer, audience },
    }));
    router.get('/auth/me', authenticate, auth.getCurrentUser);
    router.use('/api', createDocumentFormatterRoutes(authenticate));
    router.use((error, _req, res, _next) => {
        const status = error.type === 'entity.too.large' ? 413
            : error.type === 'entity.parse.failed' ? 400 : 500;
        res.status(status).json({ error: status === 500 ? 'internal_error' : 'invalid_request' });
    });
    // Do not fall through into the shared CORS policy or unrelated handlers.
    router.use((_req, res) => res.status(404).json({ error: 'not_found' }));
    return router;
}

module.exports = { createFormatterIntegration };
