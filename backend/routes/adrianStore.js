const express = require('express');
const router = express.Router();
const adrianStoreController = require('../controllers/adrianStoreController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/api/storefront/content', adrianStoreController.getPublicStoreContent);
router.get('/api/admin/adrian-store/content', authenticateToken, requireAdmin, adrianStoreController.getAdminStoreContent);
router.put('/api/admin/adrian-store/content', authenticateToken, requireAdmin, adrianStoreController.updateStoreContent);

module.exports = router;
