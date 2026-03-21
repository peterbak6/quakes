/**
 * Converts earthquake magnitude to a display radius (in metres for deck.gl).
 *
 * 1. Energy scales as 10^(1.5 * mag) — the standard USGS energy relation.
 * 2. sqrt() makes the *area* of the rendered circle proportional to energy.
 * 3. The multiplier (0.002) tunes the visual size for the default map zoom.
 */
export function getRadius(mag: number, factor: number = 0.002): number {
  const energy = Math.pow(10, 1.5 * mag);
  return Math.sqrt(energy) * factor;
}

/**
 * Computes a pixel radius for the legend circles, using the same underlying
 * size formula as getRadius, but with a different multiplier and a minimum size
 * to ensure visibility of the smaller magnitudes.
 * @param mag - The earthquake magnitude.
 * @param factor - The multiplier to adjust the visual size.
 * @returns The pixel radius for the legend circle.
 * @returns A number representing the pixel radius for the legend circle.
 */
export function getPixelRadius(mag: number, factor: number = 2.5): number {
  // 1. Calculate a "Relative Energy" factor
  // 1.5 is the seismic moment constant.
  // We subtract a baseline (like 2.0) to keep the numbers smaller.
  const energyFactor = Math.pow(10, 1.5 * (mag - 2.0));

  // 2. Take the Square Root so the AREA represents the energy
  const baseRadius = Math.sqrt(energyFactor);

  // 3. Apply a multiplier and a "Min Size" floor
  // Multiplier (2.5) adjusts the spread; 5 is the smallest dot size.
  const finalRadius = (baseRadius * factor) / 10 + 2;

  return finalRadius;
}
