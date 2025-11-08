import { Home, Image, Map, Info, Heart, X } from "lucide-react";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/ndvi-analyzer", label: "NDVI Analyzer", icon: Image },
  { path: "/heatmap", label: "Heatmap", icon: Map },
  { path: "/about", label: "About Us", icon: Info },
  { path: "/acknowledgements", label: "Acknowledgements", icon: Heart },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();


  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-card-border transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} md:fixed`}
      >
        <div className="flex items-center justify-between p-4 border-b border-card-border md:hidden">
          <h2 className="text-lg font-semibold">Menu</h2>

          <button
            onClick={onClose}
            className="p-2 hover-elevate active-elevate-2 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;

            return (
              <Link key={item.path} href={item.path} onClick={onClose}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-md hover-elevate active-elevate-2 cursor-pointer ${isActive ? "bg-accent text-accent-foreground font-medium" : ""}`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        
      </aside>
    </>
  );
}
