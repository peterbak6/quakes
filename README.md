# Quakes

Interactive earthquake map that visualises seismic events from the [USGS Earthquake Catalog](https://earthquake.usgs.gov).

**Live demo:** [https://quakes-18k.pages.dev/](https://quakes-18k.pages.dev/)

**Source:** [https://github.com/peterbak6/quakes](https://github.com/peterbak6/quakes)

**Web Site:** [https://visualanalytics.co.il/quakes](https://visualanalytics.co.il/quakes)

---

## Features

- Fetch earthquakes by geographic bounding box, start date, and minimum magnitude
- Circles sized by magnitude energy attenuated for depth (see below)
- Circles coloured by USGS significance score
- Hover tooltip showing location, magnitude, depth, and felt intensity
- Dashed ring showing estimated felt radius on hover
- Draggable bounding-box overlay on the map
- Scale legend (bottom-right) that updates as you adjust size parameters
- Settings panel with live-preview sliders for all radius parameters

---

## Tech Stack

| Library                                                          | Role                        |
| ---------------------------------------------------------------- | --------------------------- |
| [React 19](https://react.dev) + TypeScript                       | UI framework                |
| [deck.gl 9](https://deck.gl)                                     | WebGL map layers            |
| [MapLibre GL](https://maplibre.org)                              | Base map tiles              |
| [vis.gl/react-maplibre](https://visgl.github.io/react-maplibre/) | React bindings for MapLibre |
| [Vite](https://vitejs.dev)                                       | Build tool                  |
| Cloudflare Pages                                                 | Hosting                     |

---

## Circle Size Mapping

Each earthquake is drawn as a filled circle whose pixel radius reflects how much energy reached the surface, using a two-factor formula:

$$r = r_{\text{ref}} \cdot 10^{0.75 \, (m - m_{\text{ref}})} \cdot \left(\frac{d_{\text{ref}} + d_0}{d + d_0}\right)^{\gamma/2}$$

| Symbol           | Parameter              | Default   | Meaning                                                           |
| ---------------- | ---------------------- | --------- | ----------------------------------------------------------------- |
| $r_{\text{ref}}$ | Reference size (px)    | 20 px     | Radius of a "typical" earthquake at reference magnitude and depth |
| $m_{\text{ref}}$ | Reference magnitude    | 6.0       | The magnitude that maps to $r_{\text{ref}}$                       |
| $d_{\text{ref}}$ | Reference depth (km)   | 10 km     | Depth at which no attenuation is applied                          |
| $d_0$            | Surface softening (km) | 5 km      | Prevents very shallow quakes from diverging to infinite radius    |
| $\gamma$         | Depth attenuation      | 0.6       | Controls how fast radius shrinks with depth                       |
| $d$              | Earthquake depth (km)  | from USGS | Hypocentre depth                                                  |

### Why these exponents?

**Magnitude factor — `10^(0.75 × Δm)`**

The Richter/moment magnitude scale is defined so that each unit step represents $10^{1.5}$ times the released seismic energy. If you want circle _area_ to be proportional to energy, you need radius ∝ energy$^{0.5}$, giving $10^{0.75 \, \Delta m}$.

In plain terms: a magnitude-7 quake has a circle with $10^{0.75} \approx 5.6×$ the radius of a magnitude-6 quake (and 32× the area).

**Depth factor — power-law attenuation**

Deeper earthquakes dissipate more energy before reaching the surface, so a purely underground magnitude-7 at 200 km feels less destructive than the same magnitude at 10 km. The term:

$$\left(\frac{d_{\text{ref}} + d_0}{d + d_0}\right)^{\gamma/2}$$

is a soft power-law that:

- equals 1 when $d = d_{\text{ref}}$ (no correction at reference depth)
- shrinks below 1 for deeper events
- the $d_0$ offset prevents the factor from exploding as $d \to 0$ (very shallow quakes)

### Adjustable sliders

All five parameters are exposed in the **Impact area** panel so you can tune the visualization to the typical characteristics of the region you are looking at.

---

## Felt-Radius Ring

When you hover over an earthquake, a dashed ring shows the estimated radius within which the earthquake would have been felt. This uses the empirical formula:

$$\log_{10}(r_{\text{km}}) = 0.5 \cdot m - 0.5$$

i.e. $r_{\text{km}} = 10^{0.5m - 0.5}$

For example, a magnitude 5 event is felt up to ~10 km away; a magnitude 7 event up to ~100 km.

---

## Color — USGS Significance Score

Circles are coloured by the USGS `sig` field, which combines magnitude, depth, felt reports, and media attention into a single 0–2000+ integer.

| Range    | Label    | Color              |
| -------- | -------- | ------------------ |
| 0–99     | Low      | Yellow (#ffffb2)   |
| 100–299  | Moderate | Amber (#fecc5c)    |
| 300–699  | High     | Orange (#fd8d3c)   |
| 700–1499 | Major    | Red (#f03b20)      |
| 1500+    | Extreme  | Deep red (#bd0026) |

---

## Getting Started

```bash
npm install
npm run dev
```

The app fetches live data directly from the USGS GeoJSON API — no backend required.

### Build & deploy

```bash
npm run build   # TypeScript compile + Vite bundle → dist/
npm run deploy  # gh-pages push (GitHub Pages)
```

The Cloudflare Pages deployment is triggered automatically on push to `main`.
