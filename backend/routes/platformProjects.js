const express = require('express');
const router = express.Router();
const {
    listProjects,
    listLaunchedProjects,
    createProject,
    updateProject,
} = require('../controllers/platformProjectsController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/launched', authenticateToken, requireAdmin, listLaunchedProjects);
router.get('/', authenticateToken, requireAdmin, listProjects);
router.post('/', authenticateToken, requireAdmin, createProject);
router.patch('/:id', authenticateToken, requireAdmin, updateProject);

module.exports = router;
