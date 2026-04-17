const express = require('express');
const router = express.Router();
const {
    getProjects,
    getProject,
    getProjectGrant,
    getProjectReports,
    createProject,
    updateProject,
    deleteProject,
    getAssignments,
    assignVolunteer,
    removeAssignment,
    generateProject,
} = require('../controllers/waciProjectController');
const { generateGrantOfferFromProject } = require('../controllers/waciGrantController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Public
router.get('/', getProjects);
router.get('/:id/grant', authenticateToken, requireAdmin, getProjectGrant);
router.get('/:id/reports', authenticateToken, requireAdmin, getProjectReports);
router.get('/:slug', getProject);

// Admin only
router.post('/generate', authenticateToken, generateProject);
router.post('/', authenticateToken, requireAdmin, createProject);
router.post('/:projectId/generate-grant', authenticateToken, requireAdmin, generateGrantOfferFromProject);
router.put('/:id', authenticateToken, requireAdmin, updateProject);
router.delete('/:id', authenticateToken, requireAdmin, deleteProject);

// Assignments (admin only)
router.get('/:projectId/assignments', authenticateToken, requireAdmin, getAssignments);
router.post('/:projectId/assignments', authenticateToken, requireAdmin, assignVolunteer);
router.delete('/:projectId/assignments/:userId', authenticateToken, requireAdmin, removeAssignment);

module.exports = router;
