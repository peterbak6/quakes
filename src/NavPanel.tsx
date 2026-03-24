import { useEffect, useRef, useState } from "react";
import type { QuakeParams } from "./hooks/useEarthquakes";
import { SIG_LABELS, SIG_COLORS } from "./util";
import type { RadiusParams } from "./util";

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
    "earthquakes" | "color" | "impact" | null
  >("earthquakes");

  const toggle = (s: "earthquakes" | "color" | "impact") =>
    setOpenSection((cur) => (cur === s ? null : s));

  // Auto-close earthquakes section when a fetch completes
  const prevLoading = useRef(loading);
  useEffect(() => {
    if (prevLoading.current && !loading && !error) {
      setOpenSection(null);
    }
    prevLoading.current = loading;
  }, [loading, error]);

  return (
    <div className="slider-panel">
      {/* ── Section 1: EARTHQUAKES ── */}
      <button className="section-toggle" onClick={() => toggle("earthquakes")}>
        <span className="section-toggle-title">Earthquakes</span>
        <span className="section-toggle-icon">
          {openSection === "earthquakes" ? "▾" : "▸"}
        </span>
      </button>
      <div
        className={`section-body${openSection === "earthquakes" ? " section-body--open" : ""}`}
      >
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

          <button
            className="fetch-btn"
            onClick={() => {
              onFetch();
            }}
            disabled={loading}
          >
            {loading ? "Loading…" : "Load"}
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
      </div>

      {/* ── Section: SIGNIFICANCE ── */}
      <button className="section-toggle" onClick={() => toggle("color")}>
        <span className="section-toggle-title">Significance</span>
        <span className="section-toggle-icon">
          {openSection === "color" ? "▾" : "▸"}
        </span>
      </button>
      <div
        className={`section-body${openSection === "color" ? " section-body--open" : ""}`}
      >
        <div className="panel-section">
          <p className="legend-desc">
            Earthquakes are coloured by their USGS significance score, which is
            a composite measure of magnitude, felt reports, and other factors.
            Higher significance often indicates more impactful earthquakes, even
            if their magnitude isn't the highest.
          </p>
          <div className="sig-legend">
            {SIG_LABELS.map((label, i) => (
              <div className="sig-legend-row" key={i}>
                <span
                  className="sig-legend-swatch"
                  style={{
                    backgroundColor: `rgba(${SIG_COLORS[i].join(",")}, 200)`,
                  }}
                />
                <span className="sig-legend-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 2: IMPACT AREA ── */}
      <button className="section-toggle" onClick={() => toggle("impact")}>
        <span className="section-toggle-title">Impact area</span>
        <span className="section-toggle-icon">
          {openSection === "impact" ? "▾" : "▸"}
        </span>
      </button>
      <div
        className={`section-body${openSection === "impact" ? " section-body--open" : ""}`}
      >
        <div className="panel-section">
          <p className="legend-desc">
            Circle size reflects earthquake energy, adjusted for depth. Dotted
            line on hover indicates the estimated felt radius by people. Adjust
            the settings for the region's typical earthquake characteristics.
          </p>

          <div className="param-list">
            {(
              [
                [
                  "magRef",
                  "Reference magnitude",
                  "1",
                  "8",
                  "0.1",
                  (v: number) => v,
                  "what mag is considered “typical” in the region",
                ],
                [
                  "rRef",
                  "Reference size (px)",
                  "1",
                  "60",
                  "1",
                  (v: number) => v,
                  "how large a “typical” earthquake appears",
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
        </div>
      </div>

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
        <p className="data-source-link" style={{ opacity: 0.75 }}>
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
