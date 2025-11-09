import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWtzaGFqIiwiYSI6ImNtYnFvNmlqdTAxZjYya3B2cjk1ZGcxY2gifQ.Vdbp5BETedcYHmoZuTJgrQ';
mapboxgl.accessToken = MAPBOX_TOKEN;

// API functions
const fetchDrones = async () => {
  const response = await fetch(`${API_BASE_URL}/dashboard/drones`);
  if (!response.ok) throw new Error('Failed to fetch drones');
  return response.json();
};

const fetchLiveMissions = async () => {
  const response = await fetch(`${API_BASE_URL}/dashboard/live-missions`);
  if (!response.ok) throw new Error('Failed to fetch live missions');
  return response.json();
};

// Format time helper
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function DroneDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrone, setSelectedDrone] = useState<any>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  const { data: dronesData, isLoading: dronesLoading } = useQuery({
    queryKey: ['drones'],
    queryFn: fetchDrones,
    refetchInterval: 5000,
  });

  const { data: liveMissionsData } = useQuery({
    queryKey: ['live-missions'],
    queryFn: fetchLiveMissions,
    refetchInterval: 5000,
  });

  const drones = dronesData?.data || [];
  const liveMissions = liveMissionsData?.data || [];

  // Select first active drone or first drone from list
  useEffect(() => {
    if (drones.length > 0 && !selectedDrone) {
      const activeDrone = drones.find((d: any) => d.status === 'active' || d.status === 'pollinating') || drones[0];
      setSelectedDrone(activeDrone);
    }
  }, [drones, selectedDrone]);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [-90.0703, 29.9511], // New Orleans coordinates
      zoom: 13,
    });

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when drones change
  useEffect(() => {
    if (!map.current || !drones.length) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add markers for each drone
    drones.forEach((drone: any) => {
      if (!drone.location || typeof drone.location !== 'object') return;

      const { lat, lng } = drone.location;
      if (!lat || !lng) return;

      // Determine marker color based on status
      const getMarkerColor = (status: string) => {
        switch (status?.toLowerCase()) {
          case 'active':
          case 'pollinating':
            return '#10b981'; // green
          case 'idle':
            return '#64748b'; // gray
          case 'error':
            return '#ef4444'; // red
          default:
            return '#3b82f6'; // blue
        }
      };

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = getMarkerColor(drone.status);
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-sm text-gray-900">${drone.name || drone.id}</h3>
          <p class="text-xs text-gray-600">Status: ${drone.status}</p>
          ${drone.batteryLevel ? `<p class="text-xs text-gray-600">Battery: ${drone.batteryLevel}%</p>` : ''}
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);

      // Add click handler to select drone
      el.addEventListener('click', () => {
        setSelectedDrone(drone);
      });

      markers.current.push(marker);
    });

    // Fit map to show all markers if there are any
    if (markers.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.current.forEach((marker) => {
        const lngLat = marker.getLngLat();
        bounds.extend([lngLat.lng, lngLat.lat]);
      });
      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 400 }, // Extra padding for sidebar
        maxZoom: 15,
      });
    }
  }, [drones]);

  // Default drone data if API returns empty
  const displayDrone = selectedDrone || {
    id: 'Alpha-07',
    name: 'Drone Alpha-07',
    status: 'pollinating',
    location: 'Pollinating Zone B',
    batteryLevel: 82,
    flightTime: 2539, // seconds (42:19)
    pollinations: 1248,
    flowersDetected: 15,
    liveFeed: true,
  };

  const activeLiveMission = liveMissions.find((m: any) => m.droneId === displayDrone.id) || liveMissions[0];

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 px-6 py-3 absolute top-0 left-0 right-0 z-20 bg-background-dark/80 backdrop-blur-sm">
        <div className="flex items-center gap-4 text-white">
          <div className="size-6 text-primary">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">DronePollinate</h2>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-9">
            <a
              className="text-white/70 hover:text-white text-sm font-medium leading-normal"
              href="/dashboard"
            >
              Dashboard
            </a>
            <a
              className="text-white/70 hover:text-white text-sm font-medium leading-normal"
              href="/missions"
            >
              Mission Planner
            </a>
            <a
              className="text-white/70 hover:text-white text-sm font-medium leading-normal"
              href="/analytics"
            >
              Data & Analytics
            </a>
            <a
              className="text-white/70 hover:text-white text-sm font-medium leading-normal"
              href="/alerts"
            >
              Alerts
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-white/10 hover:bg-white/20 text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5">
              <span className="material-symbols-outlined text-white text-xl">notifications</span>
            </button>
            <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-white/10 hover:bg-white/20 text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5">
              <span className="material-symbols-outlined text-white text-xl">help</span>
            </button>
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAhOn3a9b19qmbOS7UqvZpJXxxpJnSLohLheSDU3-mZtWHKmxn9-FV7eZyUZUBygVUvZqk_bmHl9M47t2PlKfA6LwvOuQ8c3Qje1MjNQqkWwhqrhuDORALy24YWsnWqEhmMEGub8INGsvGOneozkRiJhQWNVI4SHzmtKoNvbSqxrqDw5Qb9a1lzAu1F4O0Zal4GZkqbIm9J7aPdooJN0C06tfqnqfzNtUmmklAwB7teY8yy0xrHHij2AuMD3M-SbL7Bhk03Qjnar5U")',
              }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 flex relative pt-14">
        {/* Map Section */}
        <div className="flex-1 h-full">
          <div className="bg-cover bg-center flex h-full min-h-[320px] flex-1 flex-col justify-between p-4 relative">
            {/* Mapbox Map */}
            <div ref={mapContainer} className="absolute inset-0" style={{ minHeight: '100%' }}></div>

            {/* Search Bar */}
            <label className="flex flex-col min-w-40 h-12 max-w-sm relative z-10">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                <div className="text-[#92c9bb] flex border-none bg-[#19332d]/80 backdrop-blur-sm items-center justify-center pl-4 rounded-l-lg border-r-0">
                  <span className="material-symbols-outlined text-2xl">search</span>
                </div>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg text-white focus:outline-0 focus:ring-0 border-none bg-[#19332d]/80 backdrop-blur-sm focus:border-none h-full placeholder:text-[#92c9bb] px-4 text-base font-normal leading-normal"
                  placeholder="Search for a location or drone ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </label>

            {/* Map Controls */}
            <div className="flex items-end justify-between w-full relative z-10">
              <div className="flex gap-2">
                <button className="flex items-center justify-center gap-2 rounded-lg bg-[#19332d]/80 backdrop-blur-sm shadow-lg px-4 h-10 text-white text-sm hover:bg-[#19332d]">
                  <span className="material-symbols-outlined text-lg">layers</span>
                  Layers
                </button>
                <button className="flex items-center justify-center gap-2 rounded-lg bg-[#19332d]/80 backdrop-blur-sm shadow-lg px-4 h-10 text-white text-sm hover:bg-[#19332d]">
                  <span className="material-symbols-outlined text-lg">legend_toggle</span>
                  Legend
                </button>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => map.current?.zoomIn()}
                    className="flex size-10 items-center justify-center rounded-t-lg bg-[#19332d]/80 backdrop-blur-sm shadow-lg hover:bg-[#19332d]"
                  >
                    <span className="material-symbols-outlined text-white text-2xl">add</span>
                  </button>
                  <button
                    onClick={() => map.current?.zoomOut()}
                    className="flex size-10 items-center justify-center rounded-b-lg bg-[#19332d]/80 backdrop-blur-sm shadow-lg hover:bg-[#19332d]"
                  >
                    <span className="material-symbols-outlined text-white text-2xl">remove</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (map.current && navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((position) => {
                        map.current?.flyTo({
                          center: [position.coords.longitude, position.coords.latitude],
                          zoom: 14,
                        });
                      });
                    }
                  }}
                  className="flex size-10 items-center justify-center rounded-lg bg-[#19332d]/80 backdrop-blur-sm shadow-lg hover:bg-[#19332d]"
                >
                  <span className="material-symbols-outlined text-white text-2xl">navigation</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full max-w-sm bg-background-dark/80 backdrop-blur-sm border-l border-white/10 shadow-2xl h-full flex flex-col absolute right-0 top-0 bottom-0 z-10 pt-14">
          <div className="flex h-full flex-col justify-between p-4 overflow-y-auto">
            <div className="flex flex-col gap-4">
              {/* Drone Info */}
              <div className="flex gap-3">
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-primary"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCoJvioz_TrvLOyl-2Jpk6pmMkq3sHTRaJ4M09SS7VfIoJlC5Ebu1Bvjb0vpeOEu12-4pwRFtOZ3g7bvm93GcWsfnuce1CUlpBbwZlhV4b_HxiwUtQTQrBl1IrpZzS8KvWDk_PCUmDsT8_dfGOYNhMwiK7zGA452rTGel-OWuZdY5dZV9Ocw0mG2oKQq8uZj8f2nNaiMcn_C8wRb-mtv6pT5jvwNnfk-3L4T7q7OwAzFpitWdEuxV65_j5_CE0DK1v2Nrpxww5TcVw")',
                  }}
                />
                <div className="flex flex-col">
                  <h1 className="text-white text-base font-medium leading-normal">
                    {displayDrone.name || `Drone ${displayDrone.id}`}
                  </h1>
                  <p className="text-[#92c9bb] text-sm font-normal leading-normal">
                    Status: <span className="text-primary capitalize">{displayDrone.status}</span>
                  </p>
                </div>
              </div>

              {/* Live Feed */}
              <div className="relative flex items-center justify-center bg-cover bg-center aspect-video rounded-lg overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA7JXoxf8MJv_5qiYHZYwyzgWurFJrO5NGN61rARKI-3RnKwBfVVrdUsmej59vv3zyp_6ZJkqTeOUVIZxecAs-zrUV1kCddWjXf8rnTK67VpFI7Z8TriB981g16wvTH3bTTNHCYAUKyCSP_3nBiURsSoPa2NH2DunWu0s_0Nx7S4Zy4piGO2NLLx-AGmsA0NpQv_qQSyoiwfZ6bu89vArlco9UG1BTDtZR4DDWK_j51Q9pz1_BmyiOXETVQtNWqJbUBE0VG9peGioI")',
                  }}
                />
                <button className="flex shrink-0 items-center justify-center rounded-full size-12 bg-black/40 text-white hover:bg-black/60 z-10">
                  <span className="material-symbols-outlined text-inherit text-3xl">play_arrow</span>
                </button>
                {displayDrone.liveFeed && (
                  <div className="absolute top-2 left-2 bg-red-600/80 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 rounded-lg p-4 border border-white/10 bg-white/5">
                  <p className="text-white/70 text-sm font-medium leading-normal">Pollinations This Session</p>
                  <p className="text-white tracking-light text-2xl font-bold leading-tight">
                    {displayDrone.pollinations || activeLiveMission?.pollinations || 1248}
                  </p>
                </div>
                <div className="flex flex-col gap-1 rounded-lg p-4 border border-white/10 bg-white/5">
                  <p className="text-white/70 text-sm font-medium leading-normal">Flowers Detected</p>
                  <p className="text-white tracking-light text-2xl font-bold leading-tight">
                    {displayDrone.flowersDetected || activeLiveMission?.flowersDetected || 15}
                  </p>
                </div>
                <div className="flex flex-col gap-1 rounded-lg p-4 border border-white/10 bg-white/5">
                  <p className="text-white/70 text-sm font-medium leading-normal">Flight Time</p>
                  <p className="text-white tracking-light text-2xl font-bold leading-tight">
                    {displayDrone.flightTime
                      ? formatTime(displayDrone.flightTime)
                      : activeLiveMission?.flightTime
                      ? formatTime(activeLiveMission.flightTime)
                      : '00:42:19'}
                  </p>
                </div>
                <div className="flex flex-col gap-1 rounded-lg p-4 border border-white/10 bg-white/5">
                  <p className="text-white/70 text-sm font-medium leading-normal">Battery</p>
                  <p className="text-white tracking-light text-2xl font-bold leading-tight flex items-center gap-2">
                    {displayDrone.batteryLevel || activeLiveMission?.batteryLevel || 82}%
                    <span className="material-symbols-outlined text-green-400">battery_5_bar</span>
                  </p>
                </div>
              </div>

              {/* Action Links */}
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/20">
                <span className="material-symbols-outlined text-primary text-2xl">videocam</span>
                <p className="text-primary text-sm font-medium leading-normal">Live Feed</p>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <span className="material-symbols-outlined text-white text-2xl">info</span>
                <p className="text-white text-sm font-medium leading-normal">Details</p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col gap-4">
              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary hover:bg-primary/90 text-background-dark text-sm font-bold leading-normal tracking-[0.015em]">
                <span className="truncate">View Mission Details</span>
              </button>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
                  <span className="material-symbols-outlined text-white text-2xl">settings</span>
                  <p className="text-white text-sm font-medium leading-normal">Drone Settings</p>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
                  <span className="material-symbols-outlined text-white text-2xl">gamepad</span>
                  <p className="text-white text-sm font-medium leading-normal">Manual Override</p>
                </div>
              </div>
              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-bold leading-normal tracking-[0.015em]">
                <span className="truncate">Return to Base</span>
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

