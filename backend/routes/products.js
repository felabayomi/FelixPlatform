const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const upload = require('../middleware/uploadMiddleware');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', productsController.getProducts);
router.post('/upload-image', authenticateToken, requireAdmin, (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).send(err.message || 'Image upload failed');
        }

        if (!req.file) {
            return res.status(400).send('Image file is required');
        }

        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`;
        res.json({ imageUrl, filename: req.file.filename });
    });
});
router.post('/', authenticateToken, requireAdmin, productsController.addProduct);
router.put('/:id', authenticateToken, requireAdmin, productsController.updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, productsController.deleteProduct);

module.exports = router;
