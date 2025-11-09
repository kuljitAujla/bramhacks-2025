const express = require('express');
const router = express.Router();
const { controller: cameraController, upload } = require('../controller/cameraController');

// Camera feed endpoints
router.post('/frame', upload, cameraController.receiveFrame.bind(cameraController));
router.post('/process', upload, cameraController.processFrame.bind(cameraController));
router.get('/status', cameraController.getStatus.bind(cameraController));
router.get('/debug', cameraController.debug.bind(cameraController));

// Arduino endpoints
router.post('/arduino/connect', cameraController.connectArduino.bind(cameraController));
router.post('/arduino/disconnect', cameraController.disconnectArduino.bind(cameraController));
router.get('/arduino/status', cameraController.getArduinoStatus.bind(cameraController));

module.exports = router;

