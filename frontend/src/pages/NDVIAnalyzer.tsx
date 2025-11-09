import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import NDVIMap from "../components/NDVIMap";
import AnalysisMetric from "../components/AnalysisMetric";
import { Activity, BadgeCheck, Leaf, TrendingUp, TreeDeciduous, BarChart3, Calendar } from "lucide-react";

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

type NDVISectionVariant = "page" | "home";

export default function NDVIAnalyzer() {
  return <NDVISection variant="page" />;
}

export function NDVISection({ variant = "page" }: { variant?: NDVISectionVariant }) {
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
            message: "Unable to load the latest NDVI analysis. Please try again soon.",
          });
        }
      }
    }

    loadAnnualAnalysis();
    return () => {
      cancelled = true;
    };
  }, []);

  const containerClasses =
    variant === "page" ? "p-4 md:p-10 max-w-[1200px] xl:max-w-[1400px] mx-auto" : "max-w-[1200px] xl:max-w-[1400px] mx-auto";

  return (
    <div className={containerClasses}>
      <div className="space-y-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
          <ProblemSection state={annualState} />
          <SolutionSection />
        </div>

        <div>
          <h3 className="text-2xl font-bold mb-4">Where it&apos;s happening</h3>
          <p className="text-muted-foreground mb-6">
            Pollination flights follow live NDVI layers so drones can focus on the orchards and
            fields most at risk. Explore the latest vegetation changes below.
          </p>
          <div className="rounded-xl border border-border overflow-hidden shadow-sm">
            <NDVIMap />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProblemSection({ state }: { state: AnnualState }) {
  const isLoading = state.status === "idle" || state.status === "loading";
  const hasError = state.status === "error";
  const data = state.status === "ready" ? state.data : null;

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <h2 className="text-3xl font-bold">The Problem</h2>
        <p className="text-muted-foreground text-lg">
          Widespread canopy loss is starving out pollinators. As flowering zones thin and tree stands
          disappear, native bee populations crash, pollination rates dip, and the environment
          struggles to recover.
        </p>
      </header>

      {isLoading && (
        <div className="bg-muted/30 border border-dashed border-border rounded-lg p-10 text-center">
          <Calendar className="h-14 w-14 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground text-base">
            Hang tight—we&apos;re pulling in the latest NDVI picture.
          </p>
        </div>
      )}

      {hasError && state.status === "error" && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
          <p className="text-destructive font-medium">{state.message}</p>
        </div>
      )}

      {data && (
        <div className="bg-card border border-card-border rounded-lg p-6 md:p-8 space-y-6">
          <p className="text-muted-foreground">
            NDVI monitoring shows just how fast our green cover is fading. The figures below call
            out the canopy shifts and replanting gaps driving today&apos;s pollination crisis.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnalysisMetric
              icon={TrendingUp}
              value={data.vegetationChange}
              label="Vegetation change"
              trend="down"
            />
            <AnalysisMetric icon={TreeDeciduous} value={data.treesToPlant} label="Trees to plant" />
            <AnalysisMetric icon={Leaf} value={data.ndviScore} label="Avg NDVI score" trend="down" />
            <AnalysisMetric icon={BarChart3} value={data.coverageArea} label="Coverage area" />
          </div>

          <div className="p-4 bg-accent/40 rounded-lg">
            <h3 className="font-semibold mb-2">NDVI summary</h3>
            <p className="text-muted-foreground">{data.summary}</p>
          </div>
        </div>
      )}

      <Button
        size="lg"
        className="mt-4 bg-yellow-300 text-slate-900 hover:bg-yellow-300/90 font-semibold px-8"
        asChild
      >
        <a href="/community-action">What you can do to help</a>
      </Button>
    </section>
  );
}

function SolutionSection() {
  const stats = [
    {
      icon: Activity,
      label: "Active drones",
      value: "20",
    },
    {
      icon: Leaf,
      label: "Flowers pollinated",
      value: "1.24k",
    },
    {
      icon: BadgeCheck,
      label: "Success rate",
      value: "98.2%",
    },
  ];

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <h2 className="text-3xl font-bold text-primary">The Solution</h2>
        <p className="text-muted-foreground text-lg">
          In addition to community tree planting, Polli-tech deploys lightweight drones to carry
          pollen between isolated blooms, stitching the landscape back together while native
          populations recover. Each mission is guided by live NDVI layers so the drones target the
          plants most at risk.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-card-border bg-card p-5 shadow-sm space-y-3"
            >
              <Icon className="h-6 w-6 text-primary" />
              <p className="text-3xl font-semibold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}

        <div className="rounded-xl border border-yellow-400/60 bg-yellow-400/10 p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-yellow-200">Mission control</h3>
            <p className="text-sm text-yellow-100/80 mt-1">
              Track upcoming drone sorties, review pollen routes, and schedule new rescue flights.
            </p>
          </div>
          <Button
            size="lg"
            className="mt-6 w-full bg-yellow-300 text-slate-900 hover:bg-yellow-300/90 font-semibold"
            asChild
          >
            <Link href="/heatmap">
              View drone missions
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-card-border bg-card/80 p-6 md:p-8 space-y-4 shadow-sm">
        <h3 className="text-xl font-semibold text-foreground">The full solution</h3>
        <p className="text-muted-foreground">
          Our drones give the municipality real-time reach—pollinating distant fields and scouting
          canopy gaps—while weekly community plantings rebuild the on-the-ground habitats those
          pollinators rely on. Together, the tech and the neighbors close the loop.
        </p>
        <p className="text-sm text-muted-foreground">
          Tap the yellow mission control tile to watch upcoming sorties, then join us on Tuesdays,
          Wednesdays, weekends, and pop-up planting days to keep new trees in the ground.
        </p>
      </div>
    </section>
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