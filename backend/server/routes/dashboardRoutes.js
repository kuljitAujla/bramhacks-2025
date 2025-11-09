const express = require('express');
const router = express.Router();
const dashboardController = require('../controller/dashboardController');

// Dashboard endpoints
router.get('/overview', dashboardController.getOverview.bind(dashboardController));
router.get('/drones', dashboardController.getDrones.bind(dashboardController));
router.get('/missions', dashboardController.getMissions.bind(dashboardController));
router.get('/analytics', dashboardController.getAnalytics.bind(dashboardController));
router.get('/alerts', dashboardController.getAlerts.bind(dashboardController));
router.get('/live-missions', dashboardController.getLiveMissions.bind(dashboardController));
router.get('/mission/:id/updates', dashboardController.getMissionUpdates.bind(dashboardController));

module.exports = router;

