const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, requireAdmin, ordersController.getOrders);
router.post('/', ordersController.addOrder);
router.patch('/:id/status', authenticateToken, requireAdmin, ordersController.updateOrderStatus);

module.exports = router;
