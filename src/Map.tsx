import DeckGL from "@deck.gl/react";
import { Map as MapLibre } from "@vis.gl/react-maplibre";
import { ScatterplotLayer, PathLayer } from "@deck.gl/layers";
import { PathStyleExtension } from "@deck.gl/extensions";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Quake } from "./hooks/useEarthquakes";
import { getPixelRadius } from "./util";

const INITIAL_VIEW = {
  longitude: 35.0,
  latitude: 31.5,
  zoom: 6.5,
  pitch: 0,
  bearing: 0,
};

// Free Carto Positron "light" basemap — no API key required
const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export interface BBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

interface MapProps {
  quakes: Quake[];
  bbox: BBox;
  sizeFactor: number;
}

export default function MapView({ quakes, bbox, sizeFactor }: MapProps) {
  const bboxPath = [
    [bbox.minLon, bbox.minLat],
    [bbox.maxLon, bbox.minLat],
    [bbox.maxLon, bbox.maxLat],
    [bbox.minLon, bbox.maxLat],
    [bbox.minLon, bbox.minLat],
  ];

  const layers = [
    new PathLayer({
      id: "bbox",
      data: [{ path: bboxPath }],
      getPath: (d) => d.path,
      getColor: [255, 140, 0, 220],
      getWidth: 2,
      widthMinPixels: 2,
      getDashArray: [8, 5],
      extensions: [new PathStyleExtension({ dash: true })],
    }),
    new ScatterplotLayer<Quake>({
      id: "quakes",
      data: quakes,
      getPosition: (d) => d.coords,
      getRadius: (d) => getPixelRadius(d.magnitude, sizeFactor),
      updateTriggers: {
        getRadius: sizeFactor,
      },
      radiusUnits: "pixels",
      getFillColor: [220, 50, 20, 200],
      getLineColor: [255, 255, 255, 100],
      lineWidthMinPixels: 0.5,
      stroked: true,
      pickable: true,
    }),
  ];

  return (
    <DeckGL
      initialViewState={INITIAL_VIEW}
      controller
      layers={layers}
      style={{ position: "absolute", inset: "0" }}
      getTooltip={({ object }) => {
        const q = object as Quake | null;
        if (!q) return null;
        return {
          html: `<b>${q.location}</b><br/>M ${q.magnitude.toFixed(1)} — ${q.time}`,
          style: { fontSize: "12px" },
        };
      }}
    >
      <MapLibre mapStyle={MAP_STYLE} />
    </DeckGL>
  );
}
