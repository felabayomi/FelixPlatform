gitr 'use strict';

const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { storeProductImage } = require('../services/productImageStorage');
const router = express.Router();
const controller = require('../controllers/cityTourHubController');

// ─── Tours (public + admin write) ────────────────────────────────────────────
router.get('/tours', controller.getTours);
router.get('/tours/:id', controller.getTour);
router.post('/tours', controller.createTour);
router.patch('/tours/:id', controller.updateTour);
router.delete('/tours/:id', controller.deleteTour);

// ─── Public forms ─────────────────────────────────────────────────────────────
router.post('/signups', controller.createSignup);
router.post('/local-picks', controller.createLocalPicksSignup);
router.post('/contact', controller.createContactMessage);
router.post('/newsletter', controller.subscribeNewsletter);
router.post('/user-signup', controller.createUserSignup);

const handleImageUpload = (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message || 'Image upload failed' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        try {
            req.storedImage = await storeProductImage(req.file);
            return controller.handleUploadedImage(req, res);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: error.message || 'Image upload failed' });
        }
    });
};

router.post('/upload-image', handleImageUpload);
router.post('/upload', handleImageUpload);

// ─── Admin data reads ─────────────────────────────────────────────────────────
router.get('/admin/stats', controller.getAdminStats);
router.get('/admin/signups', controller.getSignups);
router.get('/admin/signups/tour/:tourId', controller.getSignupsByTour);
router.get('/admin/local-picks', controller.getLocalPicksSignups);
router.get('/admin/contacts', controller.getContactMessages);
router.get('/admin/newsletter-subscribers', controller.getNewsletterSubscribers);
router.get('/admin/user-signups', controller.getUserSignups);

module.exports = router;

