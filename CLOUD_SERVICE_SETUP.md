# Cloud Service Setup Guide

This guide explains how to connect the dashboard to a cloud service for live mission data.

## Supported Cloud Providers

The system supports multiple cloud providers:

1. **REST API** (default) - Generic REST API endpoint
2. **Firebase** - Google Firebase Firestore
3. **AWS** - Amazon Web Services (DynamoDB)

## Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Cloud Provider (options: 'rest', 'firebase', 'aws')
CLOUD_PROVIDER=rest

# REST API Configuration
CLOUD_API_URL=https://your-api.com/api
CLOUD_API_KEY=your_api_key_here

# Firebase Configuration (if using Firebase)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# AWS Configuration (if using AWS)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## REST API Setup (Default)

### 1. API Endpoint Structure

Your cloud service should provide the following endpoints:

#### Get Live Missions
```
GET /missions/live
Headers:
  Authorization: Bearer YOUR_API_KEY
  Content-Type: application/json

Response:
{
  "missions": [
    {
      "id": "M78910",
      "name": "Urban Park Pollination",
      "status": "in-progress",
      "startTime": "2024-01-15T10:00:00Z",
      "location": {
        "lat": 43.6532,
        "lng": -79.3832
      },
      "droneId": "A01-C4",
      "flowersPollinated": 1248,
      "flowersDetected": 15,
      "batteryLevel": 82,
      "flightTime": "00:42:19",
      "progress": 65,
      "estimatedCompletion": "2024-01-15T11:30:00Z"
    }
  ]
}
```

#### Get Mission Updates
```
GET /missions/:id/updates
Headers:
  Authorization: Bearer YOUR_API_KEY
  Content-Type: application/json

Response:
{
  "updates": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "type": "status",
      "data": {
        "flowersPollinated": 1250,
        "batteryLevel": 81
      }
    }
  ]
}
```

### 2. Testing the API

Test your API endpoint:

```bash
# Test live missions endpoint
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://your-api.com/api/missions/live

# Test mission updates endpoint
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://your-api.com/api/missions/M78910/updates
```

## Firebase Setup

### 1. Install Firebase Admin SDK

```bash
cd backend
npm install firebase-admin
```

### 2. Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file

### 3. Update cloudService.js

Uncomment and configure the Firebase initialization code in `backend/server/services/cloudService.js`:

```javascript
initializeFirebase() {
  const admin = require('firebase-admin');
  const serviceAccount = require('./path/to/serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  this.db = admin.firestore();
}
```

### 4. Firebase Database Structure

Your Firestore database should have a `missions` collection:

```
missions/
  {missionId}/
    name: string
    status: string ("in-progress", "completed", "scheduled")
    startTime: timestamp
    location: { lat: number, lng: number }
    droneId: string
    flowersPollinated: number
    flowersDetected: number
    batteryLevel: number
    flightTime: string
    progress: number
    estimatedCompletion: timestamp
```

## AWS Setup

### 1. Install AWS SDK

```bash
cd backend
npm install aws-sdk
```

### 2. Configure AWS Credentials

Set up AWS credentials using one of these methods:

- Environment variables (recommended)
- AWS credentials file (`~/.aws/credentials`)
- IAM role (if running on EC2)

### 3. Update cloudService.js

Uncomment and configure the AWS initialization code in `backend/server/services/cloudService.js`:

```javascript
initializeAWS() {
  const AWS = require('aws-sdk');
  
  AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });
  
  this.dynamodb = new AWS.DynamoDB.DocumentClient();
}
```

### 4. DynamoDB Table Structure

Create a DynamoDB table named `missions` with:

- Partition Key: `id` (String)
- Attributes:
  - `name` (String)
  - `status` (String)
  - `startTime` (String)
  - `location` (Map)
  - `droneId` (String)
  - `flowersPollinated` (Number)
  - `flowersDetected` (Number)
  - `batteryLevel` (Number)
  - `flightTime` (String)
  - `progress` (Number)
  - `estimatedCompletion` (String)

## Real-Time Updates

### Current Implementation

The system currently uses **polling** to fetch updates every 5 seconds. For better performance, consider:

1. **WebSockets** - Real-time bidirectional communication
2. **Server-Sent Events (SSE)** - One-way server-to-client updates
3. **Firebase Realtime Database** - Automatic real-time sync
4. **AWS AppSync** - Real-time GraphQL subscriptions

### WebSocket Implementation (Future)

To add WebSocket support:

1. Install Socket.IO:
```bash
npm install socket.io
```

2. Update `server.js`:
```javascript
const http = require('http');
const socketIO = require('socket.io');

const server = http.createServer(app);
const io = socketIO(server);

io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send live missions on connection
  cloudService.subscribeToUpdates((missions) => {
    socket.emit('live-missions', missions);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

3. Update frontend to use Socket.IO:
```javascript
const socket = io('http://localhost:3001');

socket.on('live-missions', (missions) => {
  updateLiveMissionsUI(missions);
});
```

## Testing

### Test with Mock Data

The system includes mock data for testing. If no cloud service is configured, it will return mock data automatically.

### Test API Endpoints

```bash
# Test live missions endpoint
curl http://localhost:3001/api/dashboard/live-missions

# Test mission updates endpoint
curl http://localhost:3001/api/dashboard/mission/M78910/updates
```

## Troubleshooting

### No data showing
- Check that `CLOUD_API_URL` is set correctly
- Verify API key is valid
- Check backend logs for errors
- Ensure API endpoint returns correct format

### Connection errors
- Verify network connectivity
- Check API endpoint URL
- Ensure CORS is configured on your API
- Check firewall settings

### Real-time updates not working
- Check browser console for errors
- Verify polling interval (default: 5 seconds)
- Check network tab for failed requests
- Ensure backend is running

## Security Notes

- **Never commit API keys to version control**
- Use environment variables for sensitive data
- Implement rate limiting on your API
- Use HTTPS for API endpoints
- Validate and sanitize all API responses
- Implement authentication/authorization

## Next Steps

1. Set up your cloud service (REST API, Firebase, or AWS)
2. Configure environment variables
3. Test the connection
4. Implement real-time updates (WebSockets or SSE)
5. Add error handling and retry logic
6. Monitor API usage and performance

