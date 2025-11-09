# API Setup Guide

This guide explains how to set up the APIs needed for the dashboard to work with real data.

## Mapbox Setup (Free Tier Available!)

Mapbox offers a **free tier** with 50,000 map loads per month, which is perfect for development and small projects.

### 1. Get a Mapbox Access Token

1. Go to [Mapbox](https://www.mapbox.com/) and sign up for a free account
2. Once logged in, go to your [Account page](https://account.mapbox.com/)
3. Scroll down to "Access tokens"
4. Copy your **Default public token** (or create a new one)

### 2. Add Access Token to HTML Files

Replace `YOUR_ACCESS_TOKEN` in the following files:
- `backend/public/dashboard.html` (around line 9-12)
- `backend/public/missions.html` (around line 9-12)
- `backend/public/drone-dashboard.html` (if you add maps there)

Example:
```html
<script>
  mapboxgl.accessToken = 'pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsbXh4eHh4eHh4In0.YOUR_ACTUAL_TOKEN';
</script>
```

### 3. Mapbox Free Tier Limits

- **50,000 map loads per month** (free)
- **100,000 geocoding requests per month** (free)
- Satellite imagery included
- No credit card required for free tier

### 4. Map Styles Available

The code uses Mapbox's satellite imagery by default. You can change the style in `maps.js`:

- `satellite` - Satellite imagery (default)
- `streets` - Street map
- `outdoors` - Outdoor/topographic map
- `dark` - Dark theme
- `light` - Light theme

## Backend API Endpoints

The backend already provides API endpoints for dashboard data:

### Available Endpoints

- `GET /api/dashboard/overview` - Dashboard overview statistics
- `GET /api/dashboard/drones` - Drone status and pollen levels
- `GET /api/dashboard/missions` - Mission data with locations
- `GET /api/dashboard/analytics` - Analytics data
- `GET /api/dashboard/alerts` - System alerts

### Testing the APIs

You can test the endpoints using curl:

```bash
# Get dashboard overview
curl http://localhost:3001/api/dashboard/overview

# Get drones data
curl http://localhost:3001/api/dashboard/drones

# Get missions data
curl http://localhost:3001/api/dashboard/missions
```

## Connecting to Real Data

### Current Implementation

The backend currently returns mock data. To connect to real data:

1. **Update `backend/server/controller/dashboardController.js`**:
   - Replace mock data with database queries
   - Connect to Arduino service for real-time drone data
   - Integrate with your CNN model for flower detection stats

2. **Example: Connect to Arduino Service**

```javascript
// In dashboardController.js
const arduinoService = require('../services/arduinoService');

async getDrones(req, res) {
  try {
    // Get real drone data from Arduino
    const drones = await arduinoService.getDroneStatus();
    res.json({ success: true, data: drones });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
```

3. **Example: Connect to Database**

```javascript
// In dashboardController.js
const db = require('../database/connection');

async getMissions(req, res) {
  try {
    const missions = await db.query('SELECT * FROM missions ORDER BY date DESC');
    res.json({ success: true, data: missions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
```

## Environment Variables

For production, use environment variables for API keys:

1. Create a `.env` file in the `backend` directory:
```
MAPBOX_ACCESS_TOKEN=your_access_token_here
```

2. Install `dotenv`:
```bash
npm install dotenv
```

3. Load in `server.js`:
```javascript
require('dotenv').config();
```

4. Create an API endpoint to serve the token securely (optional):
```javascript
// In server.js
app.get('/api/mapbox-token', (req, res) => {
  res.json({ token: process.env.MAPBOX_ACCESS_TOKEN });
});
```

Then in your HTML, fetch it:
```javascript
fetch('/api/mapbox-token')
  .then(res => res.json())
  .then(data => {
    mapboxgl.accessToken = data.token;
    initMap();
  });
```

## Security Notes

- **Never commit access tokens to version control**
- Use environment variables for sensitive data
- For production, consider using scoped tokens with limited permissions
- Monitor usage in Mapbox account dashboard
- Rotate tokens regularly

## Troubleshooting

### Mapbox not loading
- Check browser console for errors
- Verify access token is correct
- Ensure Mapbox GL JS script is loaded
- Check network tab for failed requests

### API endpoints returning errors
- Check backend server is running
- Verify endpoint URLs are correct
- Check browser console for CORS errors
- Ensure backend routes are properly registered

### Data not updating
- Check browser console for JavaScript errors
- Verify API responses are successful
- Check network tab for failed requests
- Ensure data attributes are correctly set in HTML

### Geocoding not working
- Verify your Mapbox access token has geocoding permissions
- Check that the token is set before calling searchLocation
- Ensure you're using the correct API endpoint format

## Mapbox vs Google Maps

### Why Mapbox?
- ✅ **Free tier**: 50,000 map loads/month
- ✅ **No credit card required**
- ✅ **Beautiful, customizable maps**
- ✅ **Great documentation**
- ✅ **Open source friendly**

### When to use Google Maps?
- If you need more than 50,000 map loads/month
- If you need specific Google services (Street View, etc.)
- If you already have a Google Cloud account with credits
