import { useState } from "react";
import RegionStatsModal from "../RegionStatsModal";

export default function RegionStatsModalExample() {
  const [isOpen, setIsOpen] = useState(true);

  const mockRegion = {
    name: "Northern Forest",
    temperature: "18°C",
    co2: "385 ppm",
    awarenessIndex: "High",
  };

  return (
    <>
      <div className="p-6">
        <button
          onClick={() => setIsOpen(true)}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover-elevate active-elevate-2 font-medium"
        >
          Show Region Stats
        </button>
      </div>
      <RegionStatsModal
        region={isOpen ? mockRegion : null}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
