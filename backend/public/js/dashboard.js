// Dashboard page functionality
// API_BASE_URL is declared in api.js
let dashboardData = null;

async function loadDashboardData() {
  try {
    const response = await DashboardAPI.getOverview();
    if (response.success) {
      dashboardData = response.data;
      updateDashboardUI();
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

function updateDashboardUI() {
  if (!dashboardData) return;

  // Update stats
  const dronesActiveEl = document.querySelector('[data-stat="drones-active"]');
  if (dronesActiveEl) {
    dronesActiveEl.textContent = dashboardData.dronesActive;
  }

  const flowersPollinatedEl = document.querySelector('[data-stat="flowers-pollinated"]');
  if (flowersPollinatedEl) {
    flowersPollinatedEl.textContent = formatNumber(dashboardData.flowersPollinated);
  }

  const flowersChangeEl = document.querySelector('[data-stat="flowers-change"]');
  if (flowersChangeEl) {
    flowersChangeEl.textContent = formatPercent(dashboardData.flowersPollinatedChange);
  }

  const successRateEl = document.querySelector('[data-stat="success-rate"]');
  if (successRateEl) {
    successRateEl.textContent = `${dashboardData.successRate}%`;
  }

  const systemHealthEl = document.querySelector('[data-stat="system-health"]');
  if (systemHealthEl) {
    systemHealthEl.textContent = dashboardData.systemHealth.charAt(0).toUpperCase() + dashboardData.systemHealth.slice(1);
  }

  // Update last updated time
  const lastUpdatedEl = document.querySelector('[data-last-updated]');
  if (lastUpdatedEl) {
    lastUpdatedEl.textContent = `Last updated: ${formatDateTime(dashboardData.lastUpdated)}`;
  }

  // Load drone data
  loadDroneData();
  loadMissionsData();
  loadLiveMissionsData();
}

async function loadDroneData() {
  try {
    const response = await DashboardAPI.getDrones();
    if (response.success) {
      updateDroneUI(response.data);
    }
  } catch (error) {
    console.error('Error loading drone data:', error);
  }
}

function updateDroneUI(drones) {
  const container = document.querySelector('[data-drones-list]');
  if (!container) return;

  container.innerHTML = drones.map(drone => {
    const statusColor = drone.pollenLevel > 70 ? 'green' : drone.pollenLevel > 30 ? 'yellow' : 'red';
    return `
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-center">
          <p class="text-gray-600 dark:text-gray-300 text-sm font-medium">Drone #${drone.id}</p>
          <p class="text-gray-800 dark:text-white text-sm font-bold">${drone.pollenLevel}%</p>
        </div>
        <div class="w-full bg-gray-200 dark:bg-[#23483f] rounded-full h-2.5">
          <div class="bg-${statusColor}-500 h-2.5 rounded-full" style="width: ${drone.pollenLevel}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadMissionsData() {
  try {
    const response = await DashboardAPI.getMissions();
    if (response.success) {
      updateMissionsUI(response.data);
    }
  } catch (error) {
    console.error('Error loading missions data:', error);
  }
}

function updateMissionsUI(missions) {
  const container = document.querySelector('[data-missions-list]');
  if (!container) return;

  container.innerHTML = missions.map(mission => {
    const date = new Date(mission.date);
    const isToday = date.toDateString() === new Date().toDateString();
    const dateStr = isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    
    return `
      <div class="flex items-center gap-4">
        <div class="flex items-center justify-center size-12 rounded-lg bg-primary/20 text-primary">
          <span class="material-symbols-outlined text-3xl">event</span>
        </div>
        <div class="flex flex-col">
          <p class="text-gray-800 dark:text-white font-semibold">Mission #${mission.id}</p>
          <p class="text-gray-500 dark:text-gray-400 text-sm">${dateStr}, ${mission.time} - ${mission.name}</p>
        </div>
      </div>
    `;
  }).join('');
}

async function loadLiveMissionsData() {
  try {
    const response = await DashboardAPI.getLiveMissions();
    if (response.success) {
      updateLiveMissionsUI(response.data);
    }
  } catch (error) {
    console.error('Error loading live missions data:', error);
  }
}

function updateLiveMissionsUI(liveMissions) {
  const container = document.querySelector('[data-live-missions-list]');
  if (!container) return;

  if (!liveMissions || liveMissions.length === 0) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
        <span class="material-symbols-outlined text-4xl">flight</span>
        <p class="ml-4">No active missions</p>
      </div>
    `;
    return;
  }

  container.innerHTML = liveMissions.map((mission, index) => {
    const startTime = new Date(mission.startTime);
    const elapsed = Math.floor((new Date() - startTime) / 1000 / 60); // minutes
    const elapsedStr = `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`;
    
    const statusColor = mission.status === 'in-progress' ? 'green' : 'yellow';
    const statusText = mission.status === 'in-progress' ? 'In Progress' : mission.status;
    const cameraId = `camera-${mission.id}`;
    const cameraContainerId = `camera-container-${mission.id}`;
    
    return `
      <div class="flex flex-col gap-3 p-4 rounded-lg border border-gray-200 dark:border-[#23483f] bg-gray-50 dark:bg-[#19332d]">
        <div class="flex justify-between items-start">
          <div class="flex flex-col gap-1">
            <p class="text-gray-900 dark:text-white font-semibold text-base">${mission.name}</p>
            <p class="text-gray-600 dark:text-gray-400 text-sm">Mission #${mission.id} • Drone #${mission.droneId}</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 dark:bg-${statusColor}-900/50 text-${statusColor}-800 dark:text-${statusColor}-300">
            ${statusText}
          </span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="flex flex-col gap-1">
            <p class="text-gray-600 dark:text-gray-400 text-xs font-medium">Flowers Pollinated</p>
            <p class="text-gray-900 dark:text-white text-lg font-bold">${formatNumber(mission.flowersPollinated)}</p>
          </div>
          <div class="flex flex-col gap-1">
            <p class="text-gray-600 dark:text-gray-400 text-xs font-medium">Flowers Detected</p>
            <p class="text-gray-900 dark:text-white text-lg font-bold">${mission.flowersDetected}</p>
          </div>
          <div class="flex flex-col gap-1">
            <p class="text-gray-600 dark:text-gray-400 text-xs font-medium">Battery</p>
            <p class="text-gray-900 dark:text-white text-lg font-bold">${mission.batteryLevel}%</p>
          </div>
          <div class="flex flex-col gap-1">
            <p class="text-gray-600 dark:text-gray-400 text-xs font-medium">Flight Time</p>
            <p class="text-gray-900 dark:text-white text-lg font-bold">${mission.flightTime}</p>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <p class="text-gray-600 dark:text-gray-400 text-xs font-medium">Progress</p>
            <p class="text-gray-900 dark:text-white text-xs font-bold">${mission.progress}%</p>
          </div>
          <div class="w-full bg-gray-200 dark:bg-[#23483f] rounded-full h-2">
            <div class="bg-primary h-2 rounded-full transition-all duration-300" style="width: ${mission.progress}%"></div>
          </div>
        </div>
        <div class="flex justify-between items-center">
          <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 flex-1">
            <span>Started: ${formatDateTime(mission.startTime)}</span>
            <span>Est. completion: ${formatDateTime(mission.estimatedCompletion)}</span>
          </div>
          <button 
            onclick="toggleCameraFeed('${cameraId}', '${cameraContainerId}', '${mission.droneId}')" 
            class="ml-4 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-[#11221e] text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <span class="material-symbols-outlined text-lg">videocam</span>
            <span>Live Camera</span>
          </button>
        </div>
        <div id="${cameraContainerId}" class="hidden mt-2">
          <div class="relative rounded-lg overflow-hidden border border-gray-300 dark:border-[#23483f] bg-black">
            <video id="${cameraId}" autoplay playsinline class="w-full h-auto max-h-64 object-cover"></video>
            <div class="absolute top-2 left-2 bg-red-600/80 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              LIVE
            </div>
            <div class="absolute bottom-2 right-2 flex gap-2">
              <button 
                onclick="stopCameraFeed('${cameraId}', '${cameraContainerId}')" 
                class="px-3 py-1 bg-black/50 hover:bg-black/70 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Camera feed management
const activeCameraStreams = {};

function toggleCameraFeed(cameraId, containerId, droneId) {
  const container = document.getElementById(containerId);
  const video = document.getElementById(cameraId);
  
  if (container.classList.contains('hidden')) {
    // Show camera feed
    container.classList.remove('hidden');
    startCameraFeed(cameraId, droneId);
  } else {
    // Hide camera feed
    container.classList.add('hidden');
    stopCameraFeed(cameraId, containerId);
  }
}

async function startCameraFeed(cameraId, droneId) {
  const video = document.getElementById(cameraId);
  
  if (activeCameraStreams[cameraId]) {
    // Already streaming
    return;
  }

  try {
    // Request camera access
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // Prefer back camera (for phone)
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    video.srcObject = stream;
    activeCameraStreams[cameraId] = stream;

    // Start sending frames to backend
    startFrameCapture(cameraId, droneId);
  } catch (error) {
    console.error('Error accessing camera:', error);
    alert('Unable to access camera. Please check permissions.');
    
    // Hide camera container on error
    const containerId = cameraId.replace('camera-', 'camera-container-');
    const container = document.getElementById(containerId);
    if (container) {
      container.classList.add('hidden');
    }
  }
}

function stopCameraFeed(cameraId, containerId) {
  const video = document.getElementById(cameraId);
  const stream = activeCameraStreams[cameraId];

  if (stream) {
    // Stop all tracks
    stream.getTracks().forEach(track => track.stop());
    delete activeCameraStreams[cameraId];
  }

  if (video) {
    video.srcObject = null;
  }

  // Stop frame capture
  if (frameCaptureIntervals[cameraId]) {
    clearInterval(frameCaptureIntervals[cameraId]);
    delete frameCaptureIntervals[cameraId];
  }
}

// Frame capture intervals
const frameCaptureIntervals = {};

function startFrameCapture(cameraId, droneId) {
  const video = document.getElementById(cameraId);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Capture and send frames every 2 seconds
  frameCaptureIntervals[cameraId] = setInterval(async () => {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          const formData = new FormData();
          formData.append('image', blob, 'frame.jpg');
          formData.append('droneId', droneId);
          formData.append('width', video.videoWidth);
          formData.append('height', video.videoHeight);

          try {
            // Send frame to backend
            const response = await fetch(`${API_BASE_URL}/camera/frame`, {
              method: 'POST',
              body: formData
            });

            if (response.ok) {
              const data = await response.json();
              // Process classification results
              if (data.success) {
                console.log('Frame sent successfully for drone:', droneId);
                
                // Display classification results if available
                if (data.classification) {
                  const classification = data.classification;
                  console.log(`Classification: ${classification.class} (${(classification.confidence * 100).toFixed(1)}% confidence)`);
                  
                  // Update UI with classification result
                  updateClassificationUI(cameraId, classification);
                } else if (data.classificationError) {
                  console.warn('Classification error:', data.classificationError);
                }
              }
            }
          } catch (error) {
            console.error('Error sending frame:', error);
          }
        }
      }, 'image/jpeg', 0.8);
    }
  }, 2000); // Capture every 2 seconds
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
  // Refresh data every 30 seconds
  setInterval(loadDashboardData, 30000);
  // Refresh live missions every 5 seconds
  setInterval(loadLiveMissionsData, 5000);
});

// Update UI with classification results
function updateClassificationUI(cameraId, classification) {
  const video = document.getElementById(cameraId);
  if (!video) return;
  
  const container = video.closest('.relative');
  if (!container) return;
  
  // Remove existing classification indicator
  let indicator = container.querySelector('.classification-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'classification-indicator absolute top-2 right-2 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2 z-10';
    container.appendChild(indicator);
  }
  
  // Update indicator based on classification
  if (classification.isFlower) {
    indicator.className = 'classification-indicator absolute top-2 right-2 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2 z-10 bg-green-600/90 text-white';
    indicator.innerHTML = `
      <span class="material-symbols-outlined text-sm">local_florist</span>
      <span>Flower Detected (${(classification.confidence * 100).toFixed(0)}%)</span>
    `;
  } else {
    indicator.className = 'classification-indicator absolute top-2 right-2 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2 z-10 bg-gray-600/90 text-white';
    indicator.innerHTML = `
      <span class="material-symbols-outlined text-sm">close</span>
      <span>No Flower (${(classification.confidence * 100).toFixed(0)}%)</span>
    `;
  }
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    if (indicator) {
      indicator.style.opacity = '0';
      indicator.style.transition = 'opacity 0.5s';
      setTimeout(() => indicator.remove(), 500);
    }
  }, 3000);
}

// Make functions globally available
window.toggleCameraFeed = toggleCameraFeed;
window.stopCameraFeed = stopCameraFeed;

