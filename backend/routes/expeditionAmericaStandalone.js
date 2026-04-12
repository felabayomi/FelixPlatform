'use strict';

const express = require('express');
const controller = require('../controllers/expeditionAmericaStandaloneController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/content', controller.getPublicContent);
router.get('/admin/content', authenticateToken, requireAdmin, controller.getAdminContent);
router.post('/admin/content', authenticateToken, requireAdmin, controller.createSection);
router.patch('/admin/content/:id', authenticateToken, requireAdmin, controller.updateSection);
router.delete('/admin/content/:id', authenticateToken, requireAdmin, controller.deleteSection);

module.exports = router;
