import { useState } from "react";
import type { QuakeParams } from "./hooks/useEarthquakes";
import { getFeltRadiusMeters } from "./util";

const SCALE_MAGS = [3, 4, 5, 6, 7, 8, 9];
const BAR_W = 260;
const X0 = 0;

// Web Mercator: metres per pixel at a given zoom and latitude
// deck.gl (WebMercatorViewport) and MapLibre both use 512-px tiles
function metersToPixels(meters: number, zoom: number, lat: number): number {
  const mpp =
    (40075016.686 * Math.cos((lat * Math.PI) / 180)) /
    (512 * Math.pow(2, zoom));
  return meters / mpp;
}

interface NavPanelProps {
  params: QuakeParams;
  onChange: (p: QuakeParams) => void;
  onFetch: () => void;
  loading: boolean;
  count: number;
  error: string | null;
  zoom: number;
  centerLat: number;
}

export default function NavPanel({
  params,
  onChange,
  onFetch,
  loading,
  count,
  error,
  zoom,
  centerLat,
}: NavPanelProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(true);

  return (
    <div className="slider-panel">
      {/* ── Section 1: header ── */}
      <div className="panel-header">
        <div className="panel-header-text">
          <p className="panel-title">Earthquakes</p>
          <p className="legend-desc">
            Registered earthquakes in the selected region and time period are
            displayed as semi-transparent circles.
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

        {/* <div className="nav-row">
        <span className="nav-label">Min magnitude</span>
        <input
          type="range"
          className="date-range"
          min="0"
          max="7"
          step="0.5"
          value={params.minmagnitude}
          onChange={(e) =>
            onChange({ ...params, minmagnitude: Number(e.target.value) })
          }
        />
        <span className="nav-value">M {params.minmagnitude.toFixed(1)}</span>
      </div> */}

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
          <p className="legend-section-title">Estimated felt area</p>
          <p className="legend-desc">
            The estimated felt area of each earthquake is visualized as a circle
            whose radius is proportional to the earthquake's magnitude. The
            scale legend below shows the size of magnitudes, which updates with
            zoom.
          </p>
          {/* Scale-line legend: ticks at getFeltRadiusMeters(m) converted to pixels at current zoom */}
          {(() => {
            const ticks = SCALE_MAGS.map((m) => ({
              m,
              x: X0 + metersToPixels(getFeltRadiusMeters(m), zoom, centerLat),
            })).filter((t) => t.x <= X0 + BAR_W);
            console.log("Ticks:", ticks);
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
