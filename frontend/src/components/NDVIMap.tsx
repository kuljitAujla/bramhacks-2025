import { useEffect, useMemo, useRef, useState } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import type { FeatureCollection, Geometry, Position } from "geojson";
import L, {
  latLngBounds,
  type LatLngBounds,
  type LatLngBoundsExpression,
  type LatLngTuple,
  type Map as LeafletMap,
  type PathOptions,
} from "leaflet";
import "leaflet/dist/leaflet.css";

type SummaryData = {
  loss_km2: number;
  gain_km2: number;
  trees_needed: number;
};

type MapData = {
  increase: FeatureCollection<Geometry> | null;
  decrease: FeatureCollection<Geometry> | null;
  summary: SummaryData | null;
};

const DEFAULT_CENTER: LatLngTuple = [43.7, -79.7];
const DEFAULT_ZOOM = 11;

const INCREASE_STYLE: PathOptions = {
  color: "#00cc44",
  weight: 1,
  fillColor: "#33cc33",
  fillOpacity: 0.5,
};

const DECREASE_STYLE: PathOptions = {
  color: "#cc3300",
  weight: 1,
  fillColor: "#ff3300",
  fillOpacity: 0.5,
};

const NDVIMap = () => {
  const [data, setData] = useState<MapData>({ increase: null, decrease: null, summary: null });
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [increase, decrease, summary] = await Promise.all([
          fetch("/data/increase.geojson").then((response) => response.json()),
          fetch("/data/decrease.geojson").then((response) => response.json()),
          fetch("/data/summary.json").then((response) => response.json()),
        ]);

        if (!cancelled) {
          setData({
            increase: increase as FeatureCollection<Geometry>,
            decrease: decrease as FeatureCollection<Geometry>,
            summary: summary as SummaryData,
          });
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

  const mapBounds = useMemo(() => {
    const layers = [data.increase, data.decrease].filter(Boolean) as FeatureCollection<Geometry>[];
    return layers.length > 0 ? computeBounds(layers) : null;
  }, [data.increase, data.decrease]);

  useEffect(() => {
    if (!mapBounds) return;

    const map = mapRef.current;
    if (!map) return;

    const viewBounds = mapBounds.pad(0.05);
    map.fitBounds(viewBounds, { animate: false });

    const restricted = mapBounds.pad(0.2);
    map.setMaxBounds(restricted);
    map.setMinZoom(map.getBoundsZoom(restricted));
  }, [mapBounds]);

  const restrictedBounds: LatLngBoundsExpression | undefined = mapBounds?.pad(0.2);

  return (
    <div className="relative h-[32rem] md:h-[36rem]">
      <MapContainer
        bounds={mapBounds ?? undefined}
        center={mapBounds ? undefined : DEFAULT_CENTER}
        zoom={mapBounds ? undefined : DEFAULT_ZOOM}
        style={{ height: "100%", width: "100%" }}
        preferCanvas
        maxBounds={restrictedBounds}
        maxBoundsViscosity={1}
        wheelDebounceTime={40}
        wheelPxPerZoomLevel={140}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors'
          noWrap
        />

        {data.increase && <GeoJSON data={data.increase} style={INCREASE_STYLE} />}
        {data.decrease && <GeoJSON data={data.decrease} style={DECREASE_STYLE} />}

        <LegendControl />
      </MapContainer>

      {data.summary && <SummaryPanel summary={data.summary} />}
    </div>
  );
};

export default NDVIMap;

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

const expandBoundsWithGeometry = (geometry: Geometry, current: LatLngBounds | null): LatLngBounds | null => {
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
        current,
      );
    default:
      return current;
  }
};

const extendBounds = (bounds: LatLngBounds | null, position: Position): LatLngBounds => {
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
      div.style.padding = "8px 10px";
      div.style.borderRadius = "8px";
      div.style.fontSize = "14px";
      div.style.lineHeight = "1.4";
      div.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
      div.style.display = "inline-block";

      div.innerHTML = `
        <div style="display:flex;align-items:center;margin-bottom:4px;">
          <span style="background:#ff3300;width:14px;height:14px;display:inline-block;margin-right:6px;border:1px solid #cc3300;"></span>
          Vegetation Decrease
        </div>
        <div style="display:flex;align-items:center;">
          <span style="background:#33cc33;width:14px;height:14px;display:inline-block;margin-right:6px;border:1px solid #00cc44;"></span>
          Vegetation Increase
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

function SummaryPanel({ summary }: { summary: SummaryData }) {
  return (
    <div className="absolute top-5 right-5 w-60 rounded-lg bg-white/95 px-4 py-3 text-sm shadow-lg ring-1 ring-black/5">
      <h4 className="mb-2 font-semibold text-slate-800">NDVI change: 2024 to 2025</h4>
      <p className="space-y-1 text-slate-700">
        <span className="block">
          <strong>Loss:</strong> {summary.loss_km2.toFixed(2)} km²
        </span>
        <span className="block">
          <strong>Gain:</strong> {summary.gain_km2.toFixed(2)} km²
        </span>
        <span className="block">
          <strong>Trees needed:</strong> {summary.trees_needed.toLocaleString()}
        </span>
      </p>
      <p className="mt-2 text-xs text-slate-500">These numbers update as we pull in the latest imagery.</p>
    </div>
  );
}
