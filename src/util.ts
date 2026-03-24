/**
 * Configurable parameters for earthquakePixelRadius.
 */
export interface RadiusParams {
  rRef: number; // radius at (magRef, depthRef)
  magRef: number; // reference magnitude
  depthRef: number; // reference depth (km)
  d0: number; // depth softening offset (km)
  gamma: number; // depth attenuation exponent
}

export const DEFAULT_RADIUS_PARAMS: RadiusParams = {
  rRef: 12,
  magRef: 4.0,
  depthRef: 10,
  d0: 5,
  gamma: 1.6,
};

/**
 * Compute display radius in pixels, scaled by magnitude (energy) and
 * attenuated by depth.
 */
export function earthquakePixelRadius(
  mag: number,
  depthKm: number,
  p: RadiusParams = DEFAULT_RADIUS_PARAMS,
): number {
  const magFactor = Math.pow(10, 0.75 * (mag - p.magRef));
  const depthFactor = Math.pow(
    (p.depthRef + p.d0) / (depthKm + p.d0),
    p.gamma / 2,
  );
  return p.rRef * magFactor * depthFactor;
}

/**
 * Converts earthquake magnitude to a display radius (in metres for deck.gl).
 * @deprecated use earthquakePixelRadius instead
 */
export function getRadius(mag: number, factor: number = 0.002): number {
  const energy = Math.pow(10, (mag - 2) * 1.5);
  return Math.sqrt(energy) * factor;
}

/**
 * Estimated felt radius in kilometres based on the empirical formula:
 *   log10(r_km) = 0.5 * mag − 0.5
 * i.e. r_km = 10^(0.5 * mag − 0.5)
 */
export function getFeltRadiusKM(mag: number): number {
  return Math.pow(10, 0.5 * mag - 0.5);
}

/**
 * Maps USGS significance score (sig) to an RGBA fill colour.
 * Ranges: 0–100 very minor, 100–300 moderate, 300–700 strong,
 *         700–1500 major, 1500+ very major/damaging.
 */
export const SIG_BREAKS = [0, 100, 300, 700, 1500];
export const SIG_LABELS = [
  "Low (0-100)",
  "Moderate (100-300)",
  "High (300-700)",
  "Major (700-1500)",
  "Extreme (1500+)",
];
export const SIG_COLORS: [number, number, number][] = [
  [255, 255, 178], // #ffffb2
  [254, 204, 92], // #fecc5c
  [253, 141, 60], // #fd8d3c
  [240, 59, 32], // #f03b20
  [189, 0, 38], // #bd0026
  // [49, 163, 84], // #31a354
  // [255, 237, 160], // #ffeda0
  // [254, 178, 76], // #feb24c
  // [240, 59, 32], // #f03b20
  // [99, 99, 99], // #636363
];

export function sigToColor(
  sig: number | null | undefined,
  alpha = 180,
): [number, number, number, number] {
  const s = sig ?? 0;
  let idx = SIG_BREAKS.findLastIndex((b) => s >= b);
  if (idx < 0) idx = 0;
  const [r, g, b] = SIG_COLORS[Math.min(idx, SIG_COLORS.length - 1)];
  return [r, g, b, alpha];
}

export function intensityLabel(
  value: number | null | undefined,
): string | null {
  if (value == null) return null;

  if (value < 2) return "not felt";
  if (value < 3) return "weak";
  if (value < 4) return "light";
  if (value < 5) return "moderate";
  if (value < 6) return "strong";
  if (value < 7) return "very strong";
  if (value < 8) return "severe";
  if (value < 9) return "violent";
  return "extreme";
}
