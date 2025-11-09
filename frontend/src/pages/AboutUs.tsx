import { Users, Target, Heart } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">About Us</h1>

      <div className="space-y-8">
        <section className="bg-card border border-card-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-semibold">Our Mission</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Polli-tech aims to democratize access to satellite-based environmental monitoring. 
            We believe that data-driven insights are essential for sustainable development and ecosystem 
            conservation. Our platform empowers organizations and individuals to make informed decisions 
            about environmental stewardship.
          </p>
        </section>

        <section className="bg-card border border-card-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-semibold">Our Team</h2>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-4">
            We are a dedicated team of environmental scientists, software engineers, and data analysts 
            passionate about leveraging technology for positive environmental impact. Our multidisciplinary 
            approach combines expertise in remote sensing, machine learning, and sustainable development.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["Environmental Science", "Software Development", "Data Analysis"].map((expertise, i) => (
              <div
                key={i}
                className="p-4 bg-background rounded-lg text-center"
              >
                <p className="font-medium">{expertise}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border border-card-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-semibold">Our Values</h2>
          </div>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span><strong className="text-foreground">Sustainability:</strong> Promoting environmental conservation through data-driven insights</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span><strong className="text-foreground">Accessibility:</strong> Making advanced satellite analysis tools available to everyone</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span><strong className="text-foreground">Innovation:</strong> Continuously improving our algorithms and analysis capabilities</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span><strong className="text-foreground">Collaboration:</strong> Working together with communities and organizations worldwide</span>
            </li>
          </ul>


        </section>
      </div>
    </div>
  );
}
