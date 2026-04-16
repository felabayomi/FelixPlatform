const express = require('express');
const router = express.Router();
const { listGrantees, createGrantee, revokeGrantee } = require('../controllers/waciGranteeController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, requireAdmin, listGrantees);
router.post('/', authenticateToken, requireAdmin, createGrantee);
router.delete('/:id', authenticateToken, requireAdmin, revokeGrantee);

module.exports = router;
