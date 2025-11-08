const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

class ArduinoService {
  constructor() {
    this.port = null;
    this.parser = null;
    this.isConnected = false;
    this.responseCallbacks = new Map();
    this.responseTimeout = 5000; // 5 seconds
  }

  /**
   * Find and connect to Arduino
   * @param {string} portPath - Optional port path (e.g., '/dev/ttyUSB0' or 'COM3')
   * @returns {Promise<boolean>}
   */
  async connect(portPath = null) {
    try {
      // If port path provided, use it
      if (portPath) {
        return await this.connectToPort(portPath);
      }

      // Otherwise, find Arduino automatically
      const ports = await SerialPort.list();
      const arduinoPort = ports.find(port => 
        port.manufacturer && (
          port.manufacturer.includes('Arduino') ||
          port.manufacturer.includes('arduino') ||
          port.vendorId === '2341' // Arduino vendor ID
        )
      );

      if (arduinoPort) {
        console.log(`Found Arduino on ${arduinoPort.path}`);
        return await this.connectToPort(arduinoPort.path);
      }

      // Fallback: try common ports
      const commonPorts = ports
        .map(p => p.path)
        .filter(path => path.includes('USB') || path.includes('ACM') || path.includes('COM'));

      for (const path of commonPorts) {
        try {
          if (await this.connectToPort(path)) {
            return true;
          }
        } catch (err) {
          // Try next port
          continue;
        }
      }

      throw new Error('Arduino not found. Please check connection.');
    } catch (error) {
      console.error('Failed to connect to Arduino:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Connect to specific port
   */
  async connectToPort(portPath) {
    return new Promise((resolve, reject) => {
      try {
        this.port = new SerialPort(portPath, {
          baudRate: 115200,
          autoOpen: false
        });

        this.parser = this.port.pipe(new Readline({ delimiter: '\n' }));

        this.port.open((err) => {
          if (err) {
            reject(err);
            return;
          }

          this.isConnected = true;
          console.log(`Connected to Arduino on ${portPath}`);

          // Set up message handler
          this.parser.on('data', (data) => {
            this.handleResponse(data.toString().trim());
          });

          // Wait for ready signal
          const readyTimeout = setTimeout(() => {
            resolve(true); // Assume connected even without ready signal
          }, 2000);

          this.parser.once('data', (data) => {
            if (data.toString().includes('ARDUINO_READY')) {
              clearTimeout(readyTimeout);
              console.log('Arduino is ready');
              resolve(true);
            }
          });

          this.port.on('error', (err) => {
            console.error('Serial port error:', err);
            this.isConnected = false;
          });

          this.port.on('close', () => {
            console.log('Arduino disconnected');
            this.isConnected = false;
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle responses from Arduino
   */
  handleResponse(data) {
    console.log(`Arduino: ${data}`);

    // Check if this is a response to a pending command
    for (const [command, callback] of this.responseCallbacks.entries()) {
      if (data.includes('POLL_DONE') || data.includes('TOO_FAR') || 
          data.includes('DISTANCE_ERR') || data.includes('BUSY') ||
          data.includes('HOMED') || data.includes('TEST_DONE') ||
          data.startsWith('DIST:') || data.startsWith('STATUS')) {
        clearTimeout(callback.timeout);
        callback.resolve(data);
        this.responseCallbacks.delete(command);
        return;
      }
    }
  }

  /**
   * Send command to Arduino and wait for response
   */
  async sendCommand(command, timeout = this.responseTimeout) {
    if (!this.isConnected || !this.port) {
      throw new Error('Arduino not connected');
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.responseCallbacks.delete(command);
        reject(new Error(`Command timeout: ${command}`));
      }, timeout);

      this.responseCallbacks.set(command, {
        resolve,
        timeout: timeoutId
      });

      this.port.write(command + '\n', (err) => {
        if (err) {
          clearTimeout(timeoutId);
          this.responseCallbacks.delete(command);
          reject(err);
        }
      });
    });
  }

  /**
   * Trigger pollination
   */
  async pollinate(strokes = 1) {
    try {
      const command = strokes > 1 ? `POLL:${strokes}` : 'POLL';
      const response = await this.sendCommand(command);
      return {
        success: response.includes('POLL_DONE'),
        message: response,
        distance: this.parseDistance(response)
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get status from Arduino
   */
  async getStatus() {
    try {
      const response = await this.sendCommand('STATUS');
      return {
        distance: this.parseDistance(response),
        ready: !response.includes('READY:0'),
        raw: response
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  }

  /**
   * Move servo to home position
   */
  async home() {
    try {
      const response = await this.sendCommand('HOME');
      return {
        success: response.includes('HOMED'),
        message: response
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Run test sequence
   */
  async test() {
    try {
      const response = await this.sendCommand('TEST');
      return {
        success: response.includes('TEST_DONE'),
        message: response
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Parse distance from response
   */
  parseDistance(response) {
    const match = response.match(/DIST:(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Disconnect from Arduino
   */
  disconnect() {
    if (this.port && this.port.isOpen) {
      this.port.close();
    }
    this.isConnected = false;
    this.responseCallbacks.clear();
  }
}

// Singleton instance
const arduinoService = new ArduinoService();

module.exports = arduinoService;

