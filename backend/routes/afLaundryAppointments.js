const express = require('express');
const router = express.Router();
const afLaundryAppointmentsController = require('../controllers/afLaundryAppointmentsController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, requireAdmin, afLaundryAppointmentsController.getAppointments);
router.post('/', authenticateToken, requireAdmin, afLaundryAppointmentsController.createAppointment);
router.patch('/:id', authenticateToken, requireAdmin, afLaundryAppointmentsController.updateAppointment);

module.exports = router;
