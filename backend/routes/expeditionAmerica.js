const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { storeProductImage } = require('../services/productImageStorage');
const controller = require('../controllers/expeditionAmericaController');

const router = express.Router();

router.post('/admin/auth', controller.authenticateAdmin);
router.post('/admin/verify', controller.verifyAdmin);
router.post('/admin/move-to-today', controller.requireExpeditionAdmin, controller.moveArticlesToToday);
router.post('/admin/publish-drafts-today', controller.requireExpeditionAdmin, controller.publishDraftsToday);

router.post('/articles/generate-excerpt', controller.requireExpeditionAdmin, controller.generateExcerpt);
router.post('/articles/generate', controller.requireExpeditionAdmin, controller.generateArticle);
router.post('/articles/generate-daily', controller.requireExpeditionAdmin, controller.generateDaily);

router.get('/articles', controller.getPublishedArticles);
router.get('/articles/drafts', controller.requireExpeditionAdmin, controller.getDraftArticles);
router.get('/articles/all', controller.requireExpeditionAdmin, controller.getAllArticles);
router.get('/articles/today', controller.getTodayArticles);
router.get('/articles/states', controller.getStateStatus);
router.get('/articles/state/:code', controller.getStateArticles);
router.get('/articles/:id', controller.getArticle);
router.post('/articles', controller.requireExpeditionAdmin, controller.createArticle);
router.patch('/articles/:id', controller.requireExpeditionAdmin, controller.updateArticle);
router.patch('/articles/:id/status', controller.requireExpeditionAdmin, controller.updateArticleStatus);
router.delete('/articles/:id', controller.requireExpeditionAdmin, controller.deleteArticle);

router.post('/upload', controller.requireExpeditionAdmin, (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message || 'Image upload failed' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        try {
            req.storedImage = await storeProductImage(req.file);
            return controller.handleUploadedImage(req, res);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: error.message || 'Image upload failed' });
        }
    });
});

router.post('/tts/:id', controller.requireExpeditionAdmin, controller.generateTts);
router.get('/tts/:id/timestamps', controller.requireExpeditionAdmin, controller.getTimestamps);

module.exports = router;