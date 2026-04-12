'use strict';

const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { storeProductImage } = require('../services/productImageStorage');
const controller = require('../controllers/expeditionAmericaStandaloneController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/contract', controller.getMapperContract);
router.get('/content', controller.getPublicContent);
router.get('/content/export', controller.getContentExport);
router.get('/admin/content', authenticateToken, requireAdmin, controller.getAdminContent);
router.post('/admin/content/sync-starter', authenticateToken, requireAdmin, controller.syncStarterSections);

router.post('/admin/upload-image', authenticateToken, requireAdmin, (req, res) => {
	upload.single('image')(req, res, async (err) => {
		if (err) {
			return res.status(400).json({ error: err.message || 'Image upload failed' });
		}

		if (!req.file) {
			return res.status(400).json({ error: 'No image file provided' });
		}

		try {
			const stored = await storeProductImage(req.file);
			return res.json({
				url: stored?.imageUrl || null,
				storage: stored?.storage || 'local',
			});
		} catch (error) {
			console.error(error);
			return res.status(500).json({ error: error.message || 'Image upload failed' });
		}
	});
});

router.post('/admin/content', authenticateToken, requireAdmin, controller.createSection);
router.patch('/admin/content/:id', authenticateToken, requireAdmin, controller.updateSection);
router.delete('/admin/content/:id', authenticateToken, requireAdmin, controller.deleteSection);

module.exports = router;
