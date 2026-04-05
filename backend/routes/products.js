const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const upload = require('../middleware/uploadMiddleware');
const { storeProductImage } = require('../services/productImageStorage');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', productsController.getProducts);
router.post('/upload-image', authenticateToken, requireAdmin, (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            return res.status(400).send(err.message || 'Image upload failed');
        }

        if (!req.file) {
            return res.status(400).send('Image file is required');
        }

        try {
            const storedImage = await storeProductImage(req.file);
            return res.json(storedImage);
        } catch (error) {
            console.error(error);
            return res.status(500).send(error.message || 'Image upload failed');
        }
    });
});
router.post('/', authenticateToken, requireAdmin, productsController.addProduct);
router.put('/:id', authenticateToken, requireAdmin, productsController.updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, productsController.deleteProduct);

module.exports = router;
