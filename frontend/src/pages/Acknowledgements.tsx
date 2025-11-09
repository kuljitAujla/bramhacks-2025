import { Satellite, Database, Globe } from "lucide-react";

export default function Acknowledgements() {
  const dataSources = [
    {
      name: "NASA Earth Observing System Data",
      description: "Satellite imagery and NDVI data from NASA's Terra and Aqua satellites",
      icon: Satellite,
    },
    {
      name: "European Space Agency (ESA)",
      description: "Sentinel-2 multispectral imagery for vegetation analysis",
      icon: Globe,
    },
    {
      name: "NOAA Climate Data",
      description: "Climate and environmental monitoring datasets",
      icon: Database,
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Acknowledgements</h1>

      <div className="space-y-8">
        <section className="bg-card border border-card-border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Data Sources & Credits</h2>
          <p className="text-muted-foreground mb-6">
            This project relies on publicly available satellite data and environmental datasets. 
            We are grateful to the following organizations for making their data accessible to 
            researchers and developers worldwide.
          </p>

          <div className="space-y-4">
            {dataSources.map((source, index) => {
              const Icon = source.icon;
              return (
                <div
                  key={index}
                  className="flex gap-4 p-4 bg-background rounded-lg hover-elevate"
                  data-testid={`card-source-${index}`}
                >
                  <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{source.name}</h3>
                    <p className="text-sm text-muted-foreground">{source.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-card border border-card-border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Technology Stack</h2>
          <p className="text-muted-foreground mb-4">
            Built with modern web technologies and open-source libraries that enable fast, 
            responsive, and accessible environmental monitoring.
          </p>
          <div className="flex flex-wrap gap-2">
            {["React", "TypeScript", "Vite", "TailwindCSS", "Lucide Icons"].map((tech, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium"
                data-testid={`badge-tech-${index}`}
              >
                {tech}
              </span>
            ))}
          </div>
        </section>

        <section className="bg-card border border-card-border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Special Thanks</h2>
          <p className="text-muted-foreground">
            We extend our gratitude to the global community of environmental researchers, 
            open-source contributors, and sustainability advocates who inspire and support 
            projects like Polli-tech. Together, we can create a more sustainable future.
          </p>
        </section>
      </div>
    </div>
  );
}
