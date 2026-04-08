const express = require('express');
const router = express.Router();
const platformContentController = require('../controllers/platformContentController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/api/platform-content/felix-homepage', platformContentController.getPublicHomepageContent);
router.get('/api/admin/platform-content/felix-homepage', authenticateToken, requireAdmin, platformContentController.getAdminHomepageContent);
router.put('/api/admin/platform-content/felix-homepage', authenticateToken, requireAdmin, platformContentController.updateHomepageContent);

module.exports = router;
