const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class FlowerClassifierService {
  constructor() {
    // Path to the Python classifier service script
    this.pythonScriptPath = path.join(__dirname, 'flower_classifier_service.py');
    // Use virtual environment Python if available, otherwise fall back to system Python
    const venvPython = path.join(__dirname, 'venv', 'bin', 'python3');
    this.pythonCommand = process.env.PYTHON_COMMAND || 
      (fs.existsSync(venvPython) ? venvPython : 'python3');
  }

  /**
   * Classify an image to determine if it contains a flower
   * @param {Buffer|string} imageInput - Image buffer, file path, or base64 string
   * @param {Object} options - Optional configuration
   * @returns {Promise<Object>} Prediction result
   */
  async classify(imageInput, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        // Determine input type and prepare arguments
        let args = ['-u', this.pythonScriptPath, '--json'];
        let inputData = null;
        let useStdin = false;

        if (Buffer.isBuffer(imageInput)) {
          // Convert buffer to base64
          inputData = imageInput.toString('base64');
          useStdin = true;
        } else if (typeof imageInput === 'string') {
          // Check if it's a file path or base64
          if (fs.existsSync(imageInput)) {
            // It's a file path
            args.push('--image', imageInput);
          } else if (imageInput.length > 100 || imageInput.startsWith('data:image')) {
            // Likely base64 string
            inputData = imageInput.replace(/^data:image\/[^;]+;base64,/, '');
            useStdin = true;
          } else {
            // Assume it's a file path that doesn't exist yet, or base64
            inputData = imageInput;
            useStdin = true;
          }
        } else {
          reject(new Error('Invalid image input type. Expected Buffer, string (path/base64), or file path.'));
          return;
        }

        // Add model path if specified
        if (options.modelPath) {
          args.push('--model', options.modelPath);
        }

        // Spawn Python process
        const pythonProcess = spawn(this.pythonCommand, args, {
          stdio: useStdin ? ['pipe', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe'],
          cwd: __dirname
        });

        let stdout = '';
        let stderr = '';

        // Collect stdout
        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        // Collect stderr
        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        // Handle process completion
        pythonProcess.on('close', (code) => {
          // In JSON mode, Python always exits with 0, so any non-zero is an error
          if (code !== 0) {
            // Try to parse error from stdout first (JSON error response)
            if (stdout.trim()) {
              try {
                const errorResult = JSON.parse(stdout.trim());
                if (errorResult.error) {
                  reject(new Error(errorResult.error));
                  return;
                }
              } catch (e) {
                // Not JSON, use raw error
              }
            }
            reject(new Error(`Python process exited with code ${code}. Error: ${stderr || stdout || 'Unknown error'}`));
            return;
          }

          // Parse JSON output
          if (!stdout.trim()) {
            reject(new Error('Python process returned no output. Make sure the model is trained and available.'));
            return;
          }

          try {
            const result = JSON.parse(stdout.trim());
            
            // Handle errors from Python script
            if (result.error) {
              reject(new Error(result.error));
              return;
            }

            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse Python output: ${stdout.substring(0, 200)}. Error: ${parseError.message}`));
          }
        });

        // Handle process errors
        pythonProcess.on('error', (error) => {
          reject(new Error(`Failed to spawn Python process: ${error.message}. Make sure Python 3 is installed and accessible as '${this.pythonCommand}'.`));
        });

        // Handle stdin errors (EPIPE, etc.)
        pythonProcess.stdin.on('error', (error) => {
          // Ignore EPIPE errors - they happen when the process closes before we finish writing
          if (error.code !== 'EPIPE') {
            console.error('Python process stdin error:', error);
          }
        });

        // Send input data via stdin if needed
        if (useStdin && inputData) {
          try {
            if (!pythonProcess.stdin.destroyed) {
              pythonProcess.stdin.write(inputData);
              pythonProcess.stdin.end();
            }
          } catch (writeError) {
            // Ignore write errors if pipe is already closed
            if (writeError.code !== 'EPIPE') {
              console.error('Error writing to Python process stdin:', writeError);
            }
          }
        }

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Check if the classifier service is available
   * @returns {Promise<boolean>} True if service is available
   */
  async isAvailable() {
    return new Promise((resolve) => {
      try {
        // Check if Python script exists
        if (!fs.existsSync(this.pythonScriptPath)) {
          resolve(false);
          return;
        }

        // Check if model file exists (optional - service will handle gracefully if missing)
        const modelPath = path.join(__dirname, 'flower_classifier_model.h5');
        const modelExists = fs.existsSync(modelPath);
        
        // If model doesn't exist, service is not available
        if (!modelExists) {
          resolve(false);
          return;
        }

        // Try to run Python with version check
        const pythonProcess = spawn(this.pythonCommand, ['--version'], {
          stdio: 'ignore',
          cwd: __dirname
        });
        
        pythonProcess.on('close', (code) => {
          resolve(code === 0);
        });

        pythonProcess.on('error', () => {
          resolve(false);
        });

        // Timeout after 2 seconds
        setTimeout(() => {
          try {
            pythonProcess.kill();
          } catch (e) {
            // Ignore kill errors
          }
          resolve(false);
        }, 2000);

      } catch (error) {
        resolve(false);
      }
    });
  }

  /**
   * Classify an image from a buffer (for use with multer uploads)
   * @param {Buffer} imageBuffer - Image buffer from multer
   * @returns {Promise<Object>} Prediction result
   */
  async classifyBuffer(imageBuffer) {
    return this.classify(imageBuffer);
  }

  /**
   * Classify an image from a file path
   * @param {string} imagePath - Path to image file
   * @returns {Promise<Object>} Prediction result
   */
  async classifyFile(imagePath) {
    return this.classify(imagePath);
  }

  /**
   * Classify an image from a base64 string
   * @param {string} base64String - Base64 encoded image
   * @returns {Promise<Object>} Prediction result
   */
  async classifyBase64(base64String) {
    return this.classify(base64String);
  }
}

// Export singleton instance
module.exports = new FlowerClassifierService();

