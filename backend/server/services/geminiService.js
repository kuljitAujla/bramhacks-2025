/**
 * Gemini AI Service for analyzing geojson coordinates
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Set up Gemini API
const GEMINI_API_KEY = "AIzaSyCynRlcGr5Uys3CXRw5RPttjSH8NJa-awo";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Calculate the area of a polygon using shoelace formula
 */
function calculatePolygonArea(coordinates) {
  if (coordinates.length < 3) {
    return 0.0;
  }
  
  let area = 0.0;
  const n = coordinates.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i][0] * coordinates[j][1];
    area -= coordinates[j][0] * coordinates[i][1];
  }
  return Math.abs(area) / 2.0;
}

/**
 * Get the center coordinates of a polygon
 */
function getCenterCoordinates(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    return [0, 0];
  }
  
  const lons = coordinates.map(coord => coord[0]);
  const lats = coordinates.map(coord => coord[1]);
  return [
    lons.reduce((a, b) => a + b, 0) / lons.length,
    lats.reduce((a, b) => a + b, 0) / lats.length
  ];
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(coord1, coord2) {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Simple grouping algorithm - groups coordinates within 0.5 km of each other
 */
function groupCoordinatesSimple(coordinateData) {
  const groups = [];
  const used = new Set();
  
  // Filter out very small areas that might be buildings
  const filteredData = coordinateData.filter(
    c => (c.area || 0) > 0.0000001
  );
  
  for (let i = 0; i < filteredData.length; i++) {
    if (used.has(i)) continue;
    
    const group = [filteredData[i]];
    used.add(i);
    const center1 = filteredData[i].center;
    
    for (let j = i + 1; j < filteredData.length; j++) {
      if (used.has(j)) continue;
      
      const center2 = filteredData[j].center;
      const distance = calculateDistance(center1, center2);
      
      if (distance < 2.0) { // Within 2 km (increased from 0.5 km for bigger groups)
        group.push(filteredData[j]);
        used.add(j);
      }
    }
    
    if (group.length > 0) {
      // Calculate group center
      const groupCenters = group.map(c => c.center);
      const groupLons = groupCenters.map(c => c[0]);
      const groupLats = groupCenters.map(c => c[1]);
      const groupCenter = [
        groupLons.reduce((a, b) => a + b, 0) / groupLons.length,
        groupLats.reduce((a, b) => a + b, 0) / groupLats.length
      ];
      
      // Create a bounding box for the group
      const allLons = [];
      const allLats = [];
      
      for (const coordData of group) {
        if (coordData.coordinates && coordData.coordinates.length > 0) {
          for (const coord of coordData.coordinates) {
            if (coord.length >= 2) {
              allLons.push(coord[0]);
              allLats.push(coord[1]);
            }
          }
        } else {
          const [lon, lat] = coordData.center;
          allLons.push(lon);
          allLats.push(lat);
        }
      }
      
      let boundingBox;
      if (allLons.length > 0 && allLats.length > 0) {
        const minLon = Math.min(...allLons);
        const maxLon = Math.max(...allLons);
        const minLat = Math.min(...allLats);
        const maxLat = Math.max(...allLats);
        
        // Add padding (5% of the size)
        const lonPadding = (maxLon - minLon) > 0 ? (maxLon - minLon) * 0.05 : 0.001;
        const latPadding = (maxLat - minLat) > 0 ? (maxLat - minLat) * 0.05 : 0.001;
        
        boundingBox = [
          [minLon - lonPadding, minLat - latPadding],
          [maxLon + lonPadding, minLat - latPadding],
          [maxLon + lonPadding, maxLat + latPadding],
          [minLon - lonPadding, maxLat + latPadding],
          [minLon - lonPadding, minLat - latPadding], // Close the polygon
        ];
      } else {
        // Fallback: create a small square around center
        const [lon, lat] = groupCenter;
        const size = 0.001;
        boundingBox = [
          [lon - size, lat - size],
          [lon + size, lat - size],
          [lon + size, lat + size],
          [lon - size, lat + size],
          [lon - size, lat - size],
        ];
      }
      
      groups.push({
        coordinates: boundingBox,
        center: groupCenter,
        coordinateData: group, // Store original data for reference
      });
    }
  }
  
  return groups;
}

/**
 * Analyze coordinates with Gemini AI
 */
async function analyzeCoordinatesWithGemini(geojsonData) {
  const features = geojsonData.features || [];
  
  // Prepare data for Gemini - extract coordinates and areas
  const coordinateData = [];
  for (let idx = 0; idx < features.length; idx++) {
    const feature = features[idx];
    if (feature.geometry && feature.geometry.type === "Polygon") {
      const coords = feature.geometry.coordinates[0];
      const center = getCenterCoordinates(coords);
      const area = calculatePolygonArea(coords);
      
      coordinateData.push({
        id: idx,
        center: center,
        area: area,
        coordinates: coords
      });
    }
  }
  
  // First, do simple grouping to reduce the number of coordinates to analyze
  const groupedData = groupCoordinatesSimple(coordinateData);
  
    // Limit to first 10 groups for analysis (we want 10 missions total)
    const limitedGroupedData = groupedData.slice(0, 10);
    
    // Prepare summary data for Gemini (use first 10 groups)
    const summaryData = [];
    for (let idx = 0; idx < limitedGroupedData.length; idx++) {
      const group = limitedGroupedData[idx];
      const coordDataList = group.coordinateData || [];
      const totalArea = coordDataList.reduce((sum, c) => sum + (c.area || 0), 0);
      summaryData.push({
        index: idx,
        center: group.center,
        area: totalArea,
        count: coordDataList.length,
      });
    }
  
    // Create prompt for Gemini
    const prompt = `
I have analyzed ${coordinateData.length} polygons representing areas of vegetation change and grouped them into ${limitedGroupedData.length} potential mission areas.

Here are the center coordinates of ${summaryData.length} groups (longitude, latitude):
${JSON.stringify(summaryData, null, 2)}

Please analyze these coordinates and classify each group into one of these categories:
1. "near_trail" - Areas near hiking trails, walking paths, or recreational trails
2. "near_water" - Areas near rivers, lakes, streams, or other water bodies
3. "small_grouped" - Small areas that are grouped together (not near trails or water, but suitable for planting)

IMPORTANT: Exclude any coordinates that are clearly on top of buildings or in dense urban areas.

Return a JSON response with this structure:
{
    "classifications": [
        {
            "index": 0,
            "reason": "near_trail" | "near_water" | "small_grouped",
            "description": "Brief description of why this is a good planting location"
        }
    ]
}

Only classify groups that are suitable for planting (not on buildings).
Return ONLY valid JSON, no other text.
`;
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();
    
    // Remove markdown code blocks if present
    if (responseText.startsWith("```json")) {
      responseText = responseText.substring(7);
    }
    if (responseText.startsWith("```")) {
      responseText = responseText.substring(3);
    }
    if (responseText.endsWith("```")) {
      responseText = responseText.substring(0, responseText.length - 3);
    }
    responseText = responseText.trim();
    
    const resultData = JSON.parse(responseText);
    const classifications = resultData.classifications || [];
    
    // Apply classifications to groups (only process the limited 10)
    const finalGroups = [];
    for (let idx = 0; idx < limitedGroupedData.length; idx++) {
      const group = limitedGroupedData[idx];
      const classification = classifications.find(c => c.index === idx);
      
      if (classification) {
        finalGroups.push({
          id: idx + 1,
          coordinates: group.coordinates,
          center: group.center,
          reason: classification.reason || "small_grouped",
          description: classification.description || `Mission area ${idx + 1}`
        });
      } else {
        // Default to small_grouped if no classification
        finalGroups.push({
          id: idx + 1,
          coordinates: group.coordinates,
          center: group.center,
          reason: "small_grouped",
          description: `Grouped mission area ${idx + 1}`
        });
      }
    }
    
    // Return exactly 10 missions (or fewer if we don't have 10)
    return finalGroups;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    console.error("Response text:", error.message);
    // Fallback: simple grouping by proximity, limit to 10
    return groupedData.slice(0, 10).map((group, idx) => ({
      id: idx + 1,
      coordinates: group.coordinates,
      center: group.center,
      reason: "small_grouped",
      description: `Grouped mission area ${idx + 1}`
    }));
  }
}

/**
 * Process a geojson file and return mission groups
 */
async function processGeojsonForMissions(geojsonPath) {
  try {
    const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
    return await analyzeCoordinatesWithGemini(geojsonData);
  } catch (error) {
    console.error("Error processing geojson:", error);
    throw error;
  }
}

module.exports = {
  processGeojsonForMissions,
  analyzeCoordinatesWithGemini,
};

