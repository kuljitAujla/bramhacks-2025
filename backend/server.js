const express = require('express');
const cors = require('cors');
const path = require('path');
const pollinationRoutes = require('./server/routes/pollinationRoutes');
const cameraRoutes = require('./server/routes/cameraRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (camera interface)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/pollination', pollinationRoutes);
app.use('/api/camera', cameraRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Pollination API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Pollination API: http://localhost:${PORT}/api/pollination`);
  console.log(`Camera API: http://localhost:${PORT}/api/camera`);
  console.log(`Camera Interface: http://localhost:${PORT}/camera.html`);
  console.log(`Dashboard: http://localhost:${PORT}/dashboard.html`);
  console.log(`Analytics: http://localhost:${PORT}/analytics.html`);
  console.log(`Missions: http://localhost:${PORT}/missions.html`);
  console.log(`Drone Dashboard: http://localhost:${PORT}/drone-dashboard.html`);
  console.log(`Drone Dashboard Alt: http://localhost:${PORT}/drone-dashboard-alt.html`);
  console.log(`Alerts: http://localhost:${PORT}/alerts.html`);
});

module.exports = app;

