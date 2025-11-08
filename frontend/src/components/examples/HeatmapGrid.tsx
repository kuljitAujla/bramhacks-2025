import HeatmapGrid from "../HeatmapGrid";

export default function HeatmapGridExample() {
  return (
    <div className="p-6 h-screen">
      <HeatmapGrid
        onRegionClick={(region) => console.log("Region clicked:", region.name)}
      />
    </div>
  );
}
