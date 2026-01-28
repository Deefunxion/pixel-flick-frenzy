// src/game/engine/arcade/generator/stroke-populator.ts

import type { StrokeOverlay, DoodlePlacement } from '../types';

export interface PopulateOptions {
  density: number;           // 0.0 (sparse) to 1.0 (dense)
  startId?: number;          // Starting sequence ID
  minSpacing?: number;       // Minimum pixels between coins
  scaleMultiplier?: number;  // Global scale adjustment
}

/**
 * Calculate distance along stroke path
 */
function getStrokeLength(points: Array<{ x: number; y: number }>): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

/**
 * Interpolate position along stroke at given progress (0-1)
 */
function interpolateAlongStroke(
  points: Array<{ x: number; y: number }>,
  widths: number[],
  progress: number
): { x: number; y: number; width: number } {
  if (points.length === 0) return { x: 0, y: 0, width: 1 };
  if (points.length === 1) return { ...points[0], width: widths[0] || 1 };

  const totalLength = getStrokeLength(points);
  const targetDist = progress * totalLength;

  let traveled = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);

    if (traveled + segmentLength >= targetDist) {
      // Interpolate within this segment
      const segmentProgress = segmentLength > 0
        ? (targetDist - traveled) / segmentLength
        : 0;

      return {
        x: points[i - 1].x + dx * segmentProgress,
        y: points[i - 1].y + dy * segmentProgress,
        width: widths[i - 1] + (widths[i] - widths[i - 1]) * segmentProgress,
      };
    }
    traveled += segmentLength;
  }

  // Return last point
  return {
    ...points[points.length - 1],
    width: widths[widths.length - 1] || 1
  };
}

/**
 * Populate a stroke with coins based on density
 */
export function populateStrokeWithCoins(
  stroke: StrokeOverlay,
  options: PopulateOptions
): DoodlePlacement[] {
  const {
    density,
    startId = 1,
    minSpacing = 12,
    scaleMultiplier = 1.0,
  } = options;

  if (stroke.points.length < 2) return [];

  const strokeLength = getStrokeLength(stroke.points);

  // Calculate coin count based on density
  // density 1.0 = one coin per minSpacing pixels
  // density 0.1 = one coin per (minSpacing * 10) pixels
  const effectiveSpacing = minSpacing / Math.max(0.1, density);
  const coinCount = Math.max(1, Math.floor(strokeLength / effectiveSpacing));

  const coins: DoodlePlacement[] = [];

  for (let i = 0; i < coinCount; i++) {
    const progress = coinCount > 1 ? i / (coinCount - 1) : 0.5;
    const { x, y, width } = interpolateAlongStroke(stroke.points, stroke.widths, progress);

    // Scale from width: width 1.4 → scale 1.2, width 0.6 → scale 0.6
    const baseScale = 0.4 + width * 0.5;
    const scale = baseScale * scaleMultiplier;

    coins.push({
      x: Math.round(x),
      y: Math.round(y),
      sequence: startId + i,
      scale,
      sprite: i === 0 || i === coinCount - 1 ? 'star' : 'coin',
      size: scale > 0.9 ? 'large' : 'small',
    });
  }

  return coins;
}

/**
 * Populate multiple strokes, maintaining sequential IDs
 */
export function populateStrokes(
  strokes: StrokeOverlay[],
  options: PopulateOptions
): { coins: DoodlePlacement[]; updatedStrokes: StrokeOverlay[] } {
  const allCoins: DoodlePlacement[] = [];
  const updatedStrokes: StrokeOverlay[] = [];
  let nextId = options.startId ?? 1;

  for (const stroke of strokes) {
    const coins = populateStrokeWithCoins(stroke, {
      ...options,
      startId: nextId,
    });

    allCoins.push(...coins);

    updatedStrokes.push({
      ...stroke,
      populated: coins.length > 0,
      doodleIds: coins.map(c => c.sequence),
    });

    nextId += coins.length;
  }

  return { coins: allCoins, updatedStrokes };
}
