import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

// Backend API URL - defaults to localhost:3001
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// API utility functions
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
};

const formatPercent = (num: number) => num > 0 ? `+${num.toFixed(1)}%` : `${num.toFixed(1)}%`;

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

// API functions - connect to backend
const fetchOverview = async () => {
  const response = await fetch(`${API_BASE_URL}/dashboard/overview`);
  if (!response.ok) throw new Error('Failed to fetch overview');
  return response.json();
};

const fetchDrones = async () => {
  const response = await fetch(`${API_BASE_URL}/dashboard/drones`);
  if (!response.ok) throw new Error('Failed to fetch drones');
  return response.json();
};

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

export default function Dashboard() {
  const { data: overviewData } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: fetchOverview,
    refetchInterval: 30000,
  });

  const { data: dronesData, isLoading: dronesLoading } = useQuery({
    queryKey: ['dashboard-drones'],
    queryFn: fetchDrones,
    refetchInterval: 30000,
  });

  const { data: missionsData, isLoading: missionsLoading } = useQuery({
    queryKey: ['dashboard-missions'],
    queryFn: fetchMissions,
    refetchInterval: 30000,
  });

  const { data: liveMissionsData, isLoading: liveMissionsLoading } = useQuery({
    queryKey: ['dashboard-live-missions'],
    queryFn: fetchLiveMissions,
    refetchInterval: 5000,
  });

  const overview = overviewData?.data || {};
  const drones = dronesData?.data || [];
  const missions = missionsData?.data || [];
  const liveMissions = liveMissionsData?.data || [];

  return (
    <div className="relative flex min-h-screen w-full">
      {/* SideNavBar */}
      <aside className="flex flex-col w-64 bg-[#11221e] p-4 text-white shrink-0">
        <div className="flex flex-col gap-4 flex-grow">
          <div className="flex items-center gap-3 px-2 py-2">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBrYS6tcj-AFb2zPw7KITz5AfNeroba02_M6eTgdERRZKR8uTpF49JtsTmqFZoTaH_persvpuBt9BKzlCKqldS8dDPxOloD5a_lJZh9v0R8M5mwCT7hLg3hMfpMKdNcOfsLHj2jRxMvNJVGZAopssyO0pxX8TN6frgVE1qWxRo2dM0sXLaMV0UWeq0j_7Dylk1Mf98ylA4EQskOeHA426PqhXbGvI3hIN5o83F2J_BXxOrJazKgAKdggFXOLxI2tgKWPxoiwjHWDRk")',
              }}
            />
            <div className="flex flex-col">
              <h1 className="text-white text-base font-medium leading-normal">AeroPollen</h1>
              <p className="text-[#92c9bb] text-sm font-normal leading-normal">Dashboard</p>
            </div>
          </div>
          <nav className="flex flex-col gap-2 mt-4">
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#23483f]"
              href="/dashboard"
            >
              <span className="material-symbols-outlined text-white text-2xl">dashboard</span>
              <p className="text-white text-sm font-medium leading-normal">Dashboard</p>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#23483f]/50 transition-colors duration-200"
              href="/missions"
            >
              <span className="material-symbols-outlined text-white text-2xl">assignment</span>
              <p className="text-white text-sm font-medium leading-normal">Missions</p>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#23483f]/50 transition-colors duration-200"
              href="/drone-dashboard"
            >
              <span className="material-symbols-outlined text-white text-2xl">flight</span>
              <p className="text-white text-sm font-medium leading-normal">Drones</p>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#23483f]/50 transition-colors duration-200"
              href="/analytics"
            >
              <span className="material-symbols-outlined text-white text-2xl">pie_chart</span>
              <p className="text-white text-sm font-medium leading-normal">Analytics</p>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#23483f]/50 transition-colors duration-200"
              href="/alerts"
            >
              <span className="material-symbols-outlined text-white text-2xl">warning</span>
              <p className="text-white text-sm font-medium leading-normal">Alerts</p>
            </a>
          </nav>
        </div>
        <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-[#11221e] text-sm font-bold leading-normal tracking-[0.015em] hover:bg-opacity-90 transition-opacity">
          <span className="truncate">Schedule Mission</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* TopNavBar */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-black/10 dark:border-b-[#23483f] px-10 py-3 bg-background-light dark:bg-background-dark sticky top-0 z-10">
          <div className="flex items-center gap-8">
            <label className="flex flex-col min-w-40 !h-10 w-80">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                <div className="text-[#92c9bb] flex border border-r-0 border-black/10 dark:border-[#23483f] bg-white dark:bg-[#23483f] items-center justify-center pl-4 rounded-l-lg">
                  <span className="material-symbols-outlined text-2xl">search</span>
                </div>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-black dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-l-0 border-black/10 dark:border-[#23483f] bg-white dark:bg-[#23483f] h-full placeholder:text-gray-500 dark:placeholder:text-[#92c9bb] px-4 rounded-l-none pl-2 text-base font-normal leading-normal"
                  placeholder="Search missions, drones..."
                  defaultValue=""
                />
              </div>
            </label>
          </div>
          <div className="flex flex-1 justify-end gap-4 items-center">
            <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 bg-white dark:bg-[#23483f] text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2e5a4f] transition-colors duration-200">
              <span className="material-symbols-outlined text-xl">notifications</span>
            </button>
            <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 bg-white dark:bg-[#23483f] text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#2e5a4f] transition-colors duration-200">
              <span className="material-symbols-outlined text-xl">settings</span>
            </button>
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBLwZ69O5XwzZYYg5MiqPvTDwLrZU47gDBAZ_ZIq-OywznxIPd39nvDmehfqaVScUr1vUArGQL0zOKfeqCxGa7q6RBM33d2JVA3sEWO2yX4Qn5IRD6C45cfuByu61dhvzaRFSj89HOJi5nJjGvrB6OK77AdWzDcVgfigRJ57YfnGCqy6ZJdNg1MG-gIl5oWkR380IPGP4A2ee5yROTMEhul7R1o_WqwN72iDXoYBWQ7X1wKDTjQkkrmR2IKzsM1e11FiA1X0p6NGyI")',
              }}
            />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* PageHeading */}
          <div className="flex flex-wrap justify-between gap-3 mb-6">
            <div className="flex min-w-72 flex-col gap-2">
              <p className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                Dashboard Overview
              </p>
              <p className="text-gray-500 dark:text-[#92c9bb] text-base font-normal leading-normal">
                Real-time pollination and system metrics. Last updated: {overview.lastUpdated ? formatDateTime(overview.lastUpdated) : 'just now'}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#11221e] border border-black/10 dark:border-[#32675a]">
              <p className="text-gray-600 dark:text-white text-base font-medium leading-normal">
                Drones Active
              </p>
              <p className="text-gray-900 dark:text-white tracking-tight text-5xl font-bold leading-tight">
                {overview.dronesActive ?? 20}
              </p>
              <p className="text-gray-500 dark:text-[#92c9bb] text-sm font-medium leading-normal">
                Currently on missions
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#11221e] border border-black/10 dark:border-[#32675a]">
              <p className="text-gray-600 dark:text-white text-base font-medium leading-normal">
                Flowers Pollinated
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-gray-900 dark:text-white tracking-tight text-5xl font-bold leading-tight">
                  {overview.flowersPollinated ? formatNumber(overview.flowersPollinated) : '1.24M'}
                </p>
                <p className="text-green-500 dark:text-[#0bda49] text-base font-bold leading-normal flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">arrow_upward</span>
                  {overview.flowersPollinatedChange ? formatPercent(overview.flowersPollinatedChange) : '+5.2%'}
                </p>
              </div>
              <p className="text-gray-500 dark:text-[#92c9bb] text-sm font-medium leading-normal">
                vs yesterday
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#11221e] border border-black/10 dark:border-[#32675a]">
              <p className="text-gray-600 dark:text-white text-base font-medium leading-normal">
                Success Rate
              </p>
              <p className="text-gray-900 dark:text-white tracking-tight text-5xl font-bold leading-tight">
                {overview.successRate ? `${overview.successRate}%` : '98.2%'}
              </p>
              <p className="text-gray-500 dark:text-[#92c9bb] text-sm font-medium leading-normal">
                Avg. this week
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#11221e] border border-black/10 dark:border-[#32675a]">
              <p className="text-gray-600 dark:text-white text-base font-medium leading-normal">
                System Health
              </p>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-green-500 dark:bg-[#0bda49]"></div>
                <p className="text-green-500 dark:text-[#0bda49] tracking-tight text-2xl font-bold leading-tight">
                  {overview.systemHealth ? overview.systemHealth.charAt(0).toUpperCase() + overview.systemHealth.slice(1) : 'Normal'}
                </p>
              </div>
              <p className="text-gray-500 dark:text-[#92c9bb] text-sm font-medium leading-normal">
                All systems operational
              </p>
            </div>
          </div>

          {/* SectionHeader */}
          <h2 className="text-gray-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">
            Operational Status & Planning
          </h2>

          {/* Operational Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pollen Supply Levels */}
            <div className="lg:col-span-2 flex flex-col gap-4 p-6 rounded-xl bg-white dark:bg-[#11221e] border border-black/10 dark:border-[#32675a]">
              <h3 className="text-gray-900 dark:text-white text-lg font-bold">Pollen Supply Levels</h3>
              <div className="space-y-5">
                {dronesLoading ? (
                  <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
                    <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
                    <p className="ml-4">Loading drone data...</p>
                  </div>
                ) : drones.length === 0 ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Drone #A01-C4</p>
                      <p className="text-gray-800 dark:text-white text-sm font-bold">85%</p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-[#23483f] rounded-full h-2.5">
                      <div className="bg-green-500 dark:bg-primary h-2.5 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                ) : (
                  drones.map((drone: any) => {
                    const statusColor =
                      drone.pollenLevel > 70
                        ? 'bg-green-500 dark:bg-primary'
                        : drone.pollenLevel > 30
                          ? 'bg-yellow-500'
                          : 'bg-red-500';
                    return (
                      <div key={drone.id} className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                            Drone #{drone.id}
                          </p>
                          <p className="text-gray-800 dark:text-white text-sm font-bold">
                            {drone.pollenLevel}%
                          </p>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-[#23483f] rounded-full h-2.5">
                          <div
                            className={`${statusColor} h-2.5 rounded-full`}
                            style={{ width: `${drone.pollenLevel}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Upcoming Missions */}
            <div className="flex flex-col gap-4 p-6 rounded-xl bg-white dark:bg-[#11221e] border border-black/10 dark:border-[#32675a]">
              <h3 className="text-gray-900 dark:text-white text-lg font-bold">Upcoming Missions</h3>
              <div className="flex flex-col gap-4">
                {missionsLoading ? (
                  <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
                    <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
                    <p className="ml-4">Loading missions...</p>
                  </div>
                ) : missions.length === 0 ? (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center size-12 rounded-lg bg-primary/20 text-primary">
                        <span className="material-symbols-outlined text-3xl">event</span>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-gray-800 dark:text-white font-semibold">Mission #M78910</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Today, 14:00 - Orchard Zone B</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center size-12 rounded-lg bg-primary/20 text-primary">
                        <span className="material-symbols-outlined text-3xl">event</span>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-gray-800 dark:text-white font-semibold">Mission #M78911</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Today, 16:30 - Greenhouse 3</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center size-12 rounded-lg bg-primary/20 text-primary">
                        <span className="material-symbols-outlined text-3xl">event</span>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-gray-800 dark:text-white font-semibold">Mission #M78912</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Tomorrow, 09:00 - Field Alpha</p>
                      </div>
                    </div>
                  </>
                ) : (
                  missions.map((mission: any) => {
                    const date = new Date(mission.date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const dateStr = isToday
                      ? 'Today'
                      : date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        });
                    return (
                      <div key={mission.id} className="flex items-center gap-4">
                        <div className="flex items-center justify-center size-12 rounded-lg bg-primary/20 text-primary">
                          <span className="material-symbols-outlined text-3xl">event</span>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-gray-800 dark:text-white font-semibold">
                            Mission #{mission.id}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {dateStr}, {mission.time} - {mission.name}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <a
                className="text-sm font-bold text-primary dark:text-primary hover:underline mt-auto text-center"
                href="#"
              >
                View All Missions
              </a>
            </div>
          </div>

          {/* Live Mission Data Section */}
          <div className="mt-6 flex flex-col gap-4 p-6 rounded-xl bg-white dark:bg-[#11221e] border border-black/10 dark:border-[#32675a]">
            <h3 className="text-gray-900 dark:text-white text-lg font-bold">Live Mission Data</h3>
            <div className="space-y-4">
              {liveMissionsLoading ? (
                <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
                  <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
                  <p className="ml-4">Loading live mission data...</p>
                </div>
              ) : !liveMissions || liveMissions.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
                  <span className="material-symbols-outlined text-4xl">sync</span>
                  <p className="ml-4">Loading live mission data...</p>
                </div>
              ) : (
                liveMissions.map((mission: any) => (
                  <LiveMissionCard key={mission.id} mission={mission} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Live Mission Card Component with Camera Feed
function LiveMissionCard({ mission }: { mission: any }) {
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [detectionData, setDetectionData] = useState<{
    flowerDetected: boolean;
    distance: number | null;
    confidence: number;
    ultrasonicActive: boolean;
  } | null>(null);

  const statusColorClass =
    mission.status === 'in-progress'
      ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
      : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300';
  const statusText = mission.status === 'in-progress' ? 'In Progress' : mission.status;

  const toggleCamera = async () => {
    if (showCamera) {
      // Stop camera
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setShowCamera(false);
      setDetectionData(null);
    } else {
      // Start camera
      try {
        // Try to get camera with environment facing mode first (rear camera)
        let mediaStream: MediaStream | null = null;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } catch (envError) {
          // Fallback to any available camera (for laptops/desktops)
          console.log('Environment camera not available, trying default camera...');
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        }
        
        console.log('Camera stream obtained:', mediaStream);
        const videoTracks = mediaStream.getVideoTracks();
        console.log('Video tracks:', videoTracks);
        console.log('Video track details:', videoTracks.map(track => ({
          id: track.id,
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState,
          settings: track.getSettings()
        })));
        
        if (!mediaStream || videoTracks.length === 0) {
          throw new Error('No video tracks available');
        }
        
        // Ensure video tracks are enabled
        videoTracks.forEach(track => {
          track.enabled = true;
          console.log(`Video track ${track.id} enabled: ${track.enabled}, readyState: ${track.readyState}`);
        });
        
        setStream(mediaStream);
        setShowCamera(true);
        
        // Frame capture will start after video is ready (handled in useEffect)
      } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Unable to access camera. Please check permissions.');
      }
    }
  };

  // Effect to set up video element when stream is available
  useEffect(() => {
    if (stream && videoRef.current && showCamera) {
      console.log('Setting up video element with stream in useEffect...');
      const video = videoRef.current;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      
      const playVideo = () => {
        if (video) {
          console.log('Video state:', {
            readyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            paused: video.paused,
            srcObject: video.srcObject
          });
          
          if (video.readyState >= 4) {
            // HAVE_ENOUGH_DATA - ready to play
            console.log('Video ready to play in useEffect, dimensions:', video.videoWidth, 'x', video.videoHeight);
            video.play().then(() => {
              console.log('Video playing successfully in useEffect');
            }).catch((error) => {
              console.error('Error playing video in useEffect:', error);
            });
          } else if (video.readyState >= 2) {
            // HAVE_CURRENT_DATA - can play but might not have enough data
            console.log('Video can play but waiting for more data, readyState:', video.readyState);
            video.play().then(() => {
              console.log('Video playing successfully in useEffect');
            }).catch((error) => {
              console.error('Error playing video in useEffect:', error);
            });
          } else {
            console.log('Video not ready yet in useEffect, readyState:', video.readyState);
            setTimeout(playVideo, 100);
          }
        }
      };
      
      video.onloadedmetadata = () => {
        console.log('Video metadata loaded in useEffect');
        playVideo();
      };
      
      video.oncanplay = () => {
        console.log('Video can play in useEffect');
        playVideo();
      };
      
      video.oncanplaythrough = () => {
        console.log('Video can play through in useEffect');
        playVideo();
      };
      
      video.onplay = () => {
        console.log('Video started playing in useEffect');
      };
      
      video.onerror = (e) => {
        console.error('Video element error in useEffect:', e);
      };
      
      // Try to play immediately and also after a delay
      playVideo();
      setTimeout(playVideo, 300);
    }
  }, [stream, showCamera]);

  // Effect to start frame capture when video is ready
  useEffect(() => {
    if (showCamera && stream && videoRef.current) {
      // Wait for video to be ready before starting frame capture
      const startFrameCapture = () => {
        if (videoRef.current && videoRef.current.readyState === 4 && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0 && !videoRef.current.paused) {
          console.log('Starting frame capture, video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          
          // Clear any existing interval
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          // Start frame capture
          intervalRef.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === 4 && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0 && !videoRef.current.paused) {
              const canvas = document.createElement('canvas');
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                console.log(`Capturing frame: ${canvas.width}x${canvas.height}`);
                ctx.drawImage(videoRef.current, 0, 0);
                canvas.toBlob(async (blob) => {
                  if (blob) {
                    const formData = new FormData();
                    formData.append('image', blob, 'frame.jpg');
                    formData.append('droneId', mission.droneId);
                    formData.append('width', String(videoRef.current!.videoWidth));
                    formData.append('height', String(videoRef.current!.videoHeight));

                    try {
                      const response = await fetch(`${API_BASE_URL}/camera/frame`, {
                        method: 'POST',
                        body: formData,
                      });
                      if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                          // Always update detection data, even if no classification
                          if (data.classification) {
                            const flowerDetected = data.classification.isFlower || false;
                            const distance = data.distance || data.detection?.distance || null;
                            const confidence = data.classification.confidence || 0;
                            const ultrasonicActive = data.ultrasonicActive || false;

                            setDetectionData({
                              flowerDetected,
                              distance,
                              confidence,
                              ultrasonicActive,
                            });

                            console.log(
                              `Classification: ${data.classification.class} (${(confidence * 100).toFixed(1)}% confidence)${distance ? ` - Distance: ${distance.toFixed(1)}cm` : ''}${ultrasonicActive ? ' - Ultrasonic ACTIVE' : ''}`
                            );
                          } else {
                            // No classification - show "No Flower Detected"
                            // Use distance and ultrasonicActive from response if available
                            setDetectionData({
                              flowerDetected: false,
                              distance: data.distance || null,
                              confidence: 0,
                              ultrasonicActive: data.ultrasonicActive || false,
                            });
                            console.log('No classification received - no flower detected');
                          }
                        } else {
                          // API returned success: false
                          setDetectionData({
                            flowerDetected: false,
                            distance: null,
                            confidence: 0,
                            ultrasonicActive: false,
                          });
                          console.error('API returned success: false', data.message);
                        }
                      } else {
                        // HTTP error
                        const errorText = await response.text();
                        console.error('HTTP error:', response.status, errorText);
                        setDetectionData({
                          flowerDetected: false,
                          distance: null,
                          confidence: 0,
                          ultrasonicActive: false,
                        });
                      }
                    } catch (error) {
                      console.error('Error sending frame:', error);
                      // Show error state instead of null
                      setDetectionData({
                        flowerDetected: false,
                        distance: null,
                        confidence: 0,
                        ultrasonicActive: false,
                      });
                    }
                  }
                }, 'image/jpeg', 0.8);
              }
            }
          }, 2000);
        } else {
          // Video not ready yet, retry after a delay
          console.log('Video not ready for frame capture yet, retrying...');
          setTimeout(startFrameCapture, 500);
        }
      };
      
      // Wait a bit for video to be ready
      setTimeout(startFrameCapture, 500);
    } else {
      // Stop frame capture if camera is off
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [showCamera, stream, mission.droneId]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [stream]);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-gray-200 dark:border-[#23483f] bg-gray-50 dark:bg-[#19332d]">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <p className="text-gray-900 dark:text-white font-semibold text-base">{mission.name}</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Mission #{mission.id} • Drone #{mission.droneId}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColorClass}`}>
          {statusText}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Flowers Pollinated</p>
          <p className="text-gray-900 dark:text-white text-lg font-bold">
            {formatNumber(mission.flowersPollinated || 0)}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Flowers Detected</p>
          <p className="text-gray-900 dark:text-white text-lg font-bold">
            {mission.flowersDetected || 0}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Battery</p>
          <p className="text-gray-900 dark:text-white text-lg font-bold">
            {mission.batteryLevel || 0}%
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Flight Time</p>
          <p className="text-gray-900 dark:text-white text-lg font-bold">{mission.flightTime || '0:00'}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Progress</p>
          <p className="text-gray-900 dark:text-white text-xs font-bold">{mission.progress || 0}%</p>
        </div>
        <div className="w-full bg-gray-200 dark:bg-[#23483f] rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${mission.progress || 0}%` }}
          ></div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 flex-1">
          <span>Started: {formatDateTime(mission.startTime || new Date().toISOString())}</span>
          <span>Est. completion: {formatDateTime(mission.estimatedCompletion || new Date().toISOString())}</span>
        </div>
        <button
          onClick={toggleCamera}
          className="ml-4 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-[#11221e] text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">videocam</span>
          <span>{showCamera ? 'Stop Camera' : 'Live Camera'}</span>
        </button>
      </div>
      {showCamera && (
        <div className="mt-2 flex flex-col gap-3">
          {/* Flower Detection Feedback - Above Camera Feed */}
          <div className="rounded-lg border border-gray-300 dark:border-[#23483f] bg-white dark:bg-[#11221e] p-4">
            {detectionData ? (
              detectionData.flowerDetected ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center size-10 rounded-full bg-green-500/20">
                      <span className="material-symbols-outlined text-green-500 text-2xl">local_florist</span>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-gray-900 dark:text-white font-bold text-base">Flower Detected!</p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">Confidence: {(detectionData.confidence * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  {detectionData.distance !== null && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-gray-100 dark:bg-[#23483f]">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-gray-600 dark:text-gray-400">straighten</span>
                          <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Distance</p>
                        </div>
                        <p className="text-gray-900 dark:text-white font-bold text-lg">
                          {detectionData.distance.toFixed(1)} cm
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-lg bg-gray-100 dark:bg-[#23483f]">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-gray-600 dark:text-gray-400">sensors</span>
                          <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Ultrasonic</p>
                        </div>
                        <p className={`font-bold text-lg ${detectionData.ultrasonicActive ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
                          {detectionData.ultrasonicActive ? (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              Active
                            </span>
                          ) : (
                            'Inactive'
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  {detectionData.distance !== null && detectionData.distance > 25 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700">
                      <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-sm">warning</span>
                      <p className="text-yellow-800 dark:text-yellow-300 text-xs font-medium">
                        Flower is too far ({detectionData.distance.toFixed(1)}cm). Move closer to activate ultrasonic sensor (threshold: 25cm).
                      </p>
                    </div>
                  )}
                  {detectionData.distance !== null && detectionData.distance <= 25 && detectionData.ultrasonicActive && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700">
                      <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-sm">check_circle</span>
                      <p className="text-green-800 dark:text-green-300 text-xs font-medium">
                        Flower is within range! Ultrasonic sensor is active and ready for pollination.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-full bg-gray-200 dark:bg-[#23483f]">
                    <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-2xl">search</span>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-gray-900 dark:text-white font-semibold text-base">No Flower Detected</p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Point the camera at a flower to detect it</p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-full bg-gray-200 dark:bg-[#23483f]">
                  <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-2xl animate-spin">sync</span>
                </div>
                <div className="flex flex-col">
                  <p className="text-gray-900 dark:text-white font-semibold text-base">Processing...</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">Analyzing camera feed for flowers</p>
                </div>
              </div>
            )}
          </div>

          {/* Camera Feed */}
          <div className="relative rounded-lg overflow-hidden border border-gray-300 dark:border-[#23483f] bg-black" style={{ minHeight: '500px' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ minHeight: '500px', width: '100%', backgroundColor: '#000' }}
              onLoadedMetadata={() => {
                console.log('Video loaded metadata');
                if (videoRef.current) {
                  videoRef.current.play().catch(console.error);
                }
              }}
              onCanPlay={() => {
                console.log('Video can play');
                if (videoRef.current) {
                  videoRef.current.play().catch(console.error);
                }
              }}
              onError={(e) => {
                console.error('Video error:', e);
              }}
            />
            <div className="absolute top-2 left-2 bg-red-600/80 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              LIVE
            </div>

            <div className="absolute bottom-2 right-2 flex gap-2 z-10">
              <button
                onClick={toggleCamera}
                className="px-3 py-1 bg-black/50 hover:bg-black/70 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
