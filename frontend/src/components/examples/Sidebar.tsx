import { useState } from "react";
import Sidebar from "../Sidebar";

export default function SidebarExample() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Sidebar
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    />
  );
}
