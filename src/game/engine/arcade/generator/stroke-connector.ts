// src/game/engine/arcade/generator/stroke-connector.ts

import type { StrokeOverlay, SpringPlacement, PortalPair, WindZonePlacement, GravityWellPlacement } from '../types';
import { isUnlocked } from './prop-unlocks';

export interface ConnectionResult {
  springs: SpringPlacement[];
  portals: PortalPair[];
  windZones: WindZonePlacement[];
  gravityWells: GravityWellPlacement[];
}

interface StrokeEndpoints {
  stroke: StrokeOverlay;
  start: { x: number; y: number };
  end: { x: number; y: number };
}

/**
 * Get start and end points of a stroke
 */
function getEndpoints(stroke: StrokeOverlay): StrokeEndpoints {
  const points = stroke.points;
  return {
    stroke,
    start: points[0],
    end: points[points.length - 1],
  };
}

/**
 * Calculate distance between two points
 */
function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Determine connection type based on gap characteristics and available props
 */
function determineConnectionType(
  fromEnd: { x: number; y: number },
  toStart: { x: number; y: number },
  level: number
): 'spring' | 'portal' | 'wind' | 'gravity' | 'none' {
  const dx = toStart.x - fromEnd.x;
  const dy = toStart.y - fromEnd.y;
  const dist = distance(fromEnd, toStart);

  const goingUp = dy < -30;      // Significant upward movement
  const goingDown = dy > 30;     // Significant downward movement
  const largeGap = dist > 150;   // Large distance
  const horizontalGap = Math.abs(dx) > 100 && Math.abs(dy) < 50;

  // Priority: use newly available props when possible
  if (largeGap && isUnlocked('portal', level)) {
    return 'portal';
  }

  if (goingUp) {
    return 'spring';
  }

  if (horizontalGap && isUnlocked('wind', level)) {
    return 'wind';
  }

  if (goingDown && isUnlocked('gravity', level)) {
    return 'gravity';
  }

  // Default: spring for any significant gap
  if (dist > 50) {
    return 'spring';
  }

  return 'none';
}

/**
 * Create a spring placement to connect two points
 */
function createSpring(
  fromEnd: { x: number; y: number },
  toStart: { x: number; y: number }
): SpringPlacement {
  const dx = toStart.x - fromEnd.x;
  const dy = toStart.y - fromEnd.y;

  let direction: SpringPlacement['direction'] = 'up';
  if (dx > 30) direction = 'up-right';
  else if (dx < -30) direction = 'up-left';

  return {
    x: fromEnd.x + dx * 0.3,
    y: Math.min(180, fromEnd.y + 30),
    direction,
    strength: 0.5 + Math.min(1.5, Math.abs(dy) / 100),
    scale: 1.0,
  };
}

/**
 * Create a portal pair to connect two points
 */
function createPortal(
  fromEnd: { x: number; y: number },
  toStart: { x: number; y: number }
): PortalPair {
  return {
    entry: { x: fromEnd.x + 20, y: fromEnd.y },
    exit: { x: toStart.x - 20, y: toStart.y },
    exitDirection: 'straight',
    exitSpeed: 0.5,
    scale: 1.0,
  };
}

/**
 * Create a wind zone to push player horizontally
 */
function createWindZone(
  fromEnd: { x: number; y: number },
  toStart: { x: number; y: number }
): WindZonePlacement {
  const dx = toStart.x - fromEnd.x;
  const midX = fromEnd.x + dx / 2;
  const midY = (fromEnd.y + toStart.y) / 2;

  return {
    x: midX,
    y: midY,
    radius: Math.abs(dx) / 2,
    angle: dx > 0 ? 0 : 180,  // 0 = right, 180 = left
    strength: 0.5,
    scale: 1.0,
  };
}

/**
 * Create a gravity well to pull player toward target
 */
function createGravityWell(
  toStart: { x: number; y: number }
): GravityWellPlacement {
  return {
    x: toStart.x,
    y: toStart.y - 30,
    type: 'attract',
    radius: 60,
    strength: 0.4,
    scale: 1.0,
  };
}

/**
 * Connect populated strokes with appropriate props
 */
export function connectStrokes(strokes: StrokeOverlay[], level: number): ConnectionResult {
  const result: ConnectionResult = {
    springs: [],
    portals: [],
    windZones: [],
    gravityWells: [],
  };

  // Only process populated strokes
  const populatedStrokes = strokes.filter(s => s.populated);
  if (populatedStrokes.length < 2) return result;

  // Get endpoints for each stroke
  const endpoints = populatedStrokes.map(getEndpoints);

  // Connect each stroke to the next
  for (let i = 0; i < endpoints.length - 1; i++) {
    const fromEnd = endpoints[i].end;
    const toStart = endpoints[i + 1].start;

    const connectionType = determineConnectionType(fromEnd, toStart, level);

    switch (connectionType) {
      case 'spring':
        result.springs.push(createSpring(fromEnd, toStart));
        break;
      case 'portal':
        result.portals.push(createPortal(fromEnd, toStart));
        break;
      case 'wind':
        result.windZones.push(createWindZone(fromEnd, toStart));
        break;
      case 'gravity':
        result.gravityWells.push(createGravityWell(toStart));
        break;
    }
  }

  return result;
}
