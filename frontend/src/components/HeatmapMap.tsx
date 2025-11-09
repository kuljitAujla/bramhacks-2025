import { useEffect, useMemo, useRef, useState } from "react";
import { GeoJSON, MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { FeatureCollection, Geometry } from "geojson";
import L, {
  latLngBounds,
  type LatLngBounds,
  type LatLngBoundsExpression,
  type LatLngTuple,
  type Map as LeafletMap,
  type PathOptions,
} from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Mission } from "@/services/missionService";
import { MapPin } from "lucide-react";

// Fix for default marker icons in React-Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

type HeatmapMapProps = {
  decreaseMissions: Mission[];
  increaseMissions: Mission[];
  selectedMission: Mission | null;
  onMissionSelect: (mission: Mission | null) => void;
};

const DEFAULT_CENTER: LatLngTuple = [43.7, -79.7];
const DEFAULT_ZOOM = 11;

const INCREASE_STYLE: PathOptions = {
  color: "#00cc44",
  weight: 2,
  fillColor: "#33cc33",
  fillOpacity: 0.6,
};

const DECREASE_STYLE: PathOptions = {
  color: "#cc3300",
  weight: 2,
  fillColor: "#ff3300",
  fillOpacity: 0.6,
};

const MISSION_STYLE: PathOptions = {
  color: "#0066ff",
  weight: 3,
  fillColor: "#0066ff",
  fillOpacity: 0.4,
};

const SELECTED_MISSION_STYLE: PathOptions = {
  color: "#ff6600",
  weight: 4,
  fillColor: "#ff6600",
  fillOpacity: 0.6,
};

const HeatmapMap = ({
  decreaseMissions,
  increaseMissions,
  selectedMission,
  onMissionSelect,
}: HeatmapMapProps) => {
  const [decreaseData, setDecreaseData] = useState<FeatureCollection<Geometry> | null>(null);
  const [increaseData, setIncreaseData] = useState<FeatureCollection<Geometry> | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [decrease, increase] = await Promise.all([
          fetch("/data/decrease.geojson").then((response) => response.json()),
          fetch("/data/increase.geojson").then((response) => response.json()),
        ]);

        if (!cancelled) {
          // Filter out buildings and urban areas
          const filteredDecrease = filterBuildings(decrease);
          const filteredIncrease = filterBuildings(increase);
          setDecreaseData(filteredDecrease);
          setIncreaseData(filteredIncrease);
        }
      } catch (error) {
        console.error("Error loading NDVI layers:", error);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter out features that are likely buildings
  const filterBuildings = (geojson: FeatureCollection<Geometry>): FeatureCollection<Geometry> => {
    return {
      ...geojson,
      features: geojson.features.filter((feature) => {
        if (feature.geometry.type !== "Polygon") return true;

        const coordinates = feature.geometry.coordinates[0];
        if (coordinates.length < 4) return true;

        // Calculate area (simple approximation)
        const area = calculatePolygonArea(coordinates);
        
        // Filter out very small areas that are likely building footprints
        // Buildings are typically very small and square-like
        if (area < 0.000001) return false; // Very small areas
        
        // Check if it's roughly square (building-like)
        const bounds = getBounds(coordinates);
        const width = bounds.maxLng - bounds.minLng;
        const height = bounds.maxLat - bounds.minLat;
        const aspectRatio = width / height;
        
        // If it's roughly square and small, it's likely a building
        if (aspectRatio > 0.7 && aspectRatio < 1.3 && area < 0.00001) {
          return false;
        }

        return true;
      }),
    };
  };

  const calculatePolygonArea = (coordinates: number[][]): number => {
    if (coordinates.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      area += coordinates[i][0] * coordinates[j][1];
      area -= coordinates[j][0] * coordinates[i][1];
    }
    return Math.abs(area) / 2;
  };

  const getBounds = (coordinates: number[][]) => {
    const lngs = coordinates.map((c) => c[0]);
    const lats = coordinates.map((c) => c[1]);
    return {
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
    };
  };

  // Check if a point is within a polygon's bounding box
  const isPointInBounds = (point: number[], bounds: ReturnType<typeof getBounds>): boolean => {
    const [lng, lat] = point;
    return lng >= bounds.minLng && lng <= bounds.maxLng && lat >= bounds.minLat && lat <= bounds.maxLat;
  };

  // Check if a polygon intersects with or is within the mission bounds
  const isPolygonInMissionBounds = (
    polygonCoords: number[][],
    missionBounds: ReturnType<typeof getBounds>
  ): boolean => {
    // Check if any vertex of the polygon is within the mission bounds
    // Or if the polygon's center is within bounds
    const polygonBounds = getBounds(polygonCoords);
    
    // Check if bounding boxes intersect
    const boxesIntersect = !(
      polygonBounds.maxLng < missionBounds.minLng ||
      polygonBounds.minLng > missionBounds.maxLng ||
      polygonBounds.maxLat < missionBounds.minLat ||
      polygonBounds.minLat > missionBounds.maxLat
    );
    
    return boxesIntersect;
  };

  // Filter GeoJSON features to only show those within the selected mission
  const filterFeaturesByMission = (
    geojson: FeatureCollection<Geometry> | null,
    mission: Mission | null
  ): FeatureCollection<Geometry> | null => {
    if (!geojson || !mission) {
      return null; // Don't show anything if no mission is selected
    }

    // Get mission bounds
    const missionCoords = mission.coordinates || [];
    if (missionCoords.length === 0) {
      return null;
    }

    const missionBounds = getBounds(missionCoords);

    // Filter features that intersect with mission bounds
    const filteredFeatures = geojson.features.filter((feature) => {
      if (feature.geometry.type !== "Polygon") return false;

      const polygonCoords = feature.geometry.coordinates[0];
      if (!polygonCoords || polygonCoords.length === 0) return false;

      return isPolygonInMissionBounds(polygonCoords, missionBounds);
    });

    return {
      ...geojson,
      features: filteredFeatures,
    };
  };

  // Get filtered data based on selected mission
  // Create a stable key that changes when mission changes
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    // Force re-render when selected mission changes
    if (selectedMission) {
      setRenderKey(prev => prev + 1);
    }
  }, [selectedMission?.id]);

  const filteredDecreaseData = useMemo(() => {
    if (!selectedMission || !decreaseData) return null;
    const missionId = selectedMission.id;
    const missionCoords = selectedMission.coordinates;
    console.log(`Filtering decrease data for mission ${missionId}`, { missionCoords: missionCoords?.length });
    const filtered = filterFeaturesByMission(decreaseData, selectedMission);
    console.log(`Found ${filtered?.features.length || 0} decrease features for mission ${missionId}`);
    return filtered;
  }, [decreaseData, selectedMission?.id, JSON.stringify(selectedMission?.coordinates)]);

  const filteredIncreaseData = useMemo(() => {
    if (!selectedMission || !increaseData) return null;
    const missionId = selectedMission.id;
    const missionCoords = selectedMission.coordinates;
    console.log(`Filtering increase data for mission ${missionId}`, { missionCoords: missionCoords?.length });
    const filtered = filterFeaturesByMission(increaseData, selectedMission);
    console.log(`Found ${filtered?.features.length || 0} increase features for mission ${missionId}`);
    return filtered;
  }, [increaseData, selectedMission?.id, JSON.stringify(selectedMission?.coordinates)]);

  // Convert missions to GeoJSON features
  const missionFeatures = useMemo(() => {
    const features: any[] = [];
    
    const createMissionFeature = (mission: Mission, type: "decrease" | "increase") => {
      if (!mission.coordinates || mission.coordinates.length === 0) {
        return null;
      }

      // Ensure coordinates form a closed polygon
      let polygonCoords = mission.coordinates;
      
      // If coordinates don't form a closed ring, close it
      const firstCoord = polygonCoords[0];
      const lastCoord = polygonCoords[polygonCoords.length - 1];
      if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1]) {
        polygonCoords = [...polygonCoords, firstCoord];
      }

      // If we have fewer than 4 points (including closure), create a bounding box
      if (polygonCoords.length < 4) {
        const [lon, lat] = mission.center;
        const size = 0.001; // Small square around center
        polygonCoords = [
          [lon - size, lat - size],
          [lon + size, lat - size],
          [lon + size, lat + size],
          [lon - size, lat + size],
          [lon - size, lat - size],
        ];
      }

      return {
        type: "Feature",
        properties: {
          missionId: mission.id,
          reason: mission.reason,
          description: mission.description,
          type: type,
        },
        geometry: {
          type: "Polygon",
          coordinates: [polygonCoords],
        },
      };
    };
    
    decreaseMissions.forEach((mission) => {
      const feature = createMissionFeature(mission, "decrease");
      if (feature) features.push(feature);
    });

    increaseMissions.forEach((mission) => {
      const feature = createMissionFeature(mission, "increase");
      if (feature) features.push(feature);
    });

    return {
      type: "FeatureCollection",
      features,
    } as FeatureCollection<Geometry>;
  }, [decreaseMissions, increaseMissions]);

  const mapBounds = useMemo(() => {
    // When a mission is selected, use the filtered data to compute bounds
    // When no mission is selected, don't show the map (handled by parent)
    if (selectedMission) {
      const layers = [filteredDecreaseData, filteredIncreaseData].filter(
        Boolean
      ) as FeatureCollection<Geometry>[];
      
      // If we have filtered data, use it for bounds
      if (layers.length > 0 && layers.some(layer => layer.features.length > 0)) {
        return computeBounds(layers);
      }
      
      // Fallback: use mission center if no filtered data
      const missionCoords = selectedMission.coordinates || [];
      if (missionCoords.length > 0) {
        const missionBounds = getBounds(missionCoords);
        // Create a small bounds around the center point with padding
        const [lon, lat] = selectedMission.center;
        return latLngBounds([lat - 0.01, lon - 0.01], [lat + 0.01, lon + 0.01]);
      }
    }
    return null;
  }, [selectedMission, filteredDecreaseData, filteredIncreaseData]);

  useEffect(() => {
    if (!mapBounds || !selectedMission) return;
    const map = mapRef.current;
    if (!map) return;
    
    // Zoom to the selected mission with some padding
    const viewBounds = mapBounds.pad(0.1);
    map.fitBounds(viewBounds, { animate: true, maxZoom: 16 });
  }, [mapBounds, selectedMission]);

  const onEachMission = (feature: any, layer: L.Layer) => {
    const isSelected = selectedMission?.id === feature.properties.missionId;
    
    layer.on({
      click: () => {
        const mission = [...decreaseMissions, ...increaseMissions].find(
          (m) => m.id === feature.properties.missionId
        );
        if (mission) {
          onMissionSelect(mission);
          mapRef.current?.setView([mission.center[1], mission.center[0]], 15);
        }
      },
      mouseover: () => {
        layer.setStyle({
          weight: 5,
          fillOpacity: 0.7,
        });
      },
      mouseout: () => {
        layer.setStyle(isSelected ? SELECTED_MISSION_STYLE : MISSION_STYLE);
      },
    });
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        bounds={mapBounds ?? undefined}
        center={mapBounds ? undefined : DEFAULT_CENTER}
        zoom={mapBounds ? undefined : DEFAULT_ZOOM}
        style={{ height: "100%", width: "100%" }}
        preferCanvas
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors'
          noWrap
        />

        {/* Decrease areas (red) - only show if mission is selected */}
        {selectedMission && filteredDecreaseData && (
          filteredDecreaseData.features.length > 0 ? (
            <GeoJSON
              key={`decrease-${selectedMission.id}-${renderKey}`}
              data={filteredDecreaseData}
              style={DECREASE_STYLE}
              onEachFeature={(feature, layer) => {
                layer.bindTooltip("Vegetation Decrease", { permanent: false });
              }}
            />
          ) : null
        )}

        {/* Increase areas (green) - only show if mission is selected */}
        {selectedMission && filteredIncreaseData && (
          filteredIncreaseData.features.length > 0 ? (
            <GeoJSON
              key={`increase-${selectedMission.id}-${renderKey}`}
              data={filteredIncreaseData}
              style={INCREASE_STYLE}
              onEachFeature={(feature, layer) => {
                layer.bindTooltip("Vegetation Increase", { permanent: false });
              }}
            />
          ) : null
        )}

        {/* Mission marker - only show selected mission */}
        {selectedMission && (
          <Marker
            key={selectedMission.id}
            position={[selectedMission.center[1], selectedMission.center[0]]}
          >
            <Popup>
              <div>
                <h3 className="font-bold">Mission #{selectedMission.id}</h3>
                <p className="text-sm text-muted-foreground">{selectedMission.description}</p>
                <p className="text-xs mt-1">
                  Reason: {selectedMission.reason.replace("_", " ")}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        <LegendControl />
      </MapContainer>
    </div>
  );
};

export default HeatmapMap;

const computeBounds = (collections: FeatureCollection<Geometry>[]): LatLngBounds | null => {
  let bounds: LatLngBounds | null = null;

  for (const collection of collections) {
    for (const feature of collection.features ?? []) {
      if (!feature || !feature.geometry) continue;
      bounds = expandBoundsWithGeometry(feature.geometry, bounds);
    }
  }

  return bounds;
};

const expandBoundsWithGeometry = (
  geometry: Geometry,
  current: LatLngBounds | null
): LatLngBounds | null => {
  switch (geometry.type) {
    case "Point":
      return extendBounds(current, geometry.coordinates);
    case "MultiPoint":
    case "LineString":
      return geometry.coordinates.reduce(extendBounds, current);
    case "MultiLineString":
      return geometry.coordinates.flat().reduce(extendBounds, current);
    case "Polygon":
      return geometry.coordinates.flat().reduce(extendBounds, current);
    case "MultiPolygon":
      return geometry.coordinates.flat(2).reduce(extendBounds, current);
    case "GeometryCollection":
      return geometry.geometries.reduce<LatLngBounds | null>(
        (acc, child) => (child ? expandBoundsWithGeometry(child, acc) : acc),
        current
      );
    default:
      return current;
  }
};

const extendBounds = (bounds: LatLngBounds | null, position: number[]): LatLngBounds => {
  const [lng, lat] = position;
  if (!bounds) {
    return latLngBounds([lat, lng], [lat, lng]);
  }
  bounds.extend([lat, lng]);
  return bounds;
};

const LegendControl = () => {
  const map = useMap();

  useEffect(() => {
    const legend = new L.Control({ position: "bottomleft" });

    legend.onAdd = () => {
      const div = L.DomUtil.create("div", "ndvi-legend");
      div.style.background = "white";
      div.style.padding = "10px 12px";
      div.style.borderRadius = "8px";
      div.style.fontSize = "14px";
      div.style.lineHeight = "1.6";
      div.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
      div.style.display = "inline-block";
      div.style.minWidth = "200px";

      div.innerHTML = `
        <div style="display:flex;align-items:center;margin-bottom:6px;">
          <span style="background:#ff3300;width:16px;height:16px;display:inline-block;margin-right:8px;border:1px solid #cc3300;border-radius:2px;"></span>
          <span>Vegetation Decrease</span>
        </div>
        <div style="display:flex;align-items:center;">
          <span style="background:#33cc33;width:16px;height:16px;display:inline-block;margin-right:8px;border:1px solid #00cc44;border-radius:2px;"></span>
          <span>Vegetation Increase</span>
        </div>
      `;
      return div;
    };

    legend.addTo(map);
    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
};

