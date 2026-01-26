// src/game/engine/arcade/calligraphicScale.ts
import type { DoodlePlacement, PortalPair } from './types';

/**
 * Calligraphic Flow Size System
 *
 * Communicates sequence order through size progression, inspired by
 * Chinese brush calligraphy where each stroke starts with pressure
 * (large) and ends with lift (small) as ink fades.
 */

export interface StrokeBoundary {
  startIndex: number;  // First doodle index in stroke
  endIndex: number;    // Last doodle index in stroke
}

// Scale range: asymmetric for eye-catching stroke starts
const SCALE_MAX = 1.8;  // Stroke start (lots of ink)
const SCALE_MIN = 0.7;  // Stroke end (ink fading)
const SCALE_RANGE = SCALE_MAX - SCALE_MIN;  // 1.1
const MIN_SCALE_STEP = 0.1;  // Minimum difference between consecutive doodles

/**
 * Detect stroke boundaries based on portals and X-position resets.
 *
 * Primary: Portal positions define stroke breaks
 * Fallback: X-position going backwards indicates new stroke
 */
export function detectStrokeBoundaries(
  doodles: DoodlePlacement[],
  portals: PortalPair[]
): StrokeBoundary[] {
  if (doodles.length === 0) return [];
  if (doodles.length === 1) return [{ startIndex: 0, endIndex: 0 }];

  const boundaries: StrokeBoundary[] = [];
  let strokeStart = 0;

  for (let i = 1; i < doodles.length; i++) {
    const prevDoodle = doodles[i - 1];
    const currDoodle = doodles[i];

    let isNewStroke = false;

    // Primary: Check if there's a portal that would cause this transition
    // A portal teleports from right side back to left side
    if (portals.length > 0) {
      for (const portal of portals) {
        // If previous doodle is near portal entry (right side)
        // and current doodle is near portal exit (left side)
        const nearEntry = Math.abs(prevDoodle.x - portal.entry.x) < 80;
        const nearExit = Math.abs(currDoodle.x - portal.exit.x) < 80;

        if (nearEntry && nearExit && currDoodle.x < prevDoodle.x) {
          isNewStroke = true;
          break;
        }
      }
    }

    // Fallback: X-position reset (next doodle is significantly to the left)
    if (!isNewStroke && currDoodle.x < prevDoodle.x - 30) {
      isNewStroke = true;
    }

    if (isNewStroke) {
      boundaries.push({ startIndex: strokeStart, endIndex: i - 1 });
      strokeStart = i;
    }
  }

  // Add final stroke
  boundaries.push({ startIndex: strokeStart, endIndex: doodles.length - 1 });

  return boundaries;
}

// Helper for minimum step calculation (no recursion guard)
function calculateDoodleScaleRaw(positionInStroke: number, strokeLength: number): number {
  const progress = positionInStroke / (strokeLength - 1);
  const eased = progress * progress;
  return Math.max(SCALE_MIN, SCALE_MAX - (eased * SCALE_RANGE));
}

/**
 * Calculate scale for a doodle based on its position within a stroke.
 * Uses eased interpolation (progress squared) to simulate ink flow.
 *
 * For large strokes (>10), enforces minimum 0.1 step between consecutive
 * doodles by using linear interpolation instead of easing.
 *
 * @param positionInStroke - 0-indexed position within the stroke
 * @param strokeLength - Total doodles in this stroke
 * @returns Scale value between 0.7 and 1.8
 */
export function calculateDoodleScale(
  positionInStroke: number,
  strokeLength: number
): number {
  // Edge case: single doodle
  if (strokeLength === 1) return SCALE_MAX;

  // Edge case: two doodles (softer range)
  if (strokeLength === 2) {
    return positionInStroke === 0 ? SCALE_MAX : 1.0;
  }

  // For large strokes, use linear interpolation to ensure minimum 0.1 step
  if (strokeLength > 10) {
    // Calculate required step to fit within range
    const requiredRange = (strokeLength - 1) * MIN_SCALE_STEP;
    const effectiveRange = Math.min(requiredRange, SCALE_RANGE);
    const step = effectiveRange / (strokeLength - 1);
    const scale = SCALE_MAX - (positionInStroke * step);
    return Math.max(SCALE_MIN, scale);
  }

  // Calculate progress (0 to 1)
  const progress = positionInStroke / (strokeLength - 1);

  // Ease-in (progress squared): ink "holds" longer at start, fades faster at end
  const eased = progress * progress;

  // Calculate base scale
  const scale = SCALE_MAX - (eased * SCALE_RANGE);

  // Clamp to valid range
  return Math.max(SCALE_MIN, Math.min(SCALE_MAX, scale));
}

/**
 * Determine sprite type based on position in stroke.
 * Stars mark stroke start and end (bookends), coins fill middle.
 */
export function assignDoodleSprite(
  positionInStroke: number,
  strokeLength: number
): 'star' | 'coin' {
  const isStart = positionInStroke === 0;
  const isEnd = positionInStroke === strokeLength - 1;

  return (isStart || isEnd) ? 'star' : 'coin';
}

/**
 * Apply calligraphic flow to doodle placements.
 * Modifies scale and sprite based on stroke position.
 */
export function applyCalligraphicFlow(
  doodles: DoodlePlacement[],
  portals: PortalPair[]
): DoodlePlacement[] {
  if (doodles.length === 0) return [];

  const strokes = detectStrokeBoundaries(doodles, portals);

  return doodles.map((doodle, globalIndex) => {
    // Find which stroke this doodle belongs to
    const stroke = strokes.find(
      s => globalIndex >= s.startIndex && globalIndex <= s.endIndex
    );

    if (!stroke) return doodle;

    const positionInStroke = globalIndex - stroke.startIndex;
    const strokeLength = stroke.endIndex - stroke.startIndex + 1;

    return {
      ...doodle,
      scale: calculateDoodleScale(positionInStroke, strokeLength),
      sprite: assignDoodleSprite(positionInStroke, strokeLength),
    };
  });
}

/**
 * Check if a doodle is a stroke start (for glow effect).
 */
export function isStrokeStart(
  doodleIndex: number,
  doodles: DoodlePlacement[],
  portals: PortalPair[]
): boolean {
  const strokes = detectStrokeBoundaries(doodles, portals);
  return strokes.some(s => s.startIndex === doodleIndex);
}
