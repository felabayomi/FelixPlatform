const express = require('express');
const router = express.Router();
const {
    createGrantOffer,
    generateGrantOfferFromProject,
    sendGrantOffer,
    getMyProvisionedDashboard,
    getGrantOffers,
    getMyGrantOffers,
    getGrantOffer,
    updateGrantOfferStatus,
    acceptGrantOffer,
    getGrantAcceptance,
} = require('../controllers/waciGrantController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Admin only
router.post('/', authenticateToken, requireAdmin, createGrantOffer);
router.post('/from-project/:projectId', authenticateToken, requireAdmin, generateGrantOfferFromProject);
router.post('/:id/send', authenticateToken, requireAdmin, sendGrantOffer);
router.get('/', authenticateToken, requireAdmin, getGrantOffers);
router.put('/:id/status', authenticateToken, requireAdmin, updateGrantOfferStatus);

// Volunteer (authenticated)
router.get('/dashboard/mine', authenticateToken, getMyProvisionedDashboard);
router.get('/mine', authenticateToken, getMyGrantOffers);
router.get('/:id', authenticateToken, getGrantOffer);
router.post('/:id/accept', authenticateToken, acceptGrantOffer);
router.get('/:id/acceptance', authenticateToken, getGrantAcceptance);

module.exports = router;
