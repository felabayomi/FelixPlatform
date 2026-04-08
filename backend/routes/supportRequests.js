const express = require('express');
const router = express.Router();
const supportRequestsController = require('../controllers/supportRequestsController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, requireAdmin, supportRequestsController.getSupportRequests);
router.post('/', supportRequestsController.submitSupportRequest);
router.patch('/:id', authenticateToken, requireAdmin, supportRequestsController.updateSupportRequest);

module.exports = router;
