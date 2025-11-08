const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for in-memory storage (no disk writes needed)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

class CameraController {
  /**
   * Receive camera frame from phone
   * POST /api/camera/frame
   * Body: multipart/form-data with 'image' field
   */
  async receiveFrame(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const imageBuffer = req.file.buffer;
      const imageBase64 = imageBuffer.toString('base64');
      const imageDataUrl = `data:${req.file.mimetype};base64,${imageBase64}`;

      // Store frame info (you can process this with CNN here)
      const frameData = {
        timestamp: new Date().toISOString(),
        size: imageBuffer.length,
        mimetype: req.file.mimetype,
        width: req.body.width || null,
        height: req.body.height || null
      };

      // TODO: Process frame with CNN here
      // For now, we'll return the frame data
      // In production, you'd call your CNN model here

      res.json({
        success: true,
        message: 'Frame received',
        frame: frameData,
        // Include base64 for preview (optional, can be removed for production)
        imageDataUrl: imageDataUrl
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Process frame with CNN and trigger pollination if flower detected
   * POST /api/camera/process
   * Body: multipart/form-data with 'image' field
   */
  async processFrame(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const imageBuffer = req.file.buffer;

      // TODO: Run CNN inference here
      // This is where you'd call your CNN model to detect flowers
      // For now, we'll simulate detection
      const mockDetection = {
        flowerDetected: false, // Set to true when CNN detects flower
        confidence: 0.0,
        position: { x: 0, y: 0, z: 0 },
        boundingBox: null
      };

      // Simulate CNN processing (replace with actual CNN call)
      // Example: const detection = await cnnModel.detect(imageBuffer);

      // If flower detected, trigger pollination
      if (mockDetection.flowerDetected) {
        // Import pollination controller
        const pollinationController = require('./pollinationController');
        
        // Create a mock response object for handleDetection
        let pollinateResult = null;
        const mockRes = {
          json: (data) => {
            pollinateResult = data;
          },
          status: (code) => ({
            json: (data) => {
              pollinateResult = { ...data, statusCode: code };
            }
          })
        };

        // Call detection handler
        await pollinationController.handleDetection({
          body: {
            flowerDetected: true,
            position: mockDetection.position,
            distance: mockDetection.position.z,
            confidence: mockDetection.confidence
          }
        }, mockRes);

        return res.json({
          success: true,
          message: 'Frame processed - Flower detected!',
          detection: mockDetection,
          pollination: pollinateResult,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'Frame processed',
        detection: mockDetection,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get camera feed status
   * GET /api/camera/status
   */
  async getStatus(req, res) {
    res.json({
      active: true,
      message: 'Camera feed endpoint ready',
      endpoints: {
        receiveFrame: 'POST /api/camera/frame',
        processFrame: 'POST /api/camera/process'
      }
    });
  }
}

// Export both the controller and multer middleware
module.exports = {
  controller: new CameraController(),
  upload: upload.single('image')
};

