# Camera Feed Setup Guide

This guide explains how to use your phone camera to simulate the drone camera feed for the pollination system.

## Overview

The camera feed system allows you to:
1. Access your phone's camera through a web interface
2. Stream video frames to the backend
3. Process frames with CNN for flower detection
4. Automatically trigger pollination when flowers are detected

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start the Backend Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

The server will start on `http://localhost:3001`

### 3. Access Camera Interface on Your Phone

**Option A: Same Network (Recommended)**
1. Find your computer's local IP address:
   - Mac/Linux: `ifconfig` or `ip addr`
   - Windows: `ipconfig`
   - Look for something like `192.168.1.xxx`

2. On your phone, open a browser and go to:
   ```
   http://YOUR_COMPUTER_IP:3001/camera.html
   ```
   Example: `http://192.168.1.100:3001/camera.html`

**Option B: Localhost (Development Only)**
- If testing on the same device, use: `http://localhost:3001/camera.html`

### 4. Grant Camera Permissions

When you open the camera interface:
1. Your browser will ask for camera permission
2. Click "Allow" to grant access
3. The interface will automatically use your phone's back camera (if available)

## Using the Camera Interface

### Controls

1. **Start Camera**: Activates your phone's camera
2. **Stop Camera**: Stops the camera feed
3. **Capture Frame**: Takes a single snapshot and sends it to the backend
4. **Process & Detect**: Captures a frame and runs CNN detection
5. **Auto Mode**: Automatically processes frames every 2 seconds

### Features

- **Real-time Video Feed**: See what your camera sees
- **Frame Statistics**: Track frames sent, flowers detected, and pollinations triggered
- **Status Updates**: Real-time feedback on operations
- **Auto Mode**: Continuous processing for hands-free operation

## API Endpoints

### POST `/api/camera/frame`
Send a camera frame to the backend (without processing)

**Request**: `multipart/form-data`
- `image`: Image file (JPEG/PNG)
- `width`: Image width (optional)
- `height`: Image height (optional)

**Response**:
```json
{
  "success": true,
  "message": "Frame received",
  "frame": {
    "timestamp": "2025-01-08T12:00:00.000Z",
    "size": 12345,
    "mimetype": "image/jpeg"
  }
}
```

### POST `/api/camera/process`
Process a camera frame with CNN detection

**Request**: Same as `/api/camera/frame`

**Response**:
```json
{
  "success": true,
  "message": "Frame processed",
  "detection": {
    "flowerDetected": false,
    "confidence": 0.0,
    "position": { "x": 0, "y": 0, "z": 0 }
  }
}
```

### GET `/api/camera/status`
Get camera feed system status

## Integration with CNN

To integrate your actual CNN model:

1. **Edit `backend/server/controller/cameraController.js`**
2. **Find the `processFrame` method**
3. **Replace the mock detection with your CNN call**:

```javascript
// Replace this:
const mockDetection = {
  flowerDetected: false,
  confidence: 0.0,
  position: { x: 0, y: 0, z: 0 }
};

// With your CNN model:
const detection = await yourCNNModel.detect(imageBuffer);
```

### Example CNN Integration

```javascript
const tf = require('@tensorflow/tfjs-node');
const flowerModel = require('./models/flowerDetectionModel');

async function processFrame(req, res) {
  const imageBuffer = req.file.buffer;
  
  // Run CNN inference
  const detection = await flowerModel.detect(imageBuffer);
  
  // detection should have:
  // - flowerDetected: boolean
  // - confidence: number (0-1)
  // - position: { x, y, z }
  // - boundingBox: { x, y, width, height }
  
  if (detection.flowerDetected) {
    // Trigger pollination...
  }
}
```

## Troubleshooting

### Camera Not Working
- **Check browser permissions**: Make sure camera access is allowed
- **Use HTTPS**: Some browsers require HTTPS for camera access (use ngrok or similar for testing)
- **Try different browser**: Chrome, Safari, Firefox all support camera access

### Connection Issues
- **Check firewall**: Make sure port 3001 is open
- **Same network**: Phone and computer must be on the same WiFi network
- **Check IP address**: Verify you're using the correct local IP

### Frames Not Sending
- **Check console**: Open browser developer tools to see errors
- **Check backend logs**: Look for errors in the server console
- **Network tab**: Check if requests are being sent successfully

## Security Notes

⚠️ **For Production**:
- Use HTTPS (required for camera access on some browsers)
- Implement authentication
- Add rate limiting
- Validate image sizes and types
- Consider using WebRTC for better performance

## Next Steps

1. **Integrate your CNN model** in `cameraController.js`
2. **Test with real flowers** to verify detection
3. **Tune detection thresholds** based on your model's output
4. **Add distance estimation** using the ultrasonic sensor data
5. **Implement position tracking** for drone navigation

## Example Workflow

1. Open camera interface on phone
2. Point phone at a flower
3. Enable "Auto Mode" or click "Process & Detect"
4. Backend processes frame with CNN
5. If flower detected and in range, pollination is triggered
6. Arduino receives command and performs pollination sequence

