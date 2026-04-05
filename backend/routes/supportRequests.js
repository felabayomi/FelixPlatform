const express = require('express');
const router = express.Router();
const supportRequestsController = require('../controllers/supportRequestsController');

router.post('/', supportRequestsController.submitSupportRequest);

module.exports = router;
