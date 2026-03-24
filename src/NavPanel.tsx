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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(true);

  return (
    <div className="slider-panel">
      {/* ── Section 1: header ── */}
      <div className="panel-header">
        <div className="panel-header-text">
          <p className="panel-title">Earthquakes</p>
          <p className="legend-desc">
            The goal is to show where earthquakes occurred, and also to give a
            sense of how their impact compares.
          </p>
        </div>
        <button
          className="settings-btn"
          title="Bounding box settings"
          onClick={() => setSettingsOpen((o) => !o)}
        >
          ⚙
        </button>
      </div>

      <div className="panel-section">
        {settingsOpen && (
          <>
            <div className="settings-grid">
              <span className="settings-label">Max lat</span>
              <input
                type="number"
                className="settings-input"
                step="0.1"
                value={params.maxlatitude}
                onChange={(e) =>
                  onChange({ ...params, maxlatitude: Number(e.target.value) })
                }
              />
              <span className="settings-label">Min lat</span>
              <input
                type="number"
                className="settings-input"
                step="0.1"
                value={params.minlatitude}
                onChange={(e) =>
                  onChange({ ...params, minlatitude: Number(e.target.value) })
                }
              />
              <span className="settings-label">Min lon</span>
              <input
                type="number"
                className="settings-input"
                step="0.1"
                value={params.minlongitude}
                onChange={(e) =>
                  onChange({ ...params, minlongitude: Number(e.target.value) })
                }
              />
              <span className="settings-label">Max lon</span>
              <input
                type="number"
                className="settings-input"
                step="0.1"
                value={params.maxlongitude}
                onChange={(e) =>
                  onChange({ ...params, maxlongitude: Number(e.target.value) })
                }
              />
            </div>
            <div className="panel-divider" />
          </>
        )}

        <div className="nav-row">
          <span className="nav-label">Start Date:</span>
          <input
            type="date"
            className="nav-date"
            value={params.starttime}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => onChange({ ...params, starttime: e.target.value })}
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

      {/**  Collapsable sections */}
      <button
        className="legend-collapse-btn"
        onClick={() => setLegendOpen((o) => !o)}
        title={legendOpen ? "Hide scale" : "Show scale"}
      >
        {/* <span className="legend-collapse-label">Felt-radius scale</span> */}
        <span className="legend-collapse-label">{legendOpen ? "▲" : "▼"}</span>
      </button>

      {/* ── Section 2: scale legend ── */}
      {legendOpen && (
        <div className="panel-section">
          <p className="legend-section-title">IMPACT AND FELT AREA</p>
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

      {/** Footer section */}
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
