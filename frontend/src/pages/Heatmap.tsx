import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, TreePine, Waves, Layers } from "lucide-react";
import { getAllMissions, type Mission } from "@/services/missionService";
import HeatmapMap from "@/components/HeatmapMap";

export default function Heatmap() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  useEffect(() => {
    async function loadMissions() {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Loading missions from API...");
        const allMissions = await getAllMissions();
        
        console.log("Loaded missions:", allMissions.length);
        
        // Limit to first 10 missions
        const limitedMissions = allMissions.slice(0, 10);
        setMissions(limitedMissions);
        
        if (limitedMissions.length === 0) {
          setError("No missions found. The backend may still be processing the data. Please check the backend server logs.");
        }
      } catch (err: any) {
        console.error("Error loading missions:", err);
        const errorMessage = err?.message || "Unknown error";
        setError(`Failed to load missions: ${errorMessage}. Please make sure the backend server is running on http://localhost:5000`);
      } finally {
        setLoading(false);
      }
    }

    loadMissions();
  }, []);

  const getMissionIcon = (reason: Mission["reason"]) => {
    switch (reason) {
      case "near_trail":
        return <MapPin className="h-5 w-5" />;
      case "near_water":
        return <Waves className="h-5 w-5" />;
      case "small_grouped":
        return <Layers className="h-5 w-5" />;
      default:
        return <TreePine className="h-5 w-5" />;
    }
  };

  const getMissionColor = (reason: Mission["reason"]) => {
    switch (reason) {
      case "near_trail":
        return "text-blue-600";
      case "near_water":
        return "text-cyan-600";
      case "small_grouped":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="flex h-full w-full min-h-0">
      {/* Missions Sidebar */}
      <div className="w-96 border-r border-border overflow-y-auto bg-card flex-shrink-0">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold mb-2">Planting Missions</h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading missions..."
              : `${missions.length} mission${missions.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {loading && (
          <div className="p-6 text-center text-muted-foreground">
            <div className="animate-pulse">Loading missions...</div>
          </div>
        )}

        {error && (
          <div className="p-6">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-destructive text-sm mb-4">{error}</p>
                <p className="text-xs text-muted-foreground">
                  To start the backend server, run: <code className="bg-muted px-2 py-1 rounded">cd backend/server && npm start</code>
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {!loading && !error && (
          <div className="p-4 space-y-4">
            {missions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No missions found. Check back later!
              </div>
            ) : (
              missions.map((mission) => (
                <Card
                  key={mission.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedMission?.id === mission.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedMission(mission)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className={getMissionColor(mission.reason)}>
                        {getMissionIcon(mission.reason)}
                      </div>
                      <CardTitle className="text-lg">Mission #{mission.id}</CardTitle>
                    </div>
                    <CardDescription>{mission.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {mission.center[1].toFixed(6)}, {mission.center[0].toFixed(6)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            mission.reason === "near_trail"
                              ? "bg-blue-100 text-blue-800"
                              : mission.reason === "near_water"
                                ? "bg-cyan-100 text-cyan-800"
                                : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {mission.reason.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 relative min-w-0 min-h-0 bg-muted/30">
        {selectedMission ? (
          <HeatmapMap
            decreaseMissions={missions}
            increaseMissions={[]}
            selectedMission={selectedMission}
            onMissionSelect={setSelectedMission}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Select a Mission</h2>
              <p className="text-muted-foreground">
                Click on a mission card to view it on the map
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
