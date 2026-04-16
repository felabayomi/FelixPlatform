const express = require('express');
const router = express.Router();
const { submitApplication, listApplications, updateApplicationStatus } = require('../controllers/waciApplicationController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Public
router.post('/', submitApplication);

// Admin only
router.get('/', authenticateToken, requireAdmin, listApplications);
router.put('/:id/status', authenticateToken, requireAdmin, updateApplicationStatus);

module.exports = router;
