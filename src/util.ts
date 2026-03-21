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
  const energyFactor = Math.pow(10, 1.5 * (mag - 2.0));
  const baseRadius = Math.sqrt(energyFactor);
  const finalRadius = (baseRadius * factor) / 10 + 2;
  return finalRadius;
}

/**
 * Converts earthquake magnitude to an estimated felt radius in meters, based on the formula: 10^((0.5 * Mag) - 0.5). The resulting radius is then converted from kilometers to meters.
 * @param mag - The earthquake magnitude.
 * @returns The estimated felt radius in meters.
 */
export function getFeltRadiusMeters(mag: number): number {
  // Formula: 10^((0.5 * Mag) - 0.5)
  // We convert the resulting km to meters by multiplying by 1000
  const radiusKm = Math.pow(10, 0.5 * mag - 0.5);
  return radiusKm * 1000;
}
