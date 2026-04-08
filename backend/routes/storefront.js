const express = require('express');
const router = express.Router();
const storefrontController = require('../controllers/storefrontController');

router.get('/products', storefrontController.getStorefrontProducts);
router.get('/products/:slug', storefrontController.getStorefrontProductBySlug);
router.post('/create-checkout-session', storefrontController.createCheckoutSession);

module.exports = router;
