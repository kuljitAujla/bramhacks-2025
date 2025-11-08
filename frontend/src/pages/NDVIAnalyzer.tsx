import { useState } from "react";
import AnalysisMetric from "../components/AnalysisMetric";
import { TrendingUp, TreeDeciduous, Leaf, BarChart3, Calendar } from "lucide-react";

type TimePeriod = "1-month" | "1-year" | null;

// mock data - need to replace with real api
const mockAnalysisData = {
  "1-month": {
    vegetationChange: "+8%",
    treesToPlant: "420",
    ndviScore: "0.65",
    coverageArea: "87%",
    summary: "Over the past month, vegetation has shown steady growth with an 8% increase in green coverage. To support this positive trend, we recommend planting approximately 420 trees in identified sparse areas. The average NDVI score of 0.65 indicates healthy vegetation across 87% of the monitored region.",
  },
  "1-year": {
    vegetationChange: "+24%",
    treesToPlant: "1,250",
    ndviScore: "0.68",
    coverageArea: "89%",
    summary: "The 1-year analysis demonstrates excellent vegetation recovery with a 24% increase in green coverage. Long-term growth patterns indicate successful ecosystem regeneration. To maintain this momentum and further improve the ecosystem, we recommend planting approximately 1,250 trees in the identified low-density areas. The average NDVI score of 0.68 indicates healthy vegetation across 89% of the monitored area.",
  },
};

export default function NDVIAnalyzer() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(null);

  const handlePeriodSelect = (period: TimePeriod) => {
    setSelectedPeriod(period);
  };

  const analysisData = selectedPeriod ? mockAnalysisData[selectedPeriod] : null;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3">NDVI Vegetation Analyzer</h1>
        <p className="text-muted-foreground text-lg">
          Select a time period to analyze vegetation changes.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Select Time Period
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { period: "1-month" as TimePeriod, label: "1 Month", description: "Recent changes" },
            { period: "1-year" as TimePeriod, label: "1 Year", description: "Long-term analysis" },
          ].map((option) => (
            <button
              key={option.period}
              onClick={() => handlePeriodSelect(option.period)}
              className={`
                p-6 rounded-lg border-2 text-left transition-all
                ${selectedPeriod === option.period
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover-elevate"
                }
              `}
            >
              <div className="text-2xl font-bold mb-1">{option.label}</div>
              <div className="text-sm text-muted-foreground">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {analysisData && (
      <div className="bg-card border border-card-border rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6">Analysis Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <AnalysisMetric
              icon={TrendingUp}
              value={analysisData.vegetationChange}
              label="Vegetation Change"
              trend="up"
            />
            <AnalysisMetric
              icon={TreeDeciduous}
              value={analysisData.treesToPlant}
              label="Trees to Plant"
            />
            <AnalysisMetric
              icon={Leaf}
              value={analysisData.ndviScore}
              label="Avg NDVI Score"
              trend="up"
            />
            <AnalysisMetric
              icon={BarChart3}
              value={analysisData.coverageArea}
              label="Coverage Area"
              trend="neutral"
            />
          </div>

          <div className="p-4 bg-accent/50 rounded-lg">
            <h3 className="font-semibold mb-2">Summary</h3>

            <p className="text-muted-foreground">
              {analysisData.summary}
            </p>
          </div>
        </div>
      )}

      {!selectedPeriod && (
        <div className="bg-muted/30 border border-dashed border-border rounded-lg p-12 text-center">

            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">
            Select a time period above to view analysis
          </p>
        </div>
      )}
    </div>
  );
}
