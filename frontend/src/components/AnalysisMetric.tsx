import type { LucideIcon } from "lucide-react";

interface AnalysisMetricProps {
  icon: LucideIcon;
  value: string;
  label: string;
  trend?: "up" | "down" | "neutral";
}

export default function AnalysisMetric({ icon: Icon, value, label, trend }: AnalysisMetricProps) {
  // colors for different trends
  const trendColors = {
    up: "text-green-600 dark:text-green-400",
    down: "text-red-600 dark:text-red-400",
    neutral: "text-muted-foreground",
  };

  return (
    <div className="flex flex-col items-center p-6 bg-card border border-card-border rounded-lg hover-elevate">
      <Icon className={`h-10 w-10 mb-3 ${trend ? trendColors[trend] : "text-primary"}`} />

      <div className="text-4xl font-bold mb-2 font-mono">{value}</div>
      <div className="text-sm text-muted-foreground text-center">{label}</div>
    </div>
  );
}
