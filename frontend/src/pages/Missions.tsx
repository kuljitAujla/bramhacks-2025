import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWtzaGFqIiwiYSI6ImNtYnFvNmlqdTAxZjYya3B2cjk1ZGcxY2gifQ.Vdbp5BETedcYHmoZuTJgrQ';
mapboxgl.accessToken = MAPBOX_TOKEN;

// API functions
const fetchMissions = async () => {
  const response = await fetch(`${API_BASE_URL}/dashboard/missions`);
  if (!response.ok) throw new Error('Failed to fetch missions');
  return response.json();
};

const fetchLiveMissions = async () => {
  const response = await fetch(`${API_BASE_URL}/dashboard/live-missions`);
  if (!response.ok) throw new Error('Failed to fetch live missions');
  return response.json();
};

// Format date helper
const formatDate = (dateString: string, time: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return `Today, ${time}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  }
};

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
    'in-progress': {
      bg: 'bg-green-100',
      text: 'text-green-800',
      darkBg: 'dark:bg-green-900',
      darkText: 'dark:text-green-300',
    },
    'scheduled': {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      darkBg: 'dark:bg-blue-900',
      darkText: 'dark:text-blue-300',
    },
    'completed': {
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      darkBg: 'dark:bg-slate-700',
      darkText: 'dark:text-slate-300',
    },
    'error': {
      bg: 'bg-red-100',
      text: 'text-red-800',
      darkBg: 'dark:bg-red-900',
      darkText: 'dark:text-red-300',
    },
  };

  const config = statusConfig[status.toLowerCase()] || statusConfig.scheduled;
  const statusText = status === 'in-progress' ? 'In-Progress' : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`text-xs font-medium ${config.bg} ${config.text} ${config.darkBg} ${config.darkText} px-2.5 py-1 rounded-full`}>
      {statusText}
    </span>
  );
}

export default function Missions() {
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  const { data: missionsData, isLoading: missionsLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: fetchMissions,
    refetchInterval: 30000,
  });

  const { data: liveMissionsData } = useQuery({
    queryKey: ['live-missions'],
    queryFn: fetchLiveMissions,
    refetchInterval: 5000,
  });

  const missions = missionsData?.data || [];
  const liveMissions = liveMissionsData?.data || [];
  const activeLiveMission = liveMissions.length > 0 ? liveMissions[0] : null;

  // Filter missions based on search
  const filteredMissions = missions.filter((mission: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      mission.id?.toLowerCase().includes(query) ||
      mission.name?.toLowerCase().includes(query)
    );
  });

  // Default missions if API returns empty
  const displayMissions = filteredMissions.length > 0 ? filteredMissions : [
    {
      id: 'UP-2024-001',
      name: 'Urban Park Pollination',
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM',
      status: 'in-progress',
      location: 'Central Park',
      locationName: 'Central Park',
    },
    {
      id: 'BG-2024-003',
      name: 'Botanical Gardens Run',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '9:00 AM',
      status: 'scheduled',
      location: 'Gardens Sector A',
      locationName: 'Gardens Sector A',
    },
    {
      id: 'CO-2024-015',
      name: 'Community Orchard',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      time: '2:00 PM',
      status: 'completed',
      location: 'West Orchard',
      locationName: 'West Orchard',
    },
    {
      id: 'RF-2024-009',
      name: 'Riverbank Flora',
      date: '2024-03-15',
      time: '11:00 AM',
      status: 'error',
      location: 'South Bank',
      locationName: 'South Bank',
    },
  ];

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [-90.0703, 29.9511], // New Orleans coordinates
      zoom: 12,
    });

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when missions change
  useEffect(() => {
    if (!map.current || !displayMissions.length) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add markers for each mission
    displayMissions.forEach((mission: any) => {
      if (!mission.location || typeof mission.location !== 'object') return;

      const { lat, lng } = mission.location;
      if (!lat || !lng) return;

      // Determine marker color based on status
      const getMarkerColor = (status: string) => {
        switch (status?.toLowerCase()) {
          case 'in-progress':
            return '#10b981'; // green
          case 'scheduled':
            return '#3b82f6'; // blue
          case 'completed':
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
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = getMarkerColor(mission.status);
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-sm text-gray-900">${mission.name}</h3>
          <p class="text-xs text-gray-600">ID: ${mission.id}</p>
          <p class="text-xs text-gray-600">Status: ${mission.status}</p>
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);

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
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 15,
      });
    }
  }, [displayMissions]);

  return (
    <div className="flex h-screen w-full">
      {/* SideNavBar */}
      <aside className="flex flex-col w-64 bg-background-light dark:bg-[#11221e] border-r border-slate-200 dark:border-slate-800">
        <div className="flex flex-col grow p-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-center px-2">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCCCYKkOWooc8vWVSYmgJqSmD7pM7NPN97C-hjwY0hrfyh_FIEMhK-Zm8yonC12IKYadi6U5eYkL8d9Ff8R9WJ84OZSl4wUa_LmHz1rLLFy49f_NFTabiz-CtWKb1dv9BKiiwNc4XYdaXGLXBh7HrQgl50KHRyOGkrISySMHSF9LpZTgNHExCkiLPaSHGJvdhmqWbSFa5wjQEn7HfLHlsOxi1OkreoPfpoiRdPWj5KImBPblz-5YDO6eHAyUFVSU_x9iQa8_87T9sE")',
                }}
              />
              <div className="flex flex-col">
                <h1 className="text-slate-800 dark:text-white text-base font-medium leading-normal">
                  Dr. Aris Thorne
                </h1>
                <p className="text-slate-500 dark:text-[#92c9bb] text-sm font-normal leading-normal">
                  Lead Researcher
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <a
                className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                href="/dashboard"
              >
                <span className="material-symbols-outlined">dashboard</span>
                <p className="text-sm font-medium leading-normal">Dashboard</p>
              </a>
              <a
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/20 dark:bg-[#23483f] text-primary dark:text-white"
                href="/missions"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  rocket_launch
                </span>
                <p className="text-sm font-medium leading-normal">Missions</p>
              </a>
              <a
                className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                href="/drone-dashboard"
              >
                <span className="material-symbols-outlined">flight</span>
                <p className="text-sm font-medium leading-normal">Drones</p>
              </a>
              <a
                className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                href="/analytics"
              >
                <span className="material-symbols-outlined">analytics</span>
                <p className="text-sm font-medium leading-normal">Analytics</p>
              </a>
              <a
                className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                href="/alerts"
              >
                <span className="material-symbols-outlined">warning</span>
                <p className="text-sm font-medium leading-normal">Alerts</p>
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-4 mt-auto">
            <button className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-background-dark text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">New Mission</span>
            </button>
            <div className="flex flex-col gap-1 border-t border-slate-200 dark:border-slate-800 pt-4">
              <a
                className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                href="#"
              >
                <span className="material-symbols-outlined">settings</span>
                <p className="text-sm font-medium leading-normal">Settings</p>
              </a>
              <a
                className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                href="#"
              >
                <span className="material-symbols-outlined">help</span>
                <p className="text-sm font-medium leading-normal">Help</p>
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-background-light dark:bg-background-dark">
          <h2 className="text-slate-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
            Missions
          </h2>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            </button>
            <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <span className="material-symbols-outlined">apps</span>
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Mission List Panel */}
          <div className="w-[380px] flex flex-col border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <label className="flex flex-col min-w-40 h-12 w-full">
                <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                  <div className="text-slate-500 dark:text-[#92c9bb] flex border-none bg-slate-100 dark:bg-[#23483f] items-center justify-center pl-4 rounded-l-lg border-r-0">
                    <span className="material-symbols-outlined">search</span>
                  </div>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-800 dark:text-white focus:outline-0 focus:ring-0 border-none bg-slate-100 dark:bg-[#23483f] focus:border-none h-full placeholder:text-slate-500 dark:placeholder:text-[#92c9bb] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                    placeholder="Search by mission name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </label>
            </div>
            <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
              {missionsLoading ? (
                <div className="flex items-center justify-center p-8 text-slate-500 dark:text-slate-400">
                  <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
                  <p className="ml-4">Loading missions...</p>
                </div>
              ) : (
                displayMissions.map((mission: any) => {
                  const isSelected = selectedMission === mission.id;
                  const isActive = mission.status === 'in-progress' || activeLiveMission?.id === mission.id;

                  return (
                    <div
                      key={mission.id}
                      onClick={() => setSelectedMission(mission.id)}
                      className={`p-4 cursor-pointer ${
                        isSelected || isActive
                          ? 'bg-primary/10 dark:bg-primary/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                          <p className="text-base font-semibold text-slate-800 dark:text-white">
                            {mission.name}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">ID: {mission.id}</p>
                        </div>
                        <StatusBadge status={mission.status} />
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base">calendar_today</span>
                          <span>{formatDate(mission.date, mission.time)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base">map</span>
                          <span>
                            {typeof mission.location === 'object' && mission.location !== null
                              ? mission.locationName || mission.name
                              : mission.location || mission.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Map Panel */}
          <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full z-10 p-4 bg-gradient-to-b from-black/20 to-transparent">
              <div className="flex justify-between gap-2">
                <div className="flex gap-2 p-1.5 bg-background-light dark:bg-[#11221e] rounded-lg shadow-lg">
                  <button className="p-2 text-slate-700 dark:text-white rounded-md bg-primary/20 dark:bg-primary/30">
                    <span className="material-symbols-outlined">draw</span>
                  </button>
                  <button className="p-2 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button className="p-2 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                  <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                  <button className="p-2 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md">
                    <span className="material-symbols-outlined">layers</span>
                  </button>
                </div>
                <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-primary text-[#11221e] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-4 shadow-lg">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    save
                  </span>
                  <span className="truncate">Save Area</span>
                </button>
              </div>
            </div>
            {/* Mapbox Map */}
            <div ref={mapContainer} className="flex-1" style={{ minHeight: '500px' }}></div>
            <div className="absolute right-4 bottom-4 flex flex-col items-end gap-3 z-10">
              <div className="flex flex-col gap-0.5 shadow-lg">
                <button
                  onClick={() => map.current?.zoomIn()}
                  className="flex size-10 items-center justify-center rounded-t-lg bg-background-light dark:bg-[#19332d] hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <span className="material-symbols-outlined text-slate-800 dark:text-white">add</span>
                </button>
                <button
                  onClick={() => map.current?.zoomOut()}
                  className="flex size-10 items-center justify-center rounded-b-lg bg-background-light dark:bg-[#19332d] hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <span className="material-symbols-outlined text-slate-800 dark:text-white">remove</span>
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
                className="flex size-10 items-center justify-center rounded-lg bg-background-light dark:bg-[#19332d] shadow-lg hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <span className="material-symbols-outlined text-slate-800 dark:text-white">my_location</span>
              </button>
            </div>
            {/* Live Data Card */}
            {activeLiveMission && (
              <div className="absolute left-4 bottom-4 w-80 bg-background-light dark:bg-background-dark/80 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 z-10">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">Live Mission Data</h3>
                  <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    ACTIVE
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{activeLiveMission.name}</p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex flex-col">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Drone Battery</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-white">
                      {activeLiveMission.batteryLevel || 78}%
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Time Elapsed</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-white">
                      {activeLiveMission.flightTime || '12:34 min'}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Area Covered</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-white">
                      {activeLiveMission.areaCovered || '1.2 acres'}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Progress</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-white">
                      {activeLiveMission.progress || 65}%
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 h-10 flex items-center justify-center gap-2 bg-yellow-400/20 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 rounded-lg text-sm font-bold hover:bg-yellow-400/30">
                    <span className="material-symbols-outlined text-lg">pause</span>
                    Pause
                  </button>
                  <button className="flex-1 h-10 flex items-center justify-center gap-2 bg-red-500/20 text-red-700 dark:bg-red-500/20 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/30">
                    <span className="material-symbols-outlined text-lg">stop_circle</span>
                    Stop
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

