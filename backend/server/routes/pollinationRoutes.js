const express = require('express');
const router = express.Router();
const pollinationController = require('../controller/pollinationController');

// Connection management
router.post('/connect', pollinationController.connect.bind(pollinationController));
router.post('/disconnect', pollinationController.disconnect.bind(pollinationController));
router.get('/status', pollinationController.getStatus.bind(pollinationController));

// Pollination actions
router.post('/pollinate', pollinationController.pollinate.bind(pollinationController));
router.post('/detect', pollinationController.handleDetection.bind(pollinationController));
router.post('/home', pollinationController.home.bind(pollinationController));
router.post('/test', pollinationController.test.bind(pollinationController));

module.exports = router;

