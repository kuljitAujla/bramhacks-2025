// Mapbox integration
let map;
let markers = [];
let popups = [];

// Initialize Mapbox map
function initMap(containerId, options = {}) {
  // Default options
  const defaultOptions = {
    container: containerId,
    style: 'mapbox://styles/mapbox/satellite-v9', // Satellite imagery
    center: [-79.3832, 43.6532], // Toronto default [lng, lat]
    zoom: 13,
    pitch: 0,
    bearing: 0
  };

  // Merge with provided options
  const mapOptions = { ...defaultOptions, ...options };

  // Initialize map
  map = new mapboxgl.Map(mapOptions);

  // Add navigation controls (zoom, rotation, pitch)
  map.addControl(new mapboxgl.NavigationControl(), 'top-right');

  // Add geolocate control
  const geolocate = new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true
  });
  map.addControl(geolocate, 'bottom-right');

  // Add fullscreen control
  map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

  // Wait for map to load
  map.on('load', () => {
    console.log('Map loaded successfully');
  });

  return map;
}

// Add marker to map
function addMarker(position, title, info = '') {
  // Create a DOM element for the marker
  const el = document.createElement('div');
  el.className = 'custom-marker';
  el.style.width = '32px';
  el.style.height = '32px';
  el.style.borderRadius = '50%';
  el.style.backgroundColor = '#13ecb6';
  el.style.border = '3px solid #10221d';
  el.style.cursor = 'pointer';
  el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
  
  // Create inner circle
  const inner = document.createElement('div');
  inner.style.width = '12px';
  inner.style.height = '12px';
  inner.style.borderRadius = '50%';
  inner.style.backgroundColor = '#10221d';
  inner.style.margin = '8px auto';
  el.appendChild(inner);

  // Create marker
  const marker = new mapboxgl.Marker(el)
    .setLngLat([position.lng, position.lat])
    .addTo(map);

  // Add popup if info provided
  if (info) {
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`<div style="padding: 8px;"><strong>${title}</strong><br>${info}</div>`);
    
    marker.setPopup(popup);
    popups.push(popup);
  }

  markers.push(marker);
  return marker;
}

// Clear all markers
function clearMarkers() {
  markers.forEach(marker => marker.remove());
  markers = [];
  popups.forEach(popup => popup.remove());
  popups = [];
}

// Search for location using Mapbox Geocoding API
async function searchLocation(query, accessToken) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${accessToken}&limit=1`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        location: {
          lng: feature.center[0],
          lat: feature.center[1]
        },
        formattedAddress: feature.place_name
      };
    } else {
      throw new Error('Location not found');
    }
  } catch (error) {
    throw new Error('Geocoding failed: ' + error.message);
  }
}

// Draw polygon on map (for mission areas)
function drawPolygon(coordinates, options = {}) {
  const defaultOptions = {
    'fill-color': '#13ecb6',
    'fill-opacity': 0.2,
    'line-color': '#13ecb6',
    'line-opacity': 0.8,
    'line-width': 2
  };

  const sourceId = 'polygon-' + Date.now();
  const layerId = 'polygon-layer-' + Date.now();

  // Add source
  map.addSource(sourceId, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    }
  });

  // Add layer
  map.addLayer({
    id: layerId,
    type: 'fill',
    source: sourceId,
    paint: {
      ...defaultOptions,
      ...options
    }
  });

  // Add outline
  map.addLayer({
    id: layerId + '-outline',
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': '#13ecb6',
      'line-opacity': 0.8,
      'line-width': 2
    }
  });

  return { sourceId, layerId };
}

// Fit map to bounds
function fitMapToBounds(positions) {
  if (!positions || positions.length === 0) return;

  const bounds = new mapboxgl.LngLatBounds();
  positions.forEach(pos => {
    bounds.extend([pos.lng, pos.lat]);
  });

  map.fitBounds(bounds, {
    padding: 50
  });
}

// Set map style
function setMapStyle(style) {
  const styles = {
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    streets: 'mapbox://styles/mapbox/streets-v12',
    outdoors: 'mapbox://styles/mapbox/outdoors-v12',
    dark: 'mapbox://styles/mapbox/dark-v11',
    light: 'mapbox://styles/mapbox/light-v11'
  };

  if (styles[style]) {
    map.setStyle(styles[style]);
  }
}
