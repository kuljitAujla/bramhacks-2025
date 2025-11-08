import { useEffect, useState } from "react";
import AnalysisMetric from "../components/AnalysisMetric";
import NDVIMap from "../components/NDVIMap";
import { TrendingUp, TreeDeciduous, Leaf, BarChart3, Calendar } from "lucide-react";

type TimePeriod = "1-month" | "1-year" | null;
type SelectablePeriod = Exclude<TimePeriod, null>;

type SummaryFile = {
  total_loss_m2: number;
  total_gain_m2: number;
  loss_km2: number;
  gain_km2: number;
  trees_needed: number;
  recovery_fraction: number;
};

type AnalysisData = {
  vegetationChange: string;
  treesToPlant: string;
  ndviScore: string;
  coverageArea: string;
  summary: string;
};

type AnnualState =
  | { status: "idle" | "loading" }
  | { status: "ready"; data: AnalysisData }
  | { status: "error"; message: string };

const PERIOD_OPTIONS: ReadonlyArray<{
  period: SelectablePeriod;
  label: string;
  description: string;
  disabled?: boolean;
  badge?: string;
}> = [
  {
    period: "1-month",
    label: "1 Month",
    description: "Recent changes",
    disabled: true,
    badge: "Coming soon",
  },
  {
    period: "1-year",
    label: "1 Year",
    description: "Long-term analysis",
  },
];

const MONTHLY_ANALYSIS: AnalysisData = {
  vegetationChange: "+8%",
  treesToPlant: "420",
  ndviScore: "0.65",
  coverageArea: "87%",
  summary:
    "Over the past month, vegetation has shown steady growth with an 8% increase in green coverage. To support this positive trend, we recommend planting approximately 420 trees in identified sparse areas. The average NDVI score of 0.65 indicates healthy vegetation across 87% of the monitored region.",
};

export default function NDVIAnalyzer() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(null);
  const [annualState, setAnnualState] = useState<AnnualState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;

    async function loadAnnualAnalysis() {
      setAnnualState({ status: "loading" });

      try {
        const response = await fetch("/data/summary.json");
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const summary: SummaryFile = await response.json();
        const analysis = buildAnnualAnalysis(summary);

        if (!cancelled) {
          setAnnualState({ status: "ready", data: analysis });
        }
      } catch (error) {
        console.error("Failed to load NDVI annual summary:", error);
        if (!cancelled) {
          setAnnualState({
            status: "error",
            message: "Unable to load the latest 1-year analysis. Please try again soon.",
          });
        }
      }
    }

    loadAnnualAnalysis();
    return () => {
      cancelled = true;
    };
  }, []);

  const analysisData = getAnalysisData(selectedPeriod, annualState);
  const showLoader = selectedPeriod === "1-year" && annualState.status === "loading";
  const errorMessage =
    selectedPeriod === "1-year" && annualState.status === "error" ? annualState.message : null;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-3">NDVI Vegetation Analyzer</h1>
        <p className="text-muted-foreground text-lg">
          Choose a time period to see how vegetation has been shifting.
        </p>
      </header>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Select Time Period
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERIOD_OPTIONS.map((option) => {
            const isSelected = selectedPeriod === option.period;
            const isDisabled = Boolean(option.disabled);

            return (
              <button
                key={option.period}
                type="button"
                onClick={() => !isDisabled && setSelectedPeriod(option.period)}
                disabled={isDisabled}
                className={`
                  p-6 rounded-lg border-2 text-left transition-all
                  ${isSelected ? "border-primary bg-accent" : "border-border bg-card hover-elevate"}
                  ${isDisabled ? "opacity-60 cursor-not-allowed hover:shadow-none" : ""}
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold">{option.label}</span>
                  {option.badge && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border border-dashed border-border px-2 py-0.5 rounded-full">
                      {option.badge}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </button>
            );
          })}
        </div>
      </section>

      {showLoader && (
        <div className="bg-muted/30 border border-dashed border-border rounded-lg p-12 text-center">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground text-lg">
            Hang tight—we&apos;re pulling in the latest 1-year update.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
          <p className="text-destructive font-medium">{errorMessage}</p>
        </div>
      )}

      {!showLoader && !errorMessage && analysisData && (
        <div className="bg-card border border-card-border rounded-lg p-6 md:p-8 space-y-8">
          <AnalysisResults data={analysisData} />
          <MapSection />
        </div>
      )}

      {!selectedPeriod && (
        <div className="bg-muted/30 border border-dashed border-border rounded-lg p-12 text-center">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Pick a time period above to see the breakdown.</p>
        </div>
      )}
    </div>
  );
}

function buildAnnualAnalysis(summary: SummaryFile): AnalysisData {
  const netChangePercent =
    summary.total_loss_m2 === 0
      ? 0
      : ((summary.total_gain_m2 - summary.total_loss_m2) / summary.total_loss_m2) * 100;
  const recoveryPercent = Math.min(Math.max(summary.recovery_fraction * 100, 0), 100);

  return {
    vegetationChange: `${netChangePercent >= 0 ? "+" : ""}${netChangePercent.toFixed(1)}%`,
    treesToPlant: summary.trees_needed.toLocaleString(),
    ndviScore: summary.recovery_fraction.toFixed(2),
    coverageArea: `${recoveryPercent.toFixed(0)}%`,
    summary: `Over the past year, satellite observations detected ${summary.gain_km2.toFixed(
      1,
    )} km^2 of vegetation recovery alongside ${summary.loss_km2.toFixed(
      1,
    )} km^2 of canopy loss. Planting approximately ${summary.trees_needed.toLocaleString()} trees would offset gaps left by recent disturbances and push NDVI recovery beyond its current ${recoveryPercent.toFixed(
      0,
    )}% level.`,
  };
}

function getAnalysisData(selectedPeriod: TimePeriod, annualState: AnnualState): AnalysisData | null {
  if (selectedPeriod === "1-month") {
    return MONTHLY_ANALYSIS;
  }

  if (selectedPeriod === "1-year" && annualState.status === "ready") {
    return annualState.data;
  }

  return null;
}

function AnalysisResults({ data }: { data: AnalysisData }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Analysis Results</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AnalysisMetric icon={TrendingUp} value={data.vegetationChange} label="Vegetation Change" trend="up" />
        <AnalysisMetric icon={TreeDeciduous} value={data.treesToPlant} label="Trees to Plant" />
        <AnalysisMetric icon={Leaf} value={data.ndviScore} label="Avg NDVI Score" trend="up" />
        <AnalysisMetric icon={BarChart3} value={data.coverageArea} label="Coverage Area" trend="neutral" />
      </div>

      <div className="p-4 bg-accent/50 rounded-lg">
        <h3 className="font-semibold mb-2">Summary</h3>
        <p className="text-muted-foreground">{data.summary}</p>
      </div>
    </section>
  );
}

function MapSection() {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">NDVI Change Map</h2>
      <p className="text-muted-foreground mb-6">
        Pan and zoom to spot where vegetation has thickened or thinned across the region.
      </p>
      <div className="rounded-lg overflow-hidden border border-border">
        <NDVIMap />
      </div>
    </section>
  );
}
