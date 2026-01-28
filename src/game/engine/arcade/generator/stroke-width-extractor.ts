// src/game/engine/arcade/generator/stroke-width-extractor.ts

export interface StrokePoint {
  x: number;
  y: number;
}

/**
 * Extract stroke widths for calligraphic coin sizing.
 * Uses a start-thick, end-thin pattern mimicking brush calligraphy.
 * Width range: 0.6 (thin) to 1.4 (thick)
 */
export function extractStrokeWidths(points: StrokePoint[]): number[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [1.0];

  const widths: number[] = [];
  const maxWidth = 1.4;
  const minWidth = 0.6;
  const range = maxWidth - minWidth;

  for (let i = 0; i < points.length; i++) {
    // Progress along stroke: 0 (start) to 1 (end)
    const progress = i / (points.length - 1);
    // Ease-out curve: starts thick, gradually thins
    const eased = 1 - Math.pow(progress, 0.7);
    const width = minWidth + eased * range;
    widths.push(width);
  }

  return widths;
}

/**
 * Estimate brush width from point density.
 * Dense points = brush pressed harder = thicker stroke.
 */
export function estimateWidthFromPointDensity(
  points: StrokePoint[],
  index: number
): number {
  if (points.length < 2) return 1.0;

  const windowSize = 2;
  const start = Math.max(0, index - windowSize);
  const end = Math.min(points.length - 1, index + windowSize);

  let totalDist = 0;
  let count = 0;

  for (let i = start; i < end; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    totalDist += Math.sqrt(dx * dx + dy * dy);
    count++;
  }

  if (count === 0) return 1.0;

  const avgDist = totalDist / count;
  // Inverse relationship: smaller distance = denser = thicker
  // Normalize to 0.6-1.4 range
  const normalized = Math.max(0.6, Math.min(1.4, 2.0 - avgDist / 50));
  return normalized;
}

/**
 * Combine calligraphic taper with density estimation
 */
export function extractStrokeWidthsWithDensity(points: StrokePoint[]): number[] {
  const taperWidths = extractStrokeWidths(points);

  return taperWidths.map((taper, i) => {
    const density = estimateWidthFromPointDensity(points, i);
    // Blend: 70% taper, 30% density
    return taper * 0.7 + density * 0.3;
  });
}
