# API Usage Examples

## Python Example (for CNN integration)

```python
import requests
import json

API_BASE = "http://localhost:3001/api/pollination"

# Connect to Arduino
response = requests.post(f"{API_BASE}/connect")
print(response.json())

# Check status
response = requests.get(f"{API_BASE}/status")
print(response.json())

# Handle flower detection from CNN
def handle_flower_detection(flower_detected, position, distance, confidence):
    data = {
        "flowerDetected": flower_detected,
        "position": position,
        "distance": distance,
        "confidence": confidence
    }
    response = requests.post(f"{API_BASE}/detect", json=data)
    return response.json()

# Example usage
result = handle_flower_detection(
    flower_detected=True,
    position={"x": 10, "y": 20, "z": 30},
    distance=25,
    confidence=0.85
)
print(result)

# Manual pollination trigger
response = requests.post(f"{API_BASE}/pollinate", json={"strokes": 2})
print(response.json())

# Disconnect
response = requests.post(f"{API_BASE}/disconnect")
print(response.json())
```

## JavaScript/Node.js Example

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/pollination';

// Connect to Arduino
async function connect() {
  try {
    const response = await axios.post(`${API_BASE}/connect`);
    console.log('Connected:', response.data);
  } catch (error) {
    console.error('Connection error:', error.message);
  }
}

// Get status
async function getStatus() {
  try {
    const response = await axios.get(`${API_BASE}/status`);
    console.log('Status:', response.data);
    return response.data;
  } catch (error) {
    console.error('Status error:', error.message);
  }
}

// Handle CNN detection
async function handleDetection(flowerData) {
  try {
    const response = await axios.post(`${API_BASE}/detect`, {
      flowerDetected: flowerData.detected,
      position: flowerData.position,
      distance: flowerData.distance,
      confidence: flowerData.confidence
    });
    console.log('Pollination result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Detection error:', error.message);
  }
}

// Pollinate manually
async function pollinate(strokes = 1) {
  try {
    const response = await axios.post(`${API_BASE}/pollinate`, { strokes });
    console.log('Pollination result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Pollination error:', error.message);
  }
}

// Example usage
(async () => {
  await connect();
  const status = await getStatus();
  
  // Simulate CNN detection
  await handleDetection({
    detected: true,
    position: { x: 10, y: 20, z: 30 },
    distance: 25,
    confidence: 0.85
  });
})();
```

## cURL Examples

```bash
# Connect to Arduino
curl -X POST http://localhost:3001/api/pollination/connect \
  -H "Content-Type: application/json"

# Get status
curl http://localhost:3001/api/pollination/status

# Handle detection
curl -X POST http://localhost:3001/api/pollination/detect \
  -H "Content-Type: application/json" \
  -d '{
    "flowerDetected": true,
    "position": {"x": 10, "y": 20, "z": 30},
    "distance": 25,
    "confidence": 0.85
  }'

# Pollinate manually
curl -X POST http://localhost:3001/api/pollination/pollinate \
  -H "Content-Type: application/json" \
  -d '{"strokes": 2}'

# Run test
curl -X POST http://localhost:3001/api/pollination/test

# Home servo
curl -X POST http://localhost:3001/api/pollination/home

# Disconnect
curl -X POST http://localhost:3001/api/pollination/disconnect
```

## Response Examples

### Connect Response
```json
{
  "success": true,
  "message": "Connected to Arduino",
  "connected": true
}
```

### Status Response
```json
{
  "connected": true,
  "distance": 25,
  "ready": true,
  "raw": "DIST:25\nHOME:90\nREADY:1"
}
```

### Detection Response
```json
{
  "success": true,
  "message": "POLL_DONE",
  "distance": 25,
  "strokes": 2,
  "confidence": 0.85,
  "position": {"x": 10, "y": 20, "z": 30}
}
```

### Pollination Response
```json
{
  "success": true,
  "message": "POLL_DONE",
  "distance": 25
}
```

