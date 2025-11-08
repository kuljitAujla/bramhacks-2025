import { TrendingUp, TreeDeciduous, Leaf, BarChart3 } from "lucide-react";
import AnalysisMetric from "../AnalysisMetric";

// example usage of the metric component
export default function AnalysisMetricExample() {
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <AnalysisMetric 
      icon={TrendingUp}
           value="+24%"
        label="Vegetation Increase"
          trend="up"
      />
      <AnalysisMetric
        icon={TreeDeciduous}
        value="1,250"
        label="Trees to Plant"
      />
      <AnalysisMetric
        icon={Leaf}
        value="0.68"
        label="Avg NDVI Score"
        trend="up"
      />
      <AnalysisMetric
        icon={BarChart3}
        value="89%"
        label="Coverage Area"
        trend="neutral"
      />
    </div>
  );
}
