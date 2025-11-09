# Backend Server (Node.js)

Express server for NDVI analysis and Gemini AI integration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

- `GET /api/missions/decrease` - Get mission groups from decrease.geojson
- `GET /api/missions/increase` - Get mission groups from increase.geojson
- `GET /data/<filename>` - Serve geojson and json files from data directory
- `GET /api/health` - Health check endpoint

## Data Directory

The server expects data files in: `ndviAnalysis/data/outputs/`

Files:
- `decrease.geojson` - Areas of vegetation decrease
- `increase.geojson` - Areas of vegetation increase
- `summary.json` - Summary statistics
