import { Satellite, Eye, Users, Zap, TrendingUp, Map, BarChart3 } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const features = [
    {
      icon: TrendingUp,
      title: "NDVI Analysis",
      description: "Track vegetation changes and ecosystem health.",
    },
    {
      icon: Map,
      title: "Environmental Heatmap",
      description: "Visualize regional environmental metrics.",
    },
    {
      icon: BarChart3,
      title: "AI-Powered Insights",
      description: "Get actionable recommendations for sustainable development.",
    },
  ];

  const impacts = [
    {
      icon: Eye,
      title: "See the Unseen",
      description: "Satellite imagery reveals patterns invisible from ground level.",
    },
    {
      icon: Users,
      title: "Empower Communities",
      description: "Data-driven insights help communities make better decisions.",
    },
    {
      icon: Zap,
      title: "Create Lasting Impact",
      description: "Monitor progress and measure outcomes over time.",
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="flex flex-col items-center justify-center px-4 py-20 md:py-32 text-center">
        <div className="flex items-center gap-3 mb-6">
          <Satellite className="h-16 w-16 text-primary" />

        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl">
          Transforming Lives Through Satellite Intelligence
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
          Using satellite data to create sustainable solutions and improve communities
          </p>

        <div className="flex gap-4 flex-wrap justify-center">

          <Link href="/ndvi-analyzer">
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover-elevate active-elevate-2 font-medium">
              Start Analysis
            </button>
          </Link>
          <Link href="/about">
            <button className="px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover-elevate active-elevate-2 font-medium">
              Learn More
            </button>
          </Link>
        </div>
      </section>

      <section className="px-4 py-16 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How Satellite Imagery Changes Lives</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            From tracking deforestation to monitoring crop health, satellite data provides the insights you need.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {impacts.map((impact, i) => {
              const Icon = impact.icon;

              return (
                <div
                  key={i}
                  className="flex flex-col items-center text-center p-6 bg-background border border-border rounded-lg hover-elevate"
                >
                  <div className="p-4 bg-primary/10 rounded-lg mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold mb-3">{impact.title}</h3>
                  <p className="text-muted-foreground">{impact.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Our Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;

            return (
              <div
                key={i}
                className="flex flex-col p-6 bg-card border border-card-border rounded-lg hover-elevate" >
                <Icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-4 py-16 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Making a Difference</h2>

        <div className="space-y-4 text-muted-foreground">
          <p>
            Sustaina-Satellite brings satellite observation to everyone working toward a sustainable future. 
            Whether you're monitoring environmental change or planning conservation initiatives, our platform 
            provides the data and insights you need.
          </p>
          <p>
            By making satellite imagery accessible, we enable communities and researchers to create lasting 
            positive impact.
          </p>
        </div>
        
      </section>
    </div>
  );
}
