const express = require('express');
const multer = require('multer');
const { authenticateToken, requireAdmin, requireDocumentFormatterAccess } = require('../middleware/authMiddleware');
const documentFormatterController = require('../controllers/documentFormatterController');

function createDocumentFormatterRoutes(authenticate = authenticateToken) {
const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        const extension = file.originalname.split('.').pop()?.toLowerCase();

        if (['docx', 'txt'].includes(extension || '')) {
            callback(null, true);
            return;
        }

        callback(new Error('Please upload a .docx or .txt file. For PDFs, extraction happens in your browser.'));
    },
});

router.get('/health', documentFormatterController.healthCheck);
router.get('/admin/overview', authenticate, requireAdmin, documentFormatterController.getAdminOverview);
router.post('/request-access', documentFormatterController.requestAccess);
router.post('/format/txt', authenticate, requireDocumentFormatterAccess, documentFormatterController.formatTxt);
router.post('/format/docx', authenticate, requireDocumentFormatterAccess, documentFormatterController.formatDocx);
router.post('/format/pdf', authenticate, requireDocumentFormatterAccess, documentFormatterController.formatPdf);
router.post('/format/extract', authenticate, requireDocumentFormatterAccess, (req, res) => {
    upload.single('file')(req, res, (error) => {
        if (error) {
            res.status(400).json({ error: 'upload_failed', message: error.message || 'File upload failed.' });
            return;
        }

        documentFormatterController.extractUploadedText(req, res);
    });
});

return router;
}

module.exports = createDocumentFormatterRoutes();
module.exports.createDocumentFormatterRoutes = createDocumentFormatterRoutes;
