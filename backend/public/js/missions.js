// Missions page functionality
let missionsMap = null;
let missionsData = [];

async function loadMissionsData() {
  try {
    const response = await DashboardAPI.getMissions();
    if (response.success) {
      missionsData = response.data;
      updateMissionsList();
      updateMap();
    }
  } catch (error) {
    console.error('Error loading missions data:', error);
  }
}

function updateMissionsList() {
  // This will be handled by the existing HTML structure
  // You can enhance this to dynamically update the mission list
}

function updateMap() {
  if (!missionsMap || !mapboxgl) return;

  // Clear existing markers
  clearMarkers();

  // Add markers for each mission
  const positions = [];
  missionsData.forEach(mission => {
    if (mission.location) {
      addMarker(
        mission.location,
        `Mission #${mission.id}`,
        `${mission.name}<br>${mission.date} ${mission.time}`
      );
      positions.push(mission.location);
    }
  });

  // Fit map to show all markers
  if (positions.length > 0) {
    fitMapToBounds(positions);
  }
}

// Initialize map when page loads
function initMissionsMap() {
  if (!mapboxgl || !mapboxgl.accessToken) {
    console.error('Mapbox GL JS not loaded or access token not set');
    return;
  }

  missionsMap = initMap('map', {
    center: [-79.3832, 43.6532], // Toronto [lng, lat]
    zoom: 12,
    style: 'mapbox://styles/mapbox/satellite-v9'
  });

  // Load missions data after map loads
  missionsMap.on('load', () => {
    loadMissionsData();
  });
}

// Wait for Mapbox to load
if (window.mapboxgl && mapboxgl.accessToken) {
  initMissionsMap();
} else {
  // Wait a bit for scripts to load
  window.addEventListener('load', () => {
    if (window.mapboxgl && mapboxgl.accessToken) {
      initMissionsMap();
    } else {
      console.error('Mapbox GL JS not loaded. Make sure to set mapboxgl.accessToken.');
    }
  });
}

// Search functionality
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('input[placeholder*="Search"]');
  if (searchInput && mapboxgl && mapboxgl.accessToken) {
    searchInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        try {
          const result = await searchLocation(searchInput.value, mapboxgl.accessToken);
          if (missionsMap) {
            missionsMap.flyTo({
              center: [result.location.lng, result.location.lat],
              zoom: 15
            });
            addMarker(result.location, 'Search Result', result.formattedAddress);
          }
        } catch (error) {
          console.error('Error searching location:', error);
          alert('Location not found. Please try a different search term.');
        }
      }
    });
  }
});
