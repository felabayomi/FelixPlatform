const express = require('express');
const router = express.Router();
const {
    subscribeNewsletter,
    submitVolunteerForm,
    submitPartnerForm,
    submitDonorForm,
    getPrograms,
    getStories,
    getPartners,
    getDonors,
    getResources,
    getAdminOverview,
    getNewsletterSubscribers,
    getVolunteers,
    getPartnerRequests,
    getDonorRequests,
    getMedia,
} = require('../controllers/waciController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.post('/newsletter', subscribeNewsletter);
router.post('/volunteer', submitVolunteerForm);
router.post('/partner', submitPartnerForm);
router.post('/partners', submitPartnerForm);
router.post('/donor', submitDonorForm);
router.post('/donors', submitDonorForm);

router.get('/programs', getPrograms);
router.get('/stories', getStories);
router.get('/partners', getPartners);
router.get('/donors', getDonors);
router.get('/resources', getResources);
router.get('/media', getMedia);

router.get('/admin/overview', authenticateToken, requireAdmin, getAdminOverview);
router.get('/admin/programs', authenticateToken, requireAdmin, getPrograms);
router.get('/admin/stories', authenticateToken, requireAdmin, getStories);
router.get('/admin/resources', authenticateToken, requireAdmin, getResources);
router.get('/admin/newsletter', authenticateToken, requireAdmin, getNewsletterSubscribers);
router.get('/admin/newsletter-subscribers', authenticateToken, requireAdmin, getNewsletterSubscribers);
router.get('/admin/volunteers', authenticateToken, requireAdmin, getVolunteers);
router.get('/admin/partners', authenticateToken, requireAdmin, getPartnerRequests);
router.get('/admin/partner-requests', authenticateToken, requireAdmin, getPartnerRequests);
router.get('/admin/donors', authenticateToken, requireAdmin, getDonorRequests);
router.get('/admin/media', authenticateToken, requireAdmin, getMedia);

module.exports = router;
