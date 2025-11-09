const multer = require('multer');
const path = require('path');
const fs = require('fs');
const flowerClassifier = require('../services/flowerClassifierService');

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
   * Automatically classifies the image for flowers
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

      // Store frame info
      const frameData = {
        timestamp: new Date().toISOString(),
        size: imageBuffer.length,
        mimetype: req.file.mimetype,
        width: req.body.width || null,
        height: req.body.height || null,
        droneId: req.body.droneId || null
      };

      // Classify the image using the flower classifier
      let classification = null;
      let classificationError = null;
      
      try {
        // Check if classifier is available
        const isAvailable = await flowerClassifier.isAvailable();
        
        if (isAvailable) {
          classification = await flowerClassifier.classifyBuffer(imageBuffer);
        } else {
          classificationError = 'Flower classifier service not available. Model may not be trained yet.';
        }
      } catch (classifyError) {
        // Log error but don't fail the request
        classificationError = classifyError.message;
        console.error('Flower classification error:', classifyError);
      }

      res.json({
        success: true,
        message: 'Frame received',
        frame: frameData,
        classification: classification || null,
        classificationError: classificationError || null,
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
   * Process frame with flower classifier and trigger pollination if flower detected
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

      // Check if classifier is available
      const isAvailable = await flowerClassifier.isAvailable();
      
      if (!isAvailable) {
        return res.status(503).json({
          success: false,
          message: 'Flower classifier service not available. Please ensure the model is trained and available.',
          detection: {
            flowerDetected: false,
            confidence: 0.0,
            error: 'Classifier service unavailable'
          }
        });
      }

      // Run flower classification
      let classification;
      try {
        classification = await flowerClassifier.classifyBuffer(imageBuffer);
      } catch (classifyError) {
        return res.status(500).json({
          success: false,
          message: `Classification error: ${classifyError.message}`,
          detection: {
            flowerDetected: false,
            confidence: 0.0,
            error: classifyError.message
          }
        });
      }

      // Prepare detection result
      const detection = {
        flowerDetected: classification.isFlower,
        confidence: classification.confidence,
        class: classification.class,
        score: classification.score,
        position: { 
          x: req.body.x || 0, 
          y: req.body.y || 0, 
          z: req.body.z || req.body.distance || 0 
        },
        boundingBox: null // Could be added if object detection is implemented
      };

      // If flower detected, trigger pollination
      if (detection.flowerDetected) {
        try {
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
              position: detection.position,
              distance: detection.position.z,
              confidence: detection.confidence
            }
          }, mockRes);

          return res.json({
            success: true,
            message: 'Frame processed - Flower detected!',
            detection: detection,
            classification: classification,
            pollination: pollinateResult,
            timestamp: new Date().toISOString()
          });
        } catch (pollinationError) {
          // Log pollination error but still return detection result
          console.error('Pollination error:', pollinationError);
          return res.json({
            success: true,
            message: 'Frame processed - Flower detected, but pollination failed',
            detection: detection,
            classification: classification,
            pollinationError: pollinationError.message,
            timestamp: new Date().toISOString()
          });
        }
      }

      // No flower detected
      res.json({
        success: true,
        message: 'Frame processed - No flower detected',
        detection: detection,
        classification: classification,
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
    const classifierAvailable = await flowerClassifier.isAvailable();
    
    res.json({
      active: true,
      message: 'Camera feed endpoint ready',
      classifierAvailable: classifierAvailable,
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

