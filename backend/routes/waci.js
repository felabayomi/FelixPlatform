const express = require('express');
const router = express.Router();
const {
    subscribeNewsletter,
    submitVolunteerForm,
    submitPartnerForm,
    submitDonorForm,
    getPrograms,
    createProgram,
    updateProgram,
    deleteProgram,
    getStories,
    getStory,
    createStory,
    updateStory,
    deleteStory,
    getPartners,
    getDonors,
    getResources,
    createResource,
    updateResource,
    deleteResource,
    submitStory,
    handleWaciHubWebhook,
    getStoryAttribution,
    trackStoryViewComplete,
    trackStoryLike,
    trackStoryShare,
    recalculateAuthorRewardsNow,
    requestStoryPayout,
    getPayoutRequests,
    updatePayoutRequestStatus,
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
router.post('/story-submissions', submitStory);
router.post('/submit-story', submitStory);
router.post('/stories/submit', submitStory);
router.post('/wacihub/webhook', handleWaciHubWebhook);
router.post('/payouts/request', requestStoryPayout);
router.post('/stories/:storyId/view-complete', trackStoryViewComplete);
router.post('/stories/:storyId/like', trackStoryLike);
router.post('/stories/:storyId/share', trackStoryShare);

router.get('/programs', getPrograms);
router.get('/stories', getStories);
router.get('/stories/:storyId', getStory);
router.get('/story-attribution', getStoryAttribution);
router.get('/partners', getPartners);
router.get('/donors', getDonors);
router.get('/resources', getResources);
router.get('/media', getMedia);

router.get('/admin/overview', authenticateToken, requireAdmin, getAdminOverview);
router.get('/admin/programs', authenticateToken, requireAdmin, getPrograms);
router.post('/admin/programs', authenticateToken, requireAdmin, createProgram);
router.put('/admin/programs/:id', authenticateToken, requireAdmin, updateProgram);
router.delete('/admin/programs/:id', authenticateToken, requireAdmin, deleteProgram);
router.get('/admin/stories', authenticateToken, requireAdmin, getStories);
router.post('/admin/stories', authenticateToken, requireAdmin, createStory);
router.put('/admin/stories/:id', authenticateToken, requireAdmin, updateStory);
router.delete('/admin/stories/:id', authenticateToken, requireAdmin, deleteStory);
router.get('/admin/resources', authenticateToken, requireAdmin, getResources);
router.post('/admin/resources', authenticateToken, requireAdmin, createResource);
router.put('/admin/resources/:id', authenticateToken, requireAdmin, updateResource);
router.delete('/admin/resources/:id', authenticateToken, requireAdmin, deleteResource);
router.get('/admin/story-attribution', authenticateToken, requireAdmin, getStoryAttribution);
router.post('/admin/rewards/recalculate', authenticateToken, requireAdmin, recalculateAuthorRewardsNow);
router.get('/admin/payout-requests', authenticateToken, requireAdmin, getPayoutRequests);
router.patch('/admin/payout-requests/:id', authenticateToken, requireAdmin, updatePayoutRequestStatus);
router.get('/admin/newsletter', authenticateToken, requireAdmin, getNewsletterSubscribers);
router.get('/admin/newsletter-subscribers', authenticateToken, requireAdmin, getNewsletterSubscribers);
router.get('/admin/volunteers', authenticateToken, requireAdmin, getVolunteers);
router.get('/admin/partners', authenticateToken, requireAdmin, getPartnerRequests);
router.get('/admin/partner-requests', authenticateToken, requireAdmin, getPartnerRequests);
router.get('/admin/donors', authenticateToken, requireAdmin, getDonorRequests);
router.get('/admin/media', authenticateToken, requireAdmin, getMedia);

module.exports = router;
