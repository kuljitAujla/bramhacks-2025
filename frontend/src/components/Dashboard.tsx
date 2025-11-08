import { useEffect } from 'react';

const Dashboard = () => {
  useEffect(() => {
    // Load Tailwind CSS dynamically
    const tailwindScript = document.createElement('script');
    tailwindScript.src = 'https://cdn.tailwindcss.com?plugins=forms,container-queries';
    tailwindScript.async = true;
    document.head.appendChild(tailwindScript);

    // Load Google Fonts
    const fontLink1 = document.createElement('link');
    fontLink1.rel = 'preconnect';
    fontLink1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(fontLink1);

    const fontLink2 = document.createElement('link');
    fontLink2.rel = 'preconnect';
    fontLink2.href = 'https://fonts.gstatic.com';
    fontLink2.crossOrigin = '';
    document.head.appendChild(fontLink2);

    const fontLink3 = document.createElement('link');
    fontLink3.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
    fontLink3.rel = 'stylesheet';
    document.head.appendChild(fontLink3);

    const materialIcons = document.createElement('link');
    materialIcons.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined';
    materialIcons.rel = 'stylesheet';
    document.head.appendChild(materialIcons);

    // Configure Tailwind
    if ((window as any).tailwind) {
      (window as any).tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "primary": "#13ecb6",
              "background-light": "#f6f8f8",
              "background-dark": "#10221e",
            },
            fontFamily: {
              "display": ["Inter", "sans-serif"]
            },
            borderRadius: {
              "DEFAULT": "0.25rem",
              "lg": "0.5rem",
              "xl": "0.5rem",
              "full": "9999px"
            },
          },
        },
      };
    }

    // Add dark class to html
    document.documentElement.classList.add('dark');

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      body {
        font-family: 'Inter', sans-serif;
      }
      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Cleanup
      document.documentElement.classList.remove('dark');
    };
  }, []);

  return (
    <div className="relative flex min-h-screen w-full">
      {/* SideNavBar */}
      <aside className="flex flex-col w-64 bg-[#11221e] p-4 text-white shrink-0">
        <div className="flex flex-col gap-4 flex-grow">
          <div className="flex items-center gap-3 px-2 py-2">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" 
              style={{
                backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBrYS6tcj-AFb2zPw7KITz5AfNeroba02_M6eTgdERRZKR8uTpF49JtsTmqFZoTaH_persvpuBt9BKzlCKqldS8dDPxOloD5a_lJZh9v0R8M5mwCT7hLg3hMfpMKdNcOfsLHj2jRxMvNJVGZAopssyO0pxX8TN6frgVE1qWxRo2dM0sXLaMV0UWeq0j_7Dylk1Mf98ylA4EQskOeHA426PqhXbGvI3hIN5o83F2J_BXxOrJazKgAKdggFXOLxI2tgKWPxoiwjHWDRk")'
              }}
            />
            <div className="flex flex-col">
              <h1 className="text-white text-base font-medium leading-normal">AeroPollen</h1>
              <p className="text-[#92c9bb] text-sm font-normal leading-normal">Dashboard</p>
            </div>
          </div>
          <nav className="flex flex-col gap-2 mt-4">
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#23483f]" href="#">
              <span className="material-symbols-outlined text-white text-2xl">dashboard</span>
              <p className="text-white text-sm font-medium leading-normal">Dashboard</p>
            </a>
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#23483f]/50 transition-colors duration-200" href="#">
              <span className="material-symbols-outlined text-white text-2xl">assignment</span>
              <p className="text-white text-sm font-medium leading-normal">Missions</p>
            </a>
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#23483f]/50 transition-colors duration-200" href="#">
              <span className="material-symbols-outlined text-white text-2xl">flight</span>
              <p className="text-white text-sm font-medium leading-normal">Drones</p>
            </a>
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#23483f]/50 transition-colors duration-200" href="#">
              <span className="material-symbols-outlined text-white text-2xl">pie_chart</span>
              <p className="text-white text-sm font-medium leading-normal">Analytics</p>
            </a>
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#23483f]/50 transition-colors duration-200" href="#">
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
                backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBLwZ69O5XwzZYYg5MiqPvTDwLrZU47gDBAZ_ZIq-OywznxIPd39nvDmehfqaVScUr1vUArGQL0zOKfeqCxGa7q6RBM33d2JVA3sEWO2yX4Qn5IRD6C45cfuByu61dhvzaRFSj89HOJi5nJjGvrB6OK77AdWzDcVgfigRJ57YfnGCqy6ZJdNg1MG-gIl5oWkR380IPGP4A2ee5yROTMEhul7R1o_WqwN72iDXoYBWQ7X1wKDTjQkkrmR2IKzsM1e11FiA1X0p6NGyI")'
              }}
            />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* PageHeading */}
          <div className="flex flex-wrap justify-between gap-3 mb-6">
            <div className="flex min-w-72 flex-col gap-2">
              <p className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Dashboard Overview</p>
              <p className="text-gray-500 dark:text-[#92c9bb] text-base font-normal leading-normal">Real-time pollination and system metrics. Last updated: just now</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#11221e] border border-black/10 dark:border-[#32675a]">
              <p className="text-gray-600 dark:text-white text-base font-medium leading-normal">Drones Active</p>
              <p className="text-gray-900 dark:text-white tracking-tight text-5xl font-bold leading-tight">18</p>
              <p className="text-gray-500 dark:text-[#92c9bb] text-sm font-medium leading-normal">Currently on missions</p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#11221e] border border-black/10 dark:border-[#32675a]">
              <p className="text-gray-600 dark:text-white text-base font-medium leading-normal">Flowers Pollinated</p>
              <div className="flex items-baseline gap-2">
                <p className="text-gray-900 dark:text-white tracking-tight text-5xl font-bold leading-tight">1.24M</p>
                <p className="text-green-500 dark:text-[#0bda49] text-base font-bold leading-normal flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">arrow_upward</span>+5.2%
                </p>
              </div>
              <p className="text-gray-500 dark:text-[#92c9bb] text-sm font-medium leading-normal">vs yesterday</p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#11221e] border border-black/10 dark:border-[#32675a]">
              <p className="text-gray-600 dark:text-white text-base font-medium leading-normal">Success Rate</p>
              <p className="text-gray-900 dark:text-white tracking-tight text-5xl font-bold leading-tight">98.2%</p>
              <p className="text-gray-500 dark:text-[#92c9bb] text-sm font-medium leading-normal">Avg. this week</p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#11221e] border border-black/10 dark:border-[#32675a]">
              <p className="text-gray-600 dark:text-white text-base font-medium leading-normal">System Health</p>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-green-500 dark:bg-[#0bda49]"></div>
                <p className="text-gray-900 dark:text-white tracking-tight text-2xl font-bold leading-tight">Normal</p>
              </div>
              <p className="text-gray-500 dark:text-[#92c9bb] text-sm font-medium leading-normal">All systems operational</p>
            </div>
          </div>

          {/* SectionHeader */}
          <h2 className="text-gray-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">Operational Status & Planning</h2>

          {/* Operational Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pollen Supply Levels */}
            <div className="lg:col-span-2 flex flex-col gap-4 p-6 rounded-xl bg-white dark:bg-[#11221e] border border-black/10 dark:border-[#32675a]">
              <h3 className="text-gray-900 dark:text-white text-lg font-bold">Pollen Supply Levels</h3>
              <div className="space-y-5">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Drone #A01-C4</p>
                    <p className="text-gray-800 dark:text-white text-sm font-bold">85%</p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-[#23483f] rounded-full h-2.5">
                    <div className="bg-green-500 dark:bg-primary h-2.5 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Drone #B12-F9</p>
                    <p className="text-gray-800 dark:text-white text-sm font-bold">45%</p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-[#23483f] rounded-full h-2.5">
                    <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Drone #D04-A1</p>
                    <p className="text-gray-800 dark:text-white text-sm font-bold">15%</p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-[#23483f] rounded-full h-2.5">
                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Drone #E21-B7</p>
                    <p className="text-gray-800 dark:text-white text-sm font-bold">92%</p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-[#23483f] rounded-full h-2.5">
                    <div className="bg-green-500 dark:bg-primary h-2.5 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Missions */}
            <div className="flex flex-col gap-4 p-6 rounded-xl bg-white dark:bg-[#11221e] border border-black/10 dark:border-[#32675a]">
              <h3 className="text-gray-900 dark:text-white text-lg font-bold">Upcoming Missions</h3>
              <div className="flex flex-col gap-4">
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
              </div>
              <a className="text-sm font-bold text-primary dark:text-primary hover:underline mt-auto text-center" href="#">View All Missions</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

