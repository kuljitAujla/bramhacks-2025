import { useState } from "react";
import Navbar from "../Navbar";

export default function NavbarExample() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Navbar
      isSidebarOpen={isSidebarOpen}
      onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
    />
  );
}
