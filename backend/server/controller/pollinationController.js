const arduinoService = require('../services/arduinoService');

class PollinationController {
  /**
   * Connect to Arduino
   * POST /api/pollination/connect
   */
  async connect(req, res) {
    try {
      const { port } = req.body;
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
          message: 'Failed to connect to Arduino'
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
   * POST /api/pollination/disconnect
   */
  async disconnect(req, res) {
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
   * Get connection status
   * GET /api/pollination/status
   */
  async getStatus(req, res) {
    try {
      if (!arduinoService.isConnected) {
        return res.json({
          connected: false,
          message: 'Arduino not connected'
        });
      }

      const status = await arduinoService.getStatus();
      res.json({
        connected: true,
        ...status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Trigger pollination
   * POST /api/pollination/pollinate
   * Body: { strokes?: number, distance?: number }
   */
  async pollinate(req, res) {
    try {
      if (!arduinoService.isConnected) {
        return res.status(400).json({
          success: false,
          message: 'Arduino not connected'
        });
      }

      const { strokes = 1, distance } = req.body;

      // Optional: Check distance before pollinating
      if (distance !== undefined) {
        const status = await arduinoService.getStatus();
        if (status.distance && status.distance > distance) {
          return res.json({
            success: false,
            message: 'Too far from flower',
            distance: status.distance
          });
        }
      }

      const result = await arduinoService.pollinate(strokes);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Handle CNN detection result
   * POST /api/pollination/detect
   * Body: { 
   *   flowerDetected: boolean,
   *   position?: { x, y, z },
   *   distance?: number,
   *   confidence?: number
   * }
   */
  async handleDetection(req, res) {
    try {
      if (!arduinoService.isConnected) {
        return res.status(400).json({
          success: false,
          message: 'Arduino not connected'
        });
      }

      const { flowerDetected, position, distance, confidence } = req.body;

      if (!flowerDetected) {
        return res.json({
          success: false,
          message: 'No flower detected'
        });
      }

      // Check if flower is in range
      const status = await arduinoService.getStatus();
      const actualDistance = status.distance || distance;

      if (actualDistance && actualDistance > 40) {
        return res.json({
          success: false,
          message: 'Flower too far away',
          distance: actualDistance,
          requiredDistance: 40
        });
      }

      // Determine number of strokes based on confidence
      let strokes = 1;
      if (confidence) {
        if (confidence > 0.8) {
          strokes = 2; // High confidence - double stroke
        } else if (confidence < 0.5) {
          strokes = 1; // Low confidence - single stroke
        }
      }

      // Trigger pollination
      const result = await arduinoService.pollinate(strokes);

      res.json({
        success: result.success,
        message: result.message,
        distance: actualDistance,
        strokes,
        confidence,
        position
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Home servo
   * POST /api/pollination/home
   */
  async home(req, res) {
    try {
      if (!arduinoService.isConnected) {
        return res.status(400).json({
          success: false,
          message: 'Arduino not connected'
        });
      }

      const result = await arduinoService.home();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Run test sequence
   * POST /api/pollination/test
   */
  async test(req, res) {
    try {
      if (!arduinoService.isConnected) {
        return res.status(400).json({
          success: false,
          message: 'Arduino not connected'
        });
      }

      const result = await arduinoService.test();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new PollinationController();

