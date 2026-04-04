const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', categoriesController.getCategories);
router.post('/', authenticateToken, requireAdmin, categoriesController.addCategory);
router.put('/:id', authenticateToken, requireAdmin, categoriesController.updateCategory);
router.delete('/:id', authenticateToken, requireAdmin, categoriesController.deleteCategory);

module.exports = router;
