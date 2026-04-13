const express = require('express');
const router = express.Router();
const {
    submitReport,
    getReports,
    getMyReports,
    getMyScheduledReports,
    getScheduledReport,
    submitScheduledReport,
    getReport,
    reviewReport,
    approveReport,
    addAttachment,
    getPayments,
    getMyPayments,
    createPayment,
    updatePaymentStatus,
} = require('../controllers/waciReportController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Volunteer (authenticated)
router.post('/', authenticateToken, submitReport);
router.get('/schedule/mine', authenticateToken, getMyScheduledReports);
router.get('/schedule/:id', authenticateToken, getScheduledReport);
router.post('/:id/submit', authenticateToken, submitScheduledReport);
router.get('/mine', authenticateToken, getMyReports);
router.get('/payments/mine', authenticateToken, getMyPayments);

// Admin only
router.get('/', authenticateToken, requireAdmin, getReports);
router.put('/:id/review', authenticateToken, requireAdmin, reviewReport);
router.post('/:id/approve', authenticateToken, requireAdmin, approveReport);

// Payments (admin only)
router.get('/payments', authenticateToken, requireAdmin, getPayments);
router.post('/payments', authenticateToken, requireAdmin, createPayment);
router.put('/payments/:id/status', authenticateToken, requireAdmin, updatePaymentStatus);

// Generic authenticated report endpoints (keep after specific routes)
router.get('/:id', authenticateToken, getReport);
router.post('/:id/attachments', authenticateToken, addAttachment);

module.exports = router;
