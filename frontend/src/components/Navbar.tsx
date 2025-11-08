import { Menu, Satellite, X } from "lucide-react";
import { Link } from "wouter";

interface NavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Navbar({ isSidebarOpen, onToggleSidebar }: NavbarProps) {
  return (

    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-16 items-center px-4 gap-4">
        <button onClick={onToggleSidebar} className="p-2 hover-elevate active-elevate-2 rounded-md">

          {isSidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}


        </button>

        <Link href="/" className="flex items-center gap-2 hover-elevate px-2 py-1 rounded-md">
          <Satellite className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Sustaina-Satellite</h1>
        </Link>
      </div>


      
    </header>
  );
}
