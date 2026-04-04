const express = require('express');
const router = express.Router();
const quoteRequestsController = require('../controllers/quoteRequestsController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/track', quoteRequestsController.trackQuoteRequests);
router.post('/', quoteRequestsController.addQuoteRequest);
router.get('/', authenticateToken, requireAdmin, quoteRequestsController.getQuoteRequests);
router.patch('/:id', authenticateToken, requireAdmin, quoteRequestsController.updateQuoteRequest);

module.exports = router;
