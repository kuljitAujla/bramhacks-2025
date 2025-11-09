import { CalendarDays, MapPin, Droplets, TreePine } from "lucide-react";

const recurringSchedule = [
  {
    day: "Tuesday",
    time: "5:00 PM – 7:00 PM",
    location: "Cassie Campbell Community Centre",
    focus: "Street-tree planting and mulch refresh",
  },
  {
    day: "Wednesday",
    time: "5:00 PM – 7:00 PM",
    location: "Sandalwood Heights Secondary School",
    focus: "Schoolyard shade tree planting",
  },
  {
    day: "Saturday",
    time: "9:00 AM – 12:00 PM",
    location: "Claireville Conservation Area",
    focus: "Forest-edge sapling planting",
  },
  {
    day: "Sunday",
    time: "10:00 AM – 1:00 PM",
    location: "Brampton Fairgrounds",
    focus: "Community orchard tree installation",
  },
];

export default function CommunityAction() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-12">
      <header className="space-y-4 text-center">
        <h1 className="text-4xl font-bold text-primary">Community Tree Planting Days</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Polli-tech partners with local volunteers every Tuesday, Wednesday, and weekend to rebuild
          canopy corridors. Show up, lend a hand, and help our drones turn data into lasting habitat
          for pollinators.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card/80 p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Weekly Planting Schedule</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {recurringSchedule.map((slot) => (
            <article
              key={`${slot.day}-${slot.location}`}
              className="rounded-lg border border-card-border bg-card px-5 py-4 space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-foreground">{slot.day}</p>
                <span className="text-sm font-medium text-primary">{slot.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{slot.location}</span>
              </div>
              <p className="text-sm text-muted-foreground">{slot.focus}</p>
            </article>
          ))}

          <article className="rounded-lg border border-dashed border-card-border bg-muted/40 px-5 py-4 flex flex-col gap-3 justify-between">
            <div>
              <p className="text-lg font-semibold text-foreground">Future dates</p>
              <p className="text-sm text-muted-foreground">
                We&apos;re scouting additional neighborhoods based on NDVI alerts. New locations roll
                out monthly—stay tuned!
              </p>
            </div>
            <span className="text-sm text-muted-foreground">To be determined</span>
          </article>
        </div>
      </section>

      <section className="rounded-xl border border-primary/40 bg-primary/10 p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-primary">How we plant together</h2>
        <p className="text-muted-foreground">
          Each session starts with a quick briefing on how NDVI data guides our planting map. Team
          leads assign shovel crews, mulch crews, and hydration stewards so everyone plays a part in
          restoring tree cover along critical pollinator corridors.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-card-border bg-card p-5 space-y-3">
            <TreePine className="h-6 w-6 text-primary" />
            <p className="font-semibold text-foreground">We provide the gear</p>
            <p className="text-sm text-muted-foreground">
              Shovels, saplings, mulch, and snacks are on-site. Just bring energy and a willingness
              to dig in.
            </p>
          </div>
          <div className="rounded-lg border border-card-border bg-card p-5 space-y-3">
            <Droplets className="h-6 w-6 text-primary" />
            <p className="font-semibold text-foreground">Bring the essentials</p>
            <p className="text-sm text-muted-foreground">
              Pack a reusable water bottle and weather-ready clothes. Gloves are optional; we keep a
              fresh stash for anyone who needs them.
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Have a group that wants to join or need transportation support? Email
          missions@polli-tech.org and we&apos;ll set it up.
        </p>
      </section>
    </div>
  );
}

