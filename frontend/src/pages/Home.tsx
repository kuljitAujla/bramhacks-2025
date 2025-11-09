import { Hexagon } from "lucide-react";
import { NDVISection } from "./NDVIAnalyzer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="flex flex-col items-center justify-center px-4 py-20 md:py-32 text-center">
        <div className="flex items-center gap-3 mb-6">
          <Hexagon className="h-16 w-16 text-primary" />
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl">
          Transforming Lives Through Satellite Intelligence
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
          Using satellite data to create sustainable solutions and improve communities
          </p>

      </section>

      <section className="px-4 py-16 bg-muted/30">
        <NDVISection variant="home" />
      </section>
    </div>
  );
}
