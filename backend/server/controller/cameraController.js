const multer = require('multer');
const path = require('path');
const fs = require('fs');
const flowerClassifier = require('../services/flowerClassifierService');
const arduinoService = require('../services/arduinoService');

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
  constructor() {
    // Track last pollination time to prevent rapid-fire commands
    this.lastPollinationTime = 0;
    this.pollinationCooldown = 3000; // 3 seconds between pollination attempts
  }

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
      let distance = null;
      let ultrasonicActive = false;
      
      try {
        // Check if classifier is available
        console.log('[DEBUG] Checking if classifier is available...');
        const isAvailable = await flowerClassifier.isAvailable();
        console.log('[DEBUG] Classifier available:', isAvailable);
        
        if (isAvailable) {
          console.log('[DEBUG] Classifying image buffer, size:', imageBuffer.length, 'bytes');
          try {
            classification = await flowerClassifier.classifyBuffer(imageBuffer);
            console.log('[DEBUG] Classification result:', JSON.stringify(classification, null, 2));
          } catch (classifyErr) {
            console.error('[DEBUG] Classification error details:', {
              message: classifyErr.message,
              stack: classifyErr.stack
            });
            throw classifyErr;
          }
          
          // If flower is detected, calculate distance (simulated based on image size and confidence)
          // In a real system, this would come from an ultrasonic sensor
          if (classification && classification.isFlower) {
            console.log('[DEBUG] Flower detected! Confidence:', classification.confidence);
            // Simulate distance calculation based on image characteristics
            // Higher confidence = closer flower (better detection)
            // Image size can also indicate distance (larger in frame = closer)
            const imageWidth = parseInt(req.body.width) || 640;
            const imageHeight = parseInt(req.body.height) || 480;
            const imageArea = imageWidth * imageHeight;
            
            // Simulate distance: higher confidence and larger image area = closer
            // Distance range: 10cm (very close) to 100cm (far)
            const baseDistance = 100 - (classification.confidence * 80); // 20-100cm range
            const sizeFactor = Math.min(imageArea / (640 * 480), 1.5); // Normalize by standard size
            const simulatedDistance = Math.max(10, Math.min(100, baseDistance / sizeFactor));
            
            distance = Math.round(simulatedDistance * 10) / 10; // Round to 1 decimal place
            
            // Activate ultrasonic sensor ONLY if flower is detected within 25cm
            if (distance <= 25) {
              ultrasonicActive = true;
              console.log(`[DEBUG] Flower detected at ${distance}cm - Ultrasonic sensor ACTIVATED`);
              
              // Send command to Arduino to trigger pollination (with cooldown to prevent rapid-fire)
              const now = Date.now();
              if (arduinoService.isConnected && (now - this.lastPollinationTime) >= this.pollinationCooldown) {
                console.log('[DEBUG] Sending POLL command to Arduino...');
                this.lastPollinationTime = now;
                arduinoService.pollinate(1).then((result) => {
                  console.log('[DEBUG] Arduino pollination result:', result);
                }).catch((error) => {
                  console.error('[DEBUG] Arduino pollination error:', error);
                });
              } else if (!arduinoService.isConnected) {
                console.log('[DEBUG] Arduino not connected - skipping pollination command');
              } else {
                console.log(`[DEBUG] Pollination cooldown active (${Math.round((this.pollinationCooldown - (now - this.lastPollinationTime)) / 1000)}s remaining)`);
              }
            } else {
              ultrasonicActive = false;
              console.log(`[DEBUG] Flower detected at ${distance}cm - Too far for ultrasonic sensor (threshold: 25cm)`);
            }
          }
        } else {
          classificationError = 'Flower classifier service not available. Model may not be trained yet.';
          console.error('[DEBUG] Classifier not available. Check if model file exists at:', require('path').join(__dirname, '../services/flower_classifier_model.h5'));
        }
      } catch (classifyError) {
        // Log error but don't fail the request
        classificationError = classifyError.message;
        console.error('[DEBUG] Flower classification error:', {
          message: classifyError.message,
          stack: classifyError.stack,
          name: classifyError.name
        });
      }

      res.json({
        success: true,
        message: 'Frame received',
        frame: frameData,
        classification: classification || null,
        classificationError: classificationError || null,
        distance: distance, // Distance in cm
        ultrasonicActive: ultrasonicActive, // Whether ultrasonic sensor is active
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
    const modelPath = path.join(__dirname, '../services/flower_classifier_model.h5');
    const modelExists = fs.existsSync(modelPath);
    const pythonScriptPath = path.join(__dirname, '../services/flower_classifier_service.py');
    const pythonScriptExists = fs.existsSync(pythonScriptPath);
    
    res.json({
      active: true,
      message: 'Camera feed endpoint ready',
      classifierAvailable: classifierAvailable,
      debug: {
        modelPath: modelPath,
        modelExists: modelExists,
        pythonScriptPath: pythonScriptPath,
        pythonScriptExists: pythonScriptExists
      },
      endpoints: {
        receiveFrame: 'POST /api/camera/frame',
        processFrame: 'POST /api/camera/process',
        status: 'GET /api/camera/status',
        debug: 'GET /api/camera/debug'
      }
    });
  }

  /**
   * Debug endpoint to test classifier
   * GET /api/camera/debug
   */
  async debug(req, res) {
    try {
      const modelPath = path.join(__dirname, '../services/flower_classifier_model.h5');
      const pythonScriptPath = path.join(__dirname, '../services/flower_classifier_service.py');
      
      const debugInfo = {
        modelPath: modelPath,
        modelExists: fs.existsSync(modelPath),
        pythonScriptPath: pythonScriptPath,
        pythonScriptExists: fs.existsSync(pythonScriptPath),
        classifierAvailable: await flowerClassifier.isAvailable(),
        arduinoConnected: arduinoService.isConnected,
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        debug: debugInfo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Connect to Arduino
   * POST /api/camera/arduino/connect
   * Body: { port: '/dev/ttyUSB0' } (optional)
   */
  async connectArduino(req, res) {
    try {
      const port = req.body?.port || null;
      const connected = await arduinoService.connect(port);
      
      if (connected) {
        res.json({
          success: true,
          message: 'Connected to Arduino',
          connected: arduinoService.isConnected
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to connect to Arduino. Check connection and try again.'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Disconnect from Arduino
   * POST /api/camera/arduino/disconnect
   */
  async disconnectArduino(req, res) {
    try {
      arduinoService.disconnect();
      res.json({
        success: true,
        message: 'Disconnected from Arduino'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get Arduino status
   * GET /api/camera/arduino/status
   */
  async getArduinoStatus(req, res) {
    try {
      if (!arduinoService.isConnected) {
        res.json({
          success: true,
          connected: false,
          message: 'Arduino not connected'
        });
        return;
      }

      const status = await arduinoService.getStatus();
      res.json({
        success: true,
        connected: true,
        status: status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

// Export both the controller and multer middleware
module.exports = {
  controller: new CameraController(),
  upload: upload.single('image')
};

