const express = require('express');
const router = express.Router();
const { controller: cameraController, upload } = require('../controller/cameraController');

// Camera feed endpoints
router.post('/frame', upload, cameraController.receiveFrame.bind(cameraController));
router.post('/process', upload, cameraController.processFrame.bind(cameraController));
router.get('/status', cameraController.getStatus.bind(cameraController));

module.exports = router;

