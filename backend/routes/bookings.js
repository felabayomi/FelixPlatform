const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookingsController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/track', bookingsController.lookupBookings);
router.get('/', authenticateToken, requireAdmin, bookingsController.getBookings);
router.post('/', bookingsController.addBooking);
router.patch('/:id/status', authenticateToken, requireAdmin, bookingsController.updateBookingStatus);

module.exports = router;
