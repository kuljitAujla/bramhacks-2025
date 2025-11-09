import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// API functions
const fetchAnalytics = async () => {
  const response = await fetch(`${API_BASE_URL}/dashboard/analytics`);
  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
};

const fetchMissions = async () => {
  const response = await fetch(`${API_BASE_URL}/dashboard/missions`);
  if (!response.ok) throw new Error('Failed to fetch missions');
  return response.json();
};

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const isCompleted = status?.toLowerCase() === 'completed' || status?.toLowerCase() === 'success';
  const isFailed = status?.toLowerCase() === 'failed' || status?.toLowerCase() === 'error';

  if (isCompleted) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
        Completed
      </span>
    );
  }

  if (isFailed) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
      {status || 'Pending'}
    </span>
  );
}

// Format duration helper
const formatDuration = (hours: number, minutes: number) => {
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export default function Analytics() {
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
    refetchInterval: 30000,
  });

  const { data: missionsData, isLoading: missionsLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: fetchMissions,
    refetchInterval: 30000,
  });

  const analytics = analyticsData?.data || {};
  const missions = missionsData?.data || [];

  // Format missions for table (use recent missions or default data)
  const recentMissions = missions.length > 0
    ? missions.slice(0, 4).map((mission: any) => ({
        id: mission.id,
        date: mission.date || new Date().toISOString().split('T')[0],
        status: mission.status || 'completed',
        duration: mission.duration || '4h 15m',
      }))
    : [
        { id: 'MP-0823-A1', date: '2023-10-26', status: 'completed', duration: '4h 15m' },
        { id: 'MP-0823-B3', date: '2023-10-26', status: 'failed', duration: '1h 02m' },
        { id: 'MP-0822-C9', date: '2023-10-25', status: 'completed', duration: '3h 58m' },
        { id: 'MP-0821-D4', date: '2023-10-24', status: 'completed', duration: '5h 30m' },
      ];

  return (
    <div className="relative flex min-h-screen w-full">
      {/* SideNavBar */}
      <aside className="flex flex-col w-64 bg-white dark:bg-[#11221e] border-r border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAnxUd47uFkdbCk2dALNXhKPykXruplVN0J8Q7D5gs9xofDIEvtsNuM5ae-KQF3B9pZVuAnEFPlBDuI98QwDcVLOrJhBwkUzLYxmr1_axjCTDi3lBRaJj-Meqwi0PszzBK93fc261ffcmYVsy8Q33cH5tbHUD7wRJhGQniTlttu5mx353H5MptsNPnENPADRY2yF13GAgjr7WVvd9C-INq94s8p4sE-M2e55frydxAuTYi6fxyGQTpNlgxeRqn9gK7xCT15rRFses8")',
              }}
            />
            <div className="flex flex-col">
              <h1 className="text-gray-900 dark:text-white text-base font-medium leading-normal">
                City Pollination
              </h1>
              <p className="text-gray-500 dark:text-[#92c9bb] text-sm font-normal leading-normal">
                Drone Analytics
              </p>
            </div>
          </div>
          <nav className="flex flex-col gap-2 mt-4">
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-200"
              href="/dashboard"
            >
              <span className="material-symbols-outlined text-gray-700 dark:text-white">dashboard</span>
              <p className="text-gray-700 dark:text-white text-sm font-medium leading-normal">Dashboard</p>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
              href="/missions"
            >
              <span className="material-symbols-outlined">flight</span>
              <p className="text-sm font-medium leading-normal">Missions</p>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
              href="/drone-dashboard"
            >
              <span className="material-symbols-outlined">adjust</span>
              <p className="text-sm font-medium leading-normal">Drones</p>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/20 dark:bg-[#23483f]"
              href="/analytics"
            >
              <span className="material-symbols-outlined text-primary dark:text-white">assessment</span>
              <p className="text-primary dark:text-white text-sm font-medium leading-normal">Analytics</p>
            </a>
            <a
              className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
              href="/alerts"
            >
              <span className="material-symbols-outlined">warning</span>
              <p className="text-sm font-medium leading-normal">Alerts</p>
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* TopNavBar */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-gray-200 dark:border-b-[#23483f] px-6 lg:px-10 py-4 bg-white dark:bg-[#11221e]">
          <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
            Performance Analytics
          </h2>
          <div className="flex items-center gap-4">
            {/* Chips */}
            <div className="hidden sm:flex items-center gap-2">
              <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-100 dark:bg-[#23483f] pl-4 pr-3 text-gray-900 dark:text-white">
                <p className="text-sm font-medium leading-normal">Last 30 Days</p>
                <span className="material-symbols-outlined text-base">expand_more</span>
              </button>
              <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-transparent dark:bg-transparent pl-4 pr-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#23483f]">
                <p className="text-sm font-medium leading-normal">Custom Range</p>
                <span className="material-symbols-outlined text-base">date_range</span>
              </button>
            </div>
            <button className="flex cursor-pointer items-center justify-center overflow-hidden rounded-full size-10 bg-gray-200 dark:bg-[#23483f] text-gray-700 dark:text-white">
              <span className="material-symbols-outlined">person</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 lg:p-10 space-y-6 lg:space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#11221e] border border-gray-200 dark:border-[#32675a]">
              <p className="text-gray-600 dark:text-gray-300 text-base font-medium leading-normal">
                Total Missions Completed
              </p>
              <p className="text-gray-900 dark:text-white tracking-light text-2xl font-bold leading-tight">
                {analytics.totalMissions?.toLocaleString() || '1,204'}
              </p>
              <p className="text-green-500 dark:text-[#0bda49] text-base font-medium leading-normal">
                {analytics.missionsChange ? `+${analytics.missionsChange}%` : '+5.2%'}
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#11221e] border border-gray-200 dark:border-[#32675a]">
              <p className="text-gray-600 dark:text-gray-300 text-base font-medium leading-normal">
                Pollination Success Rate
              </p>
              <p className="text-gray-900 dark:text-white tracking-light text-2xl font-bold leading-tight">
                {analytics.successRate || 92.1}%
              </p>
              <p className="text-green-500 dark:text-[#0bda49] text-base font-medium leading-normal">
                {analytics.successRateChange ? `+${analytics.successRateChange}%` : '+1.8%'}
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#11221e] border border-gray-200 dark:border-[#32675a]">
              <p className="text-gray-600 dark:text-gray-300 text-base font-medium leading-normal">
                Active Drones
              </p>
              <p className="text-gray-900 dark:text-white tracking-light text-2xl font-bold leading-tight">
                {analytics.activeDrones || 16}
              </p>
              <p className="text-green-500 dark:text-[#0bda49] text-base font-medium leading-normal">
                {analytics.activeDronesChange ? `+${analytics.activeDronesChange}` : '+2'}
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#11221e] border border-gray-200 dark:border-[#32675a]">
              <p className="text-gray-600 dark:text-gray-300 text-base font-medium leading-normal">
                Pollen Stock Remaining
              </p>
              <p className="text-gray-900 dark:text-white tracking-light text-2xl font-bold leading-tight">
                {analytics.pollenStock || 48.5}L
              </p>
              <p className="text-red-500 dark:text-[#fa5838] text-base font-medium leading-normal">
                {analytics.pollenStockChange ? `${analytics.pollenStockChange}%` : '-3.1%'}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Mission Performance Over Time */}
            <div className="flex flex-col gap-2 rounded-xl border border-gray-200 dark:border-[#32675a] p-6 bg-white dark:bg-[#11221e]">
              <p className="text-gray-900 dark:text-white text-base font-medium leading-normal">
                Mission Performance Over Time
              </p>
              <div className="flex gap-1 items-baseline">
                <p className="text-gray-900 dark:text-white tracking-light text-[32px] font-bold leading-tight truncate">
                  {analytics.performanceData?.flowers?.toLocaleString() || '15,234'}
                </p>
                <p className="text-gray-500 dark:text-[#92c9bb] text-base font-normal leading-normal">flowers</p>
              </div>
              <div className="flex gap-2 items-center">
                <p className="text-gray-500 dark:text-[#92c9bb] text-base font-normal leading-normal">
                  {analytics.performanceData?.period || 'Last 30 Days'}
                </p>
                <p className="text-green-500 dark:text-[#0bda49] text-base font-medium leading-normal">
                  {analytics.performanceData?.change ? `+${analytics.performanceData.change}%` : '+12.5%'}
                </p>
              </div>
              <div className="flex min-h-[180px] flex-1 flex-col gap-8 py-4">
                <svg
                  fill="none"
                  height="100%"
                  preserveAspectRatio="none"
                  viewBox="0 0 472 150"
                  width="100%"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    className="block dark:hidden"
                    d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H0V109Z"
                    fill="url(#paint0_linear_1131_5935_light)"
                  />
                  <path
                    className="hidden dark:block"
                    d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H0V109Z"
                    fill="url(#paint0_linear_1131_5935_dark)"
                  />
                  <path
                    className="stroke-primary/50 dark:stroke-[#92c9bb]"
                    d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25"
                    strokeWidth="3"
                  />
                  <defs>
                    <linearGradient
                      gradientUnits="userSpaceOnUse"
                      id="paint0_linear_1131_5935_dark"
                      x1="236"
                      x2="236"
                      y1="1"
                      y2="149"
                    >
                      <stop stopColor="#23483f" />
                      <stop offset="1" stopColor="#23483f" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient
                      gradientUnits="userSpaceOnUse"
                      id="paint0_linear_1131_5935_light"
                      x1="236"
                      x2="236"
                      y1="1"
                      y2="149"
                    >
                      <stop stopColor="#13ecb6" stopOpacity="0.2" />
                      <stop offset="1" stopColor="#13ecb6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex justify-around">
                  <p className="text-gray-500 dark:text-[#92c9bb] text-[13px] font-bold leading-normal tracking-[0.015em]">
                    Week 1
                  </p>
                  <p className="text-gray-500 dark:text-[#92c9bb] text-[13px] font-bold leading-normal tracking-[0.015em]">
                    Week 2
                  </p>
                  <p className="text-gray-500 dark:text-[#92c9bb] text-[13px] font-bold leading-normal tracking-[0.015em]">
                    Week 3
                  </p>
                  <p className="text-gray-500 dark:text-[#92c9bb] text-[13px] font-bold leading-normal tracking-[0.015em]">
                    Week 4
                  </p>
                </div>
              </div>
            </div>

            {/* Flower Detection by Species */}
            <div className="flex flex-col gap-2 rounded-xl border border-gray-200 dark:border-[#32675a] p-6 bg-white dark:bg-[#11221e]">
              <p className="text-gray-900 dark:text-white text-base font-medium leading-normal">
                Flower Detection by Species
              </p>
              <div className="flex gap-1 items-baseline">
                <p className="text-gray-900 dark:text-white tracking-light text-[32px] font-bold leading-tight truncate">
                  5 Species
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <p className="text-gray-500 dark:text-[#92c9bb] text-base font-normal leading-normal">Last 30 Days</p>
                <p className="text-green-500 dark:text-[#0bda49] text-base font-medium leading-normal">+2 new</p>
              </div>
              <div className="flex-1 flex items-center justify-center min-h-[180px] py-4">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <circle
                      className="stroke-gray-200 dark:stroke-gray-700"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="15.91549430918954"
                      strokeWidth="3"
                    />
                    <circle
                      className="stroke-cyan-400"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="15.91549430918954"
                      strokeDasharray="30, 100"
                      strokeDashoffset="0"
                      strokeWidth="3.2"
                    />
                    <circle
                      className="stroke-teal-400"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="15.91549430918954"
                      strokeDasharray="25, 100"
                      strokeDashoffset="-30"
                      strokeWidth="3.2"
                    />
                    <circle
                      className="stroke-emerald-400"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="15.91549430918954"
                      strokeDasharray="20, 100"
                      strokeDashoffset="-55"
                      strokeWidth="3.2"
                    />
                    <circle
                      className="stroke-lime-400"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="15.91549430918954"
                      strokeDasharray="15, 100"
                      strokeDashoffset="-75"
                      strokeWidth="3.2"
                    />
                    <circle
                      className="stroke-green-400"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="15.91549430918954"
                      strokeDasharray="10, 100"
                      strokeDashoffset="-90"
                      strokeWidth="3.2"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">100%</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-xl border border-gray-200 dark:border-[#32675a] bg-white dark:bg-[#11221e] overflow-hidden">
            <div className="p-6">
              <h3 className="text-gray-900 dark:text-white text-base font-medium leading-normal">
                Recent Mission Log
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-200 dark:border-[#32675a]">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Mission ID
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#23483f]">
                  {recentMissions.map((mission: any) => (
                    <tr key={mission.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {mission.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {mission.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={mission.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {mission.duration}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a
                          className="text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80"
                          href="#"
                        >
                          View Report
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

