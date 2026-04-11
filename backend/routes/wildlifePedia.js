const express = require('express');
const router = express.Router();
const {
    getSiteContent,
    updateSiteContent,
    getSpecies,
    getSpeciesBySlug,
    getHabitats,
    getProjects,
    getPosts,
    subscribeNewsletter,
    submitVolunteer,
    submitDonor,
    submitSightingReport,
    getAdminOverview,
    getSightings,
    updateSightingStatus,
    getNewsletterSubscribers,
    getVolunteers,
    getDonors,
    createSpecies,
    updateSpecies,
    deleteSpecies,
    createHabitat,
    updateHabitat,
    deleteHabitat,
    createProject,
    updateProject,
    deleteProject,
} = require('../controllers/wildlifePediaController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/site-content', getSiteContent);
router.get('/species', getSpecies);
router.get('/species/:slug', getSpeciesBySlug);
router.get('/habitats', getHabitats);
router.get('/projects', getProjects);
router.get('/blog', getPosts);
router.post('/newsletter', subscribeNewsletter);
router.post('/volunteer', submitVolunteer);
router.post('/donor', submitDonor);
router.post('/sightings/report', submitSightingReport);

router.get('/admin/overview', authenticateToken, requireAdmin, getAdminOverview);
router.put('/admin/site-content', authenticateToken, requireAdmin, updateSiteContent);
router.get('/admin/species', authenticateToken, requireAdmin, getSpecies);
router.post('/admin/species', authenticateToken, requireAdmin, createSpecies);
router.put('/admin/species/:id', authenticateToken, requireAdmin, updateSpecies);
router.delete('/admin/species/:id', authenticateToken, requireAdmin, deleteSpecies);
router.get('/admin/habitats', authenticateToken, requireAdmin, getHabitats);
router.post('/admin/habitats', authenticateToken, requireAdmin, createHabitat);
router.put('/admin/habitats/:id', authenticateToken, requireAdmin, updateHabitat);
router.delete('/admin/habitats/:id', authenticateToken, requireAdmin, deleteHabitat);
router.get('/admin/projects', authenticateToken, requireAdmin, getProjects);
router.post('/admin/projects', authenticateToken, requireAdmin, createProject);
router.put('/admin/projects/:id', authenticateToken, requireAdmin, updateProject);
router.delete('/admin/projects/:id', authenticateToken, requireAdmin, deleteProject);
router.get('/admin/sightings', authenticateToken, requireAdmin, getSightings);
router.patch('/admin/sightings/:id', authenticateToken, requireAdmin, updateSightingStatus);
router.get('/admin/newsletter', authenticateToken, requireAdmin, getNewsletterSubscribers);
router.get('/admin/volunteers', authenticateToken, requireAdmin, getVolunteers);
router.get('/admin/donors', authenticateToken, requireAdmin, getDonors);

module.exports = router;
