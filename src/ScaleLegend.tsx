import { useEffect, useState } from "react";
import { earthquakePixelRadius } from "./util";
import type { RadiusParams } from "./util";

const SCALE_MAGS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const PAD = 16; // padding from screen edge to bar origin
const TICK_HALF = 5; // half-height of each tick mark
const LABEL_GAP = 4; // gap between tick end and label

interface Props {
  radiusParams: RadiusParams;
}

export default function ScaleLegend({ radiusParams }: Props) {
  const [dims, setDims] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });

  useEffect(() => {
    const handler = () =>
      setDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const horizontal = dims.w >= dims.h;
  // How much screen space is available for the bar (leave PAD on both sides)
  const panelW = 300 + 24; // nav panel width + its left offset
  const maxBarLen = horizontal
    ? dims.w - panelW - PAD * 3 // sits to the right of the panel
    : dims.h - PAD * 3; // vertical: full height minus padding

  // Compute raw pixel radii, deduplicate, then drop those that exceed the bar
  const seenPx = new Set<number>();
  const ticks = SCALE_MAGS.map((m) => ({
    m,
    px: earthquakePixelRadius(m, radiusParams.depthRef, radiusParams),
  })).filter(({ px }) => {
    const rounded = Math.round(px);
    if (seenPx.has(rounded)) return false;
    seenPx.add(rounded);
    return px <= maxBarLen;
  });

  const barLen = Math.min(
    ticks.length ? ticks[ticks.length - 1].px : 0,
    maxBarLen,
  );
  const horizontal2 = horizontal; // alias for JSX clarity
  const stroke = "rgba(0,0,0,0.4)";
  const fontSize = 9;

  if (horizontal2) {
    // Bar runs left→right; tick at `px` is exactly `px` pixels from origin.
    const svgW = barLen + PAD;
    const lineY = TICK_HALF + 1;
    const svgH = lineY + TICK_HALF + LABEL_GAP + fontSize + 2;

    return (
      <svg
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          pointerEvents: "none",
        }}
        width={svgW}
        height={svgH}
        aria-label="Magnitude radius scale"
      >
        {/* baseline */}
        <line
          x1={0}
          y1={lineY}
          x2={barLen}
          y2={lineY}
          stroke={stroke}
          strokeWidth={1}
        />
        {/* origin tick */}
        <line
          x1={0}
          y1={lineY - TICK_HALF}
          x2={0}
          y2={lineY + TICK_HALF}
          stroke={stroke}
          strokeWidth={1}
        />
        {ticks.map(({ m, px }) => (
          <g key={m}>
            <line
              x1={px}
              y1={lineY - TICK_HALF}
              x2={px}
              y2={lineY + TICK_HALF}
              stroke={stroke}
              strokeWidth={1}
            />
            <text
              x={px}
              y={lineY + TICK_HALF + LABEL_GAP + fontSize}
              textAnchor="middle"
              fontSize={fontSize}
              fill={stroke}
              fontFamily="inherit"
            >
              {m}
            </text>
          </g>
        ))}
      </svg>
    );
  } else {
    // Bar runs bottom→top; tick at `px` is exactly `px` pixels above origin.
    const svgH = barLen + PAD;
    const originY = svgH - 1;
    const lineX = fontSize + LABEL_GAP + TICK_HALF + 1;
    const svgW = lineX + TICK_HALF + 1;

    return (
      <svg
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          pointerEvents: "none",
        }}
        width={svgW}
        height={svgH}
        aria-label="Magnitude radius scale"
      >
        {/* baseline */}
        <line
          x1={lineX}
          y1={originY}
          x2={lineX}
          y2={originY - barLen}
          stroke={stroke}
          strokeWidth={1}
        />
        {/* origin tick */}
        <line
          x1={lineX - TICK_HALF}
          y1={originY}
          x2={lineX + TICK_HALF}
          y2={originY}
          stroke={stroke}
          strokeWidth={1}
        />
        {ticks.map(({ m, px }) => (
          <g key={m}>
            <line
              x1={lineX - TICK_HALF}
              y1={originY - px}
              x2={lineX + TICK_HALF}
              y2={originY - px}
              stroke={stroke}
              strokeWidth={1}
            />
            <text
              x={lineX - TICK_HALF - LABEL_GAP}
              y={originY - px + fontSize / 2 - 1}
              textAnchor="end"
              fontSize={fontSize}
              fill={stroke}
              fontFamily="inherit"
            >
              {m}
            </text>
          </g>
        ))}
      </svg>
    );
  }
}
