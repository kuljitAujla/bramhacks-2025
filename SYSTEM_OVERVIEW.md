# 🌺 Pollination Drone System - Complete Overview

This document explains how all the components of your pollination drone system work together.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │  Camera Feed     │         │  Earth 3D View   │            │
│  │  (camera.html)   │         │  (Earth.tsx)     │            │
│  │                  │         │                  │            │
│  │  - Webcam/Laptop │         │  - Satellite     │            │
│  │  - Phone Camera  │         │    Visualization│            │
│  │  - Frame Capture │         │  - NDVI Heatmap  │            │
│  └────────┬─────────┘         └──────────────────┘            │
│           │                                                     │
│           │ HTTP POST (frames)                                 │
└───────────┼─────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND API                             │
│                    (Express.js Server)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │ Camera Controller│         │ Pollination      │            │
│  │                  │         │ Controller       │            │
│  │ - Receive frames │         │                  │            │
│  │ - Process images │         │ - Connect Arduino│            │
│  │ - CNN Detection  │         │ - Send commands  │            │
│  └────────┬─────────┘         │ - Pollination    │            │
│           │                    └────────┬─────────┘            │
│           │                            │                       │
│           │                            │ Serial/USB            │
│           │                            │                       │
│           │                            ▼                       │
│           │                    ┌──────────────────┐            │
│           │                    │ Arduino Service  │            │
│           │                    │                  │            │
│           │                    │ - Serial comm    │            │
│           │                    │ - Command queue │            │
│           │                    └────────┬─────────┘            │
│           │                             │                     │
│           └─────────┐                    │                    │
│                     │                    │                    │
│                     │  If flower detected                    │
│                     │  + distance OK                          │
│                     │                                         │
│                     ▼                                         │
│            ┌──────────────────┐                              │
│            │ Detection Result │                              │
│            │                  │                              │
│            │ - flowerDetected │                              │
│            │ - confidence     │                              │
│            │ - position       │                              │
│            └──────────────────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
            │
            │ Serial/USB Communication
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      HARDWARE LAYER                             │
│                    (Arduino Uno R3)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │  Servo Motor     │         │ Ultrasonic       │            │
│  │  (Pin 11)        │         │ Sensor           │            │
│  │                  │         │ (A4/A5)          │            │
│  │  - Pollination   │         │                  │            │
│  │    actuator      │         │  - Distance      │            │
│  │  - Brush motion  │         │    measurement   │            │
│  └──────────────────┘         │  - Safety check  │            │
│                               └──────────────────┘            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         pollination_controller.ino                       │  │
│  │                                                           │  │
│  │  - Receives commands via Serial                          │  │
│  │  - Controls servo for pollination                        │  │
│  │  - Reads ultrasonic sensor                               │  │
│  │  - Sends status back to backend                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Camera Feed → Backend

**Path**: `camera.html` → `POST /api/camera/process`

1. User opens `http://localhost:3001/camera.html` on laptop
2. Browser requests camera access (webcam)
3. User clicks "Process & Detect" or enables "Auto Mode"
4. JavaScript captures frame from video stream
5. Frame is converted to JPEG and sent via `FormData` to backend
6. Backend receives frame in `cameraController.processFrame()`

### 2. CNN Processing (Future)

**Path**: `cameraController.processFrame()` → CNN Model

1. Backend receives image buffer
2. **TODO**: Send to CNN model for flower detection
3. CNN returns:
   - `flowerDetected`: boolean
   - `confidence`: number (0-1)
   - `position`: { x, y, z }
   - `boundingBox`: { x, y, width, height }

### 3. Detection → Pollination

**Path**: `cameraController` → `pollinationController.handleDetection()`

1. If `flowerDetected === true`:
   - Check distance from ultrasonic sensor
   - If distance < 40cm:
     - Determine number of strokes based on confidence
     - Call `arduinoService.pollinate(strokes)`

### 4. Backend → Arduino

**Path**: `arduinoService.pollinate()` → Serial/USB → Arduino

1. Backend sends command: `POLL` or `POLL:2` (for multiple strokes)
2. Arduino receives command via Serial
3. Arduino:
   - Reads ultrasonic sensor distance
   - Checks if distance < 40cm
   - If OK, performs pollination sequence:
     - Move servo to CONTACT position (40°)
     - Move to CONTACT_2 position (140°)
     - Return to CONTACT (40°)
     - Return to HOME (90°)
   - Sends status back: `POLL_DONE` or `TOO_FAR`

### 5. Arduino → Backend (Status)

**Path**: Arduino Serial → `arduinoService` → Response

1. Arduino sends status messages:
   - `DIST:15` (distance in cm)
   - `POLL_DONE` (pollination complete)
   - `TOO_FAR` (flower too far)
   - `BUSY` (already pollinating)
2. Backend parses messages and updates status
3. Response sent back to frontend

## File Structure

```
bramhacks-2025/
├── backend/
│   ├── server.js                    # Main Express server
│   ├── package.json                 # Dependencies
│   │
│   ├── server/
│   │   ├── controller/
│   │   │   ├── cameraController.js  # Handles camera frames
│   │   │   └── pollinationController.js # Handles pollination logic
│   │   │
│   │   ├── routes/
│   │   │   ├── cameraRoutes.js      # Camera API routes
│   │   │   └── pollinationRoutes.js # Pollination API routes
│   │   │
│   │   └── services/
│   │       └── arduinoService.js    # Serial communication with Arduino
│   │
│   └── public/
│       └── camera.html                # Web interface for camera feed
│
├── frontend/
│   └── src/
│       └── components/
│           └── Earth.tsx          # 3D Earth visualization
│
└── backend/hardware/
    └── arduino/
        └── pollination_controller.ino # Arduino sketch
```

## API Endpoints

### Camera Endpoints

- `POST /api/camera/frame` - Send camera frame (no processing)
- `POST /api/camera/process` - Process frame with CNN detection
- `GET /api/camera/status` - Get camera system status

### Pollination Endpoints

- `POST /api/pollination/connect` - Connect to Arduino
- `POST /api/pollination/disconnect` - Disconnect from Arduino
- `GET /api/pollination/status` - Get Arduino status
- `POST /api/pollination/pollinate` - Trigger pollination
- `POST /api/pollination/detect` - Handle CNN detection result
- `POST /api/pollination/home` - Home servo
- `POST /api/pollination/test` - Run test sequence

## Complete Workflow Example

### Scenario: Detecting and Pollinating a Flower

1. **Setup**:
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm start
   ```

2. **Open Camera Interface**:
   - Browser: `http://localhost:3001/camera.html`
   - Click "Start Camera" → Webcam activates
   - Enable "Auto Mode" → Processes every 2 seconds

3. **Point Camera at Flower**:
   - Frame captured automatically
   - Sent to `/api/camera/process`

4. **Backend Processing**:
   ```javascript
   // cameraController.processFrame()
   // 1. Receive image buffer
   // 2. TODO: Send to CNN model
   // 3. CNN returns: { flowerDetected: true, confidence: 0.85 }
   // 4. Call pollinationController.handleDetection()
   ```

5. **Pollination Logic**:
   ```javascript
   // pollinationController.handleDetection()
   // 1. Check if Arduino connected
   // 2. Get distance from ultrasonic sensor
   // 3. If distance < 40cm:
   //    - Calculate strokes (confidence > 0.8 → 2 strokes)
   //    - Call arduinoService.pollinate(2)
   ```

6. **Arduino Execution**:
   ```cpp
   // Arduino receives: "POLL:2"
   // 1. Read ultrasonic: distance = 25cm
   // 2. Distance OK (< 40cm)
   // 3. Perform 2 pollination strokes:
   //    - Servo: 90° → 40° → 140° → 40° → 90°
   //    - Repeat once
   // 4. Send: "POLL_DONE"
   ```

7. **Response to Frontend**:
   ```json
   {
     "success": true,
     "message": "Flower detected and pollinated!",
     "detection": {
       "flowerDetected": true,
       "confidence": 0.85
     },
     "pollination": {
       "success": true,
       "strokes": 2
     }
   }
   ```

8. **UI Updates**:
   - Statistics: "Flowers Detected: 1", "Pollinations: 1"
   - Status: "🌺 Flower detected! Pollination triggered!"

## Integration Points

### 1. CNN Model Integration

**Location**: `backend/server/controller/cameraController.js`

**Current Code** (line ~95):
```javascript
// TODO: Run CNN inference here
const mockDetection = {
  flowerDetected: false,
  confidence: 0.0,
  position: { x: 0, y: 0, z: 0 }
};
```

**Replace With**:
```javascript
// Example with TensorFlow.js
const tf = require('@tensorflow/tfjs-node');
const model = await tf.loadLayersModel('path/to/model.json');
const imageTensor = tf.node.decodeImage(imageBuffer);
const prediction = model.predict(imageTensor);
const detection = {
  flowerDetected: prediction[0] > 0.5,
  confidence: prediction[0],
  position: { x: prediction[1], y: prediction[2], z: prediction[3] }
};
```

### 2. Distance Estimation

**Current**: Uses ultrasonic sensor on Arduino

**Future Enhancement**: 
- Use camera depth estimation
- Combine with ultrasonic for accuracy
- Calculate 3D position from bounding box + distance

### 3. Drone Navigation

**Future**: Add endpoints for:
- Position tracking
- Flight control
- Waypoint navigation
- Return to home

## Testing the System

### 1. Test Arduino Connection

```bash
curl -X POST http://localhost:3001/api/pollination/connect \
  -H "Content-Type: application/json" \
  -d '{"port": "/dev/cu.usbmodem..."}'
```

### 2. Test Camera Feed

1. Open `http://localhost:3001/camera.html`
2. Click "Start Camera"
3. Click "Capture Frame"
4. Check backend logs for received frame

### 3. Test Full Flow

1. Connect Arduino
2. Start camera feed
3. Point at object (simulate flower)
4. Click "Process & Detect"
5. Check if Arduino receives command
6. Watch servo move

## Troubleshooting

### Camera Not Working
- ✅ Check browser console for errors
- ✅ Ensure using `http://localhost:3001` (not `file://`)
- ✅ Grant camera permissions
- ✅ Try different browser

### Arduino Not Connecting
- ✅ Check USB cable
- ✅ Find correct port: `ls /dev/cu.*` (Mac) or `ls /dev/tty*` (Linux)
- ✅ Ensure Arduino IDE is closed
- ✅ Check baud rate (115200)

### Frames Not Processing
- ✅ Check backend logs
- ✅ Verify `/api/camera/process` endpoint
- ✅ Check network tab in browser DevTools
- ✅ Ensure multer is installed

## Next Steps

1. **Integrate CNN Model**: Replace mock detection with actual model
2. **Add Distance Estimation**: Use camera for depth estimation
3. **Improve UI**: Add real-time video preview with detection overlay
4. **Add Logging**: Track all detections and pollinations
5. **Add Calibration**: Calibrate servo angles for different flowers
6. **Add Safety**: Emergency stop, collision avoidance

## Quick Start Commands

```bash
# 1. Install dependencies
cd backend && npm install

# 2. Start backend server
npm start

# 3. Open camera interface
# Browser: http://localhost:3001/camera.html

# 4. Connect Arduino (via API or upload sketch first)
# Upload: pollination_controller.ino to Arduino
# Then connect via API endpoint
```

---

**System Status**: ✅ Camera feed working | ✅ Arduino communication ready | ⏳ CNN integration pending

