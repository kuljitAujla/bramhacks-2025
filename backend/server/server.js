/**
 * Express server for NDVI analysis and Gemini AI integration
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { processGeojsonForMissions } = require('./services/geminiService');

const app = express();
app.use(cors()); // Enable CORS for frontend
app.use(express.json());

// Paths
const BASE_DIR = __dirname;
const DATA_DIR = path.join(BASE_DIR, 'ndviAnalysis', 'data', 'outputs');

console.log('BASE_DIR:', BASE_DIR);
console.log('DATA_DIR:', DATA_DIR);
console.log('DATA_DIR exists:', fs.existsSync(DATA_DIR));

app.get('/api/missions/all', async (req, res) => {
  try {
    const decreasePath = path.join(DATA_DIR, 'decrease.geojson');
    const increasePath = path.join(DATA_DIR, 'increase.geojson');
    
    if (!fs.existsSync(decreasePath) || !fs.existsSync(increasePath)) {
      return res.status(404).json({ error: 'GeoJSON files not found' });
    }
    
    // Process both files
    const [decreaseMissions, increaseMissions] = await Promise.all([
      processGeojsonForMissions(decreasePath),
      processGeojsonForMissions(increasePath),
    ]);
    
    // Combine all missions and limit to first 10
    const allMissions = [...decreaseMissions, ...increaseMissions].slice(0, 10);
    
    // Re-number the missions to have sequential IDs
    const missionsWithSequentialIds = allMissions.map((mission, idx) => ({
      ...mission,
      id: idx + 1,
    }));
    
    return res.json({ missions: missionsWithSequentialIds });
  } catch (error) {
    console.error('Error processing missions:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/missions/decrease', async (req, res) => {
  try {
    const geojsonPath = path.join(DATA_DIR, 'decrease.geojson');
    if (!fs.existsSync(geojsonPath)) {
      return res.status(404).json({ error: 'decrease.geojson not found' });
    }
    
    const missions = await processGeojsonForMissions(geojsonPath);
    return res.json({ missions });
  } catch (error) {
    console.error('Error processing decrease missions:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/missions/increase', async (req, res) => {
  try {
    const geojsonPath = path.join(DATA_DIR, 'increase.geojson');
    if (!fs.existsSync(geojsonPath)) {
      return res.status(404).json({ error: 'increase.geojson not found' });
    }
    
    const missions = await processGeojsonForMissions(geojsonPath);
    return res.json({ missions });
  } catch (error) {
    console.error('Error processing increase missions:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/data/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(DATA_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving file:', error);
    return res.status(404).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

