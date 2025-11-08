import { X, Thermometer, Cloud, TrendingUp } from "lucide-react";

interface RegionStats {
  name: string;
  temperature: string;
  co2: string;
  awarenessIndex: string;
}

interface RegionStatsModalProps {
  region: RegionStats | null;
  onClose: () => void;
}

export default function RegionStatsModal({ region, onClose }: RegionStatsModalProps) {
  if (!region) return null;

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-card-border rounded-lg shadow-xl max-w-md w-full p-6 scale-95 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeIn 0.3s ease-out forwards" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{region.name}</h2>
          <button onClick={onClose} className="p-2 hover-elevate active-elevate-2 rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-background rounded-lg">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <Thermometer className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Average Temperature</div>
              <div className="text-2xl font-bold font-mono">
                {region.temperature}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-background rounded-lg">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Cloud className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">CO₂ Concentration</div>
              <div className="text-2xl font-bold font-mono">
                {region.co2}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-background rounded-lg">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Awareness Index</div>
              <div className="text-2xl font-bold">
                {region.awarenessIndex}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
