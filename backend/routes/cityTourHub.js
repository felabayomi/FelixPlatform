'use strict';

const express = require('express');
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

// ─── Admin data reads ─────────────────────────────────────────────────────────
router.get('/admin/stats', controller.getAdminStats);
router.get('/admin/signups', controller.getSignups);
router.get('/admin/signups/tour/:tourId', controller.getSignupsByTour);
router.get('/admin/local-picks', controller.getLocalPicksSignups);
router.get('/admin/contacts', controller.getContactMessages);
router.get('/admin/newsletter-subscribers', controller.getNewsletterSubscribers);
router.get('/admin/user-signups', controller.getUserSignups);

module.exports = router;

