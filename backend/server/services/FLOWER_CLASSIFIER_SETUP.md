# Flower Classifier Setup Guide

This guide explains how to set up and use the flower classifier service that integrates with the camera feed.

## Overview

The flower classifier uses a TensorFlow/Keras CNN model to classify images as "Flower" or "Not a Flower". It's integrated into the camera feed system to automatically detect flowers in real-time.

## Architecture

1. **Python Service** (`flower_classifier_service.py`): Standalone Python script that loads a trained model and makes predictions
2. **Node.js Wrapper** (`flowerClassifierService.js`): Service that calls the Python script from Node.js
3. **Camera Controller**: Integrates the classifier into the camera feed endpoints

## Setup Steps

### 1. Install Python Dependencies

```bash
cd backend/server/services
pip install -r requirements.txt
```

Or install individually:
```bash
pip install tensorflow Pillow numpy
```

### 2. Train and Save the Model

You need to train the model using your original training script (`flower_classifier.py`). After training, save the model:

```python
# Add this to your training script after model.fit()
model.save('flower_classifier_model.h5')
```

Or use the model creation function in `flower_classifier_service.py`:

```python
from flower_classifier_service import FlowerClassifier

classifier = FlowerClassifier()
model = classifier.create_model()
# Train your model...
model.save('flower_classifier_model.h5')
```

**Important**: Save the model as `flower_classifier_model.h5` in the `backend/server/services/` directory.

### 3. Verify Python Installation

The service uses `python3` by default. You can override this with the `PYTHON_COMMAND` environment variable:

```bash
export PYTHON_COMMAND=python3
```

Test the classifier directly:
```bash
cd backend/server/services
python3 flower_classifier_service.py --image /path/to/test/image.jpg --json
```

### 4. Test the Integration

1. Start your backend server
2. Check the camera status endpoint:
   ```bash
   curl http://localhost:3001/api/camera/status
   ```
   This should show `classifierAvailable: true` if everything is set up correctly.

3. Send a test image to the camera frame endpoint:
   ```bash
   curl -X POST http://localhost:3001/api/camera/frame \
     -F "image=@/path/to/test/image.jpg"
   ```

   The response should include a `classification` object with:
   ```json
   {
     "classification": {
       "isFlower": true,
       "confidence": 0.95,
       "class": "Flower",
       "score": 0.05
     }
   }
   ```

## API Endpoints

### POST /api/camera/frame
Automatically classifies images sent to this endpoint.

**Request:**
- `multipart/form-data` with `image` field
- Optional: `droneId`, `width`, `height`

**Response:**
```json
{
  "success": true,
  "message": "Frame received",
  "frame": {
    "timestamp": "2025-01-XX...",
    "size": 12345,
    "mimetype": "image/jpeg",
    "width": 640,
    "height": 480,
    "droneId": "drone-123"
  },
  "classification": {
    "isFlower": true,
    "confidence": 0.95,
    "class": "Flower",
    "score": 0.05
  },
  "classificationError": null
}
```

### POST /api/camera/process
Processes frame and triggers pollination if flower is detected.

**Request:**
- Same as `/api/camera/frame`

**Response:**
```json
{
  "success": true,
  "message": "Frame processed - Flower detected!",
  "detection": {
    "flowerDetected": true,
    "confidence": 0.95,
    "class": "Flower",
    "score": 0.05,
    "position": { "x": 0, "y": 0, "z": 0 }
  },
  "classification": { ... },
  "pollination": { ... }
}
```

### GET /api/camera/status
Check if the classifier service is available.

**Response:**
```json
{
  "active": true,
  "message": "Camera feed endpoint ready",
  "classifierAvailable": true,
  "endpoints": { ... }
}
```

## Model Information

- **Input Size**: 100x100 pixels RGB images
- **Model Architecture**: 
  - Conv2D(32) → MaxPooling2D
  - Conv2D(64) → MaxPooling2D
  - Conv2D(128) → MaxPooling2D
  - Dense(512) with Dropout(0.5)
  - Dense(1) with sigmoid activation
- **Output**: Binary classification (0 = Flower, 1 = Not a Flower)
- **Threshold**: Score < 0.5 = Flower, Score >= 0.5 = Not a Flower

## Troubleshooting

### "Classifier service not available"

1. Check if Python 3 is installed:
   ```bash
   python3 --version
   ```

2. Check if the model file exists:
   ```bash
   ls backend/server/services/flower_classifier_model.h5
   ```

3. Check if dependencies are installed:
   ```bash
   python3 -c "import tensorflow; import PIL; print('OK')"
   ```

4. Test the Python script directly:
   ```bash
   cd backend/server/services
   python3 flower_classifier_service.py --help
   ```

### "Model not found" Error

Make sure you've trained and saved the model as `flower_classifier_model.h5` in the `backend/server/services/` directory.

### Classification Errors

- Check that images are valid (JPEG, PNG, etc.)
- Ensure images can be opened by PIL/Pillow
- Check Python error logs in the console

## Next Steps

1. **Train your model** using the original `flower_classifier.py` script
2. **Save the model** as `flower_classifier_model.h5` in the services directory
3. **Test the integration** with the camera feed
4. **Connect to Arduino** - The classifier is now ready to trigger pollination when flowers are detected!

