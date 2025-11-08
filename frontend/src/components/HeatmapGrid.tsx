interface Region {
  id: string;
  name: string;
  temperature: string;
  co2: string;
  awarenessIndex: string;
  color: string;
}

interface HeatmapGridProps {
  onRegionClick?: (region: Region) => void;
}

export default function HeatmapGrid({ onRegionClick }: HeatmapGridProps) {
  return (
    <div className="w-full h-full bg-card border border-card-border rounded-lg p-8">
    </div>
  );
}
