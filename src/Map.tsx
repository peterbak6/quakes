import { useRef, useState } from "react";
import DeckGL from "@deck.gl/react";
import { Map as MapLibre } from "@vis.gl/react-maplibre";
import { ScatterplotLayer, PathLayer, PolygonLayer } from "@deck.gl/layers";
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

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export interface BBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

type DragHandle = "move" | "n" | "s" | "e" | "w";
interface DragState {
  handle: DragHandle;
  startCoord: [number, number];
  startBbox: BBox;
}

interface Handle {
  id: DragHandle;
  position: [number, number, number];
}

interface MapProps {
  quakes: Quake[];
  bbox: BBox;
  sizeFactor: number;
  onBboxChange: (bbox: BBox) => void;
}

function applyDrag(drag: DragState, coord: [number, number]): BBox {
  const dLon = coord[0] - drag.startCoord[0];
  const dLat = coord[1] - drag.startCoord[1];
  const b = drag.startBbox;
  switch (drag.handle) {
    case "move":
      return {
        minLon: b.minLon + dLon,
        maxLon: b.maxLon + dLon,
        minLat: b.minLat + dLat,
        maxLat: b.maxLat + dLat,
      };
    case "n":
      return { ...b, maxLat: Math.max(b.maxLat + dLat, b.minLat + 0.1) };
    case "s":
      return { ...b, minLat: Math.min(b.minLat + dLat, b.maxLat - 0.1) };
    case "e":
      return { ...b, maxLon: Math.max(b.maxLon + dLon, b.minLon + 0.1) };
    case "w":
      return { ...b, minLon: Math.min(b.minLon + dLon, b.maxLon - 0.1) };
  }
}

export default function MapView({
  quakes,
  bbox,
  sizeFactor,
  onBboxChange,
}: MapProps) {
  const dragRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const midLon = (bbox.minLon + bbox.maxLon) / 2;
  const midLat = (bbox.minLat + bbox.maxLat) / 2;

  const handles: Handle[] = [
    { id: "n", position: [midLon, bbox.maxLat, 0] },
    { id: "s", position: [midLon, bbox.minLat, 0] },
    { id: "e", position: [bbox.maxLon, midLat, 0] },
    { id: "w", position: [bbox.minLon, midLat, 0] },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startDrag = (handle: DragHandle) => (info: any) => {
    if (!info.coordinate) return;
    dragRef.current = {
      handle,
      startCoord: [info.coordinate[0], info.coordinate[1]],
      startBbox: { ...bbox },
    };
    setIsDragging(true);
    return true; // stop map pan
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const duringDrag = (info: any) => {
    if (!info.coordinate || !dragRef.current) return;
    onBboxChange(
      applyDrag(dragRef.current, [info.coordinate[0], info.coordinate[1]]),
    );
    return true;
  };

  const endDrag = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  const bboxRing = [
    [bbox.minLon, bbox.minLat],
    [bbox.maxLon, bbox.minLat],
    [bbox.maxLon, bbox.maxLat],
    [bbox.minLon, bbox.maxLat],
  ];

  const layers = [
    // Transparent fill — drag to move the whole rect
    new PolygonLayer({
      id: "bbox-fill",
      data: [{ polygon: bboxRing }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getPolygon: (d: any) => d.polygon,
      getLineColor: [255, 140, 0, 220],
      getLineWidth: 2,
      lineWidthMinPixels: 2,
      filled: false,
      stroked: true,
      pickable: true,
      getDashArray: [8, 5],
      extensions: [new PathStyleExtension({ dash: true })],
      onDragStart: startDrag("move"),
      onDrag: duringDrag,
      onDragEnd: endDrag,
    }),

    // Edge-midpoint resize handles
    new ScatterplotLayer<Handle>({
      id: "bbox-handles",
      data: handles,
      getPosition: (d) => d.position,
      getRadius: 5,
      radiusUnits: "pixels",
      getFillColor: [255, 255, 255, 240],
      getLineColor: [255, 140, 0, 255],
      lineWidthMinPixels: 2,
      stroked: true,
      pickable: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onDragStart: (info: any) =>
        info.object ? startDrag(info.object.id as DragHandle)(info) : undefined,
      onDrag: duringDrag,
      onDragEnd: endDrag,
    }),

    // Earthquake circles
    new ScatterplotLayer<Quake>({
      id: "quakes",
      data: quakes,
      getPosition: (d) => d.coords,
      getRadius: (d) => getPixelRadius(d.magnitude, sizeFactor),
      updateTriggers: { getRadius: sizeFactor },
      radiusUnits: "pixels",
      getFillColor: [220, 50, 20, 128],
      getLineColor: [220, 50, 20, 255],
      lineWidthMinPixels: 0.5,
      stroked: true,
      pickable: true,
    }),
  ];

  return (
    <DeckGL
      initialViewState={INITIAL_VIEW}
      controller={isDragging ? { dragPan: false } : true}
      layers={layers}
      style={{ position: "absolute", inset: "0" }}
      getCursor={({ isHovering }) =>
        isDragging ? "grabbing" : isHovering ? "grab" : "default"
      }
      getTooltip={({ object }) => {
        const q = object as Quake | null;
        if (!q || !("magnitude" in q)) return null;
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
