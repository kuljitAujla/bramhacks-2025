import { useState } from "react";
import HeatmapGrid from "../components/HeatmapGrid";
import RegionStatsModal from "../components/RegionStatsModal";

interface Region {
  id: string;
  name: string;
  temperature: string;
  co2: string;
  awarenessIndex: string;
  color: string;
}

export default function Heatmap() {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  return (
    <div className="p-4 md:p-8 h-[calc(100vh-4rem)]">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-3">Environmental Heatmap</h1>
        <p className="text-muted-foreground text-lg">
          Click on any region to view environmental statistics.
        </p>
      </div>

      <div className="h-[calc(100%-8rem)]">
        <HeatmapGrid
          onRegionClick={(region) => {
            setSelectedRegion(region);
          }}
        />
      </div>

      <RegionStatsModal
        region={selectedRegion}
        onClose={() => setSelectedRegion(null)}
      />
    </div>
  );
}
