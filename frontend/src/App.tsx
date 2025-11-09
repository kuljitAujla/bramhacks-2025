import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Missions from "./pages/Missions";
import DroneDashboard from "./pages/DroneDashboard";
import Analytics from "./pages/Analytics";
import NDVIAnalyzer from "./pages/NDVIAnalyzer";
import Heatmap from "./pages/Heatmap";
import AboutUs from "./pages/AboutUs";
import CommunityAction from "./pages/CommunityAction";
import Acknowledgements from "./pages/Acknowledgements";
import NotFound from "@/pages/not-found";
import "leaflet/dist/leaflet.css";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/missions" component={Missions} />
      <Route path="/drone-dashboard" component={DroneDashboard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/ndvi-analyzer" component={NDVIAnalyzer} />
      <Route path="/heatmap" component={Heatmap} />
      <Route path="/about" component={AboutUs} />
      <Route path="/community-action" component={CommunityAction} />
      <Route path="/acknowledgements" component={Acknowledgements} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location] = useLocation();

  // Dashboard, Missions, DroneDashboard, and Analytics have their own layouts, so don't wrap them
  if (location === '/dashboard' || location === '/missions' || location === '/drone-dashboard' || location === '/analytics') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          <div className="flex flex-col flex-1 overflow-hidden">
            <Navbar
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <main className="flex-1 overflow-y-auto">
              <Router />
            </main>
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
