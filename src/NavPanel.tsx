import { useState } from "react";
import type { QuakeParams } from "./hooks/useEarthquakes";
import { earthquakePixelRadius } from "./util";
import type { RadiusParams } from "./util";

const SCALE_MAGS = [3, 4, 5, 6, 7, 8, 9];
const BAR_W = 260;
const X0 = 0;

interface NavPanelProps {
  params: QuakeParams;
  onChange: (p: QuakeParams) => void;
  onFetch: () => void;
  loading: boolean;
  count: number;
  error: string | null;
  radiusParams: RadiusParams;
  onRadiusParamsChange: (p: RadiusParams) => void;
}

export default function NavPanel({
  params,
  onChange,
  onFetch,
  loading,
  count,
  error,
  radiusParams,
  onRadiusParamsChange,
}: NavPanelProps) {
  const set = (key: keyof RadiusParams, val: number) =>
    onRadiusParamsChange({ ...radiusParams, [key]: val });
  const [openSection, setOpenSection] = useState<
    "earthquakes" | "impact" | null
  >("earthquakes");

  const toggle = (s: "earthquakes" | "impact") =>
    setOpenSection((cur) => (cur === s ? null : s));

  return (
    <div className="slider-panel">
      {/* ── Section 1: EARTHQUAKES ── */}
      <button className="section-toggle" onClick={() => toggle("earthquakes")}>
        <span className="section-toggle-title">Earthquakes</span>
        <span className="section-toggle-icon">
          {openSection === "earthquakes" ? "▾" : "▸"}
        </span>
      </button>

      {openSection === "earthquakes" && (
        <div className="panel-section">
          <p className="legend-desc">
            The goal is to show where earthquakes occurred, and also to give a
            sense of how their impact compares.
          </p>

          {/* 2×2 bounding box grid */}
          <div className="bbox-grid">
            <div />
            <div className="bbox-cell bbox-cell--top">
              <input
                type="number"
                className="settings-input"
                step="0.1"
                placeholder="max lat"
                value={params.maxlatitude}
                onChange={(e) =>
                  onChange({ ...params, maxlatitude: Number(e.target.value) })
                }
              />
            </div>
            <div />
            <div className="bbox-cell bbox-cell--left">
              <input
                type="number"
                className="settings-input"
                step="0.1"
                placeholder="min lon"
                value={params.minlongitude}
                onChange={(e) =>
                  onChange({ ...params, minlongitude: Number(e.target.value) })
                }
              />
            </div>
            <div className="bbox-cell bbox-cell--center">
              <span className="bbox-compass">□</span>
            </div>
            <div className="bbox-cell bbox-cell--right">
              <input
                type="number"
                className="settings-input"
                step="0.1"
                placeholder="max lon"
                value={params.maxlongitude}
                onChange={(e) =>
                  onChange({ ...params, maxlongitude: Number(e.target.value) })
                }
              />
            </div>
            <div />
            <div className="bbox-cell bbox-cell--bottom">
              <input
                type="number"
                className="settings-input"
                step="0.1"
                placeholder="min lat"
                value={params.minlatitude}
                onChange={(e) =>
                  onChange({ ...params, minlatitude: Number(e.target.value) })
                }
              />
            </div>
            <div />
          </div>

          <div className="nav-row">
            <span className="nav-label">Start Date:</span>
            <input
              type="date"
              className="nav-date"
              value={params.starttime}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) =>
                onChange({ ...params, starttime: e.target.value })
              }
            />
          </div>

          <button className="fetch-btn" onClick={onFetch} disabled={loading}>
            {loading ? "Loading…" : "Fetch"}
          </button>

          <div className="nav-status">
            {loading ? (
              "Loading…"
            ) : error ? (
              <span className="nav-error">Error: {error}</span>
            ) : (
              <>
                <b>{count}</b> earthquakes
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Section 2: IMPACT AREA ── */}
      <button className="section-toggle" onClick={() => toggle("impact")}>
        <span className="section-toggle-title">Impact area</span>
        <span className="section-toggle-icon">
          {openSection === "impact" ? "▾" : "▸"}
        </span>
      </button>

      {openSection === "impact" && (
        <div className="panel-section">
          <p className="legend-desc">
            Circle size reflects earthquake energy, adjusted for depth. Larger
            magnitudes expand rapidly, while deeper events are softened. Dotted
            line indicates the estimated felt radius by people.
          </p>

          <div className="param-list">
            {(
              [
                [
                  "magRef",
                  "Reference magnitude",
                  "1",
                  "8",
                  "0.5",
                  (v: number) => v,
                  "what magnitude is considered a “typical” earthquake",
                ],
                [
                  "depthRef",
                  "Reference depth (km)",
                  "0",
                  "100",
                  "1",
                  (v: number) => v,
                  "baseline depth where no attenuation is applied",
                ],
                [
                  "d0",
                  "Surface softening (km)",
                  "0",
                  "50",
                  "1",
                  (v: number) => v,
                  "how fast energy fades near the surface",
                ],
                [
                  "gamma",
                  "\u03b3 attenuation",
                  "0.2",
                  "4",
                  "0.1",
                  (v: number) => v.toFixed(1),
                  "how much should depth reduce the impact",
                ],
                [
                  "rRef",
                  "Reference size (px)",
                  "1",
                  "60",
                  "1",
                  (v: number) => v,
                  "how large a “typical” earthquake appears on the map",
                ],
              ] as [
                keyof RadiusParams,
                string,
                string,
                string,
                string,
                (v: number) => string | number,
                string,
              ][]
            ).map(([key, label, min, max, step, fmt, desc]) => (
              <div key={key} className="param-row">
                <div className="param-header">
                  <span className="settings-label">{label}</span>
                  <span className="nav-value">
                    {fmt(radiusParams[key] as number)}
                  </span>
                </div>
                <span className="settings-desc">{desc}</span>
                <input
                  type="range"
                  className="date-range"
                  min={min}
                  max={max}
                  step={step}
                  value={radiusParams[key] as number}
                  onChange={(e) => set(key, Number(e.target.value))}
                />
              </div>
            ))}
          </div>

          {/* Scale-line legend: ticks at reference depth */}
          {(() => {
            const ticks = SCALE_MAGS.map((m) => ({
              m,
              x:
                X0 +
                earthquakePixelRadius(m, radiusParams.depthRef, radiusParams),
            })).filter((t) => t.x <= X0 + BAR_W);
            return (
              <svg
                className="size-legend-svg"
                width="100%"
                height="26"
                aria-label="Radius scale"
              >
                <line
                  x1={X0}
                  y1={8}
                  x2={X0 + BAR_W}
                  y2={8}
                  stroke="#bbb"
                  strokeWidth="1"
                />
                <line
                  x1={X0}
                  y1={4}
                  x2={X0}
                  y2={12}
                  stroke="#bbb"
                  strokeWidth="1"
                />
                {ticks.map(({ m, x }) => (
                  <g key={m}>
                    <line
                      x1={x}
                      y1={4}
                      x2={x}
                      y2={12}
                      stroke="#999"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={22}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#888"
                      fontFamily="inherit"
                    >
                      {m}
                    </text>
                  </g>
                ))}
              </svg>
            );
          })()}
        </div>
      )}

      {/* ── Footer: always visible ── */}
      <div className="panel-divider" />
      <div className="panel-footer">
        <a
          className="data-source-link"
          href="https://earthquake.usgs.gov"
          target="_blank"
          rel="noopener noreferrer"
        >
          USGS Earthquake Catalog
        </a>
        <p className="data-source-link" style={{ opacity: 0.25 }}>
          © 2026 Peter Bak ·{" "}
          <a
            href="https://visualanalytics.co.il"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            VisualAnalytics
          </a>
        </p>
      </div>
    </div>
  );
}
