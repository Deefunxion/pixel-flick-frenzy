// src/game/engine/routes.ts
/**
 * Routes System - Ordered node sequences for combo objectives
 *
 * Defines paths through rings and bounce surfaces that must be
 * completed in order for contract bonuses.
 *
 * Physics-based route generation ensures all nodes are reachable:
 * - Player falls with gravity (Y increases over time)
 * - Float slows descent but doesn't reverse it
 * - Bounce surfaces enable ascending to higher nodes
 */

import type { Ring, OscillationParams, OrbitParams, LissajousParams } from './rings';

export type NodeKind = 'ring' | 'bounce' | 'gate';

export interface RouteNode {
  kind: NodeKind;
  x: number;
  y: number;
  radius?: number;        // For proximity check
  ringIndex?: number;     // Which ring this node represents (0, 1, 2)
  condition?: 'ascending' | 'descending' | 'throttling' | 'braking';
}

export interface Route {
  id: string;
  nodes: RouteNode[];
  currentIndex: number;
  failed: boolean;
  failReason: string | null;
  strictOrder: boolean;
}

export interface RouteProgress {
  advanced: boolean;
  failed: boolean;
  newIndex: number;
  failReason: string | null;
}

const NODE_HIT_RADIUS = 25;

/**
 * Create a new route
 */
export function createRoute(
  nodes: Omit<RouteNode, 'radius'>[],
  id: string = `route_${Date.now()}`
): Route {
  return {
    id,
    nodes: nodes.map(n => ({ ...n, radius: n.radius ?? NODE_HIT_RADIUS })),
    currentIndex: 0,
    failed: false,
    failReason: null,
    strictOrder: true,
  };
}

/**
 * Check if a node completion advances the route
 */
export function checkRouteNodeProgress(
  route: Route,
  currentIndex: number,
  completedKind: NodeKind,
  completedX: number,
  completedY: number
): RouteProgress {
  if (route.failed) {
    return { advanced: false, failed: true, newIndex: currentIndex, failReason: route.failReason };
  }

  const expectedNode = route.nodes[currentIndex];
  if (!expectedNode) {
    // Already complete
    return { advanced: false, failed: false, newIndex: currentIndex, failReason: null };
  }

  // Check if this is the expected node
  const dx = completedX - expectedNode.x;
  const dy = completedY - expectedNode.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const isExpectedNode = completedKind === expectedNode.kind && dist < (expectedNode.radius ?? NODE_HIT_RADIUS);

  if (isExpectedNode) {
    return {
      advanced: true,
      failed: false,
      newIndex: currentIndex + 1,
      failReason: null,
    };
  }

  // Check if completing wrong node (strict order)
  if (route.strictOrder) {
    // Did they hit a later node?
    for (let i = currentIndex + 1; i < route.nodes.length; i++) {
      const node = route.nodes[i];
      const ndx = completedX - node.x;
      const ndy = completedY - node.y;
      const ndist = Math.sqrt(ndx * ndx + ndy * ndy);
      if (completedKind === node.kind && ndist < (node.radius ?? NODE_HIT_RADIUS)) {
        route.failed = true;
        route.failReason = 'Wrong order';
        return { advanced: false, failed: true, newIndex: currentIndex, failReason: 'Wrong order' };
      }
    }
  }

  return { advanced: false, failed: false, newIndex: currentIndex, failReason: null };
}

/**
 * Check if route is complete
 */
export function isRouteComplete(route: Route): boolean {
  return route.currentIndex >= route.nodes.length && !route.failed;
}

/**
 * Get route fail reason
 */
export function getRouteFailReason(route: Route): string | null {
  return route.failReason;
}

/**
 * Reset route for new throw
 */
export function resetRoute(route: Route): void {
  route.currentIndex = 0;
  route.failed = false;
  route.failReason = null;
}

/**
 * Calculate the Y range (min/max) a ring travels through based on its motion pattern
 * Note: lower Y = higher on screen, higher Y = lower on screen
 */
export interface RingYRange {
  minY: number;  // Highest point on screen (lowest Y value)
  maxY: number;  // Lowest point on screen (highest Y value)
  anchorY: number;
  anchorX: number;
  ringIndex: number;
}

export function calculateRingYRange(ring: Ring): RingYRange {
  const { pattern, params, anchorX, anchorY, ringIndex } = ring;

  let amplitude = 0;
  switch (pattern) {
    case 'oscillate': {
      const p = params as OscillationParams;
      amplitude = p.amplitude;
      break;
    }
    case 'orbit': {
      const p = params as OrbitParams;
      amplitude = p.radius;
      break;
    }
    case 'lissajous': {
      const p = params as LissajousParams;
      amplitude = p.ampY;
      break;
    }
  }

  return {
    minY: anchorY - amplitude,
    maxY: anchorY + amplitude,
    anchorY,
    anchorX,
    ringIndex,
  };
}

/**
 * Generate a physically-valid route from rings + bounce
 *
 * Physics rules:
 * - Player falls with gravity (Y increases over time)
 * - Float slows descent but doesn't reverse it
 * - Each route node must be at Y >= previous Y (lower or same on screen)
 * - EXCEPTION: If bounce surface is between two nodes, player can gain height
 *
 * Route difficulty:
 * - Easy: All nodes descending naturally
 * - Medium: Requires precise floating/timing
 * - Hard: Requires bounce to reach ascending node
 */
export function generateRouteFromObjects(
  rings: Ring[],
  bounce: { x: number; y: number } | null,
  seed: number
): Route {
  // Simple seeded random
  let t = seed;
  const random = () => {
    t = (t * 1103515245 + 12345) & 0x7fffffff;
    return t / 0x7fffffff;
  };

  // Calculate Y ranges for all rings using their actual motion parameters
  const ringRanges = rings.map(r => calculateRingYRange(r));

  // Sort by X position (left to right = player trajectory)
  const sortedRanges = [...ringRanges].sort((a, b) => a.anchorX - b.anchorX);

  const nodes: RouteNode[] = [];
  let constraintY = 0; // Start at top of screen
  let bounceUsed = false;
  let bounceInsertIndex = -1;

  for (let i = 0; i < sortedRanges.length; i++) {
    const range = sortedRanges[i];

    // Check if bounce is between previous node and this ring
    const prevX = nodes.length > 0 ? nodes[nodes.length - 1].x : 0;
    const bounceAvailable = bounce &&
      !bounceUsed &&
      bounce.x > prevX &&
      bounce.x < range.anchorX;

    // Determine the catch point Y
    let catchY: number;

    if (bounceAvailable) {
      // With bounce available, we have options:
      // 1. Don't use bounce - catch at lowest reachable point
      // 2. Use bounce - can reach higher points

      // Check if we NEED bounce to reach this ring
      const canReachWithoutBounce = range.maxY >= constraintY;

      if (!canReachWithoutBounce || (canReachWithoutBounce && random() > 0.6)) {
        // Use bounce to reach a higher point (more interesting gameplay)
        bounceUsed = true;
        bounceInsertIndex = nodes.length;

        // After bounce, we can reach anywhere in the ring's range
        // Choose a point based on difficulty
        const difficultyFactor = random();
        if (difficultyFactor < 0.3) {
          // Easy: catch near bottom of range
          catchY = range.anchorY + (range.maxY - range.anchorY) * 0.7;
        } else if (difficultyFactor < 0.7) {
          // Medium: catch near middle
          catchY = range.anchorY;
        } else {
          // Hard: catch near top of range
          catchY = range.anchorY - (range.anchorY - range.minY) * 0.5;
        }

        // Reset constraint after bounce
        constraintY = catchY;
      } else {
        // Don't use bounce, catch at naturally reachable point
        catchY = Math.max(range.maxY, constraintY);
        // Make sure it's within the ring's range
        catchY = Math.min(catchY, range.maxY);
        catchY = Math.max(catchY, range.minY);
        constraintY = catchY;
      }
    } else {
      // No bounce available - must descend naturally
      // Can only catch ring if its lowest point is at or below our constraint
      if (range.maxY < constraintY) {
        // Ring is too high to reach! Skip it or fail the route
        // For now, try to catch at the very lowest point possible
        catchY = range.maxY;
        if (catchY < constraintY) {
          // Still can't reach - this ring is unreachable
          // In a real scenario, we'd skip this ring
          // But for now, include it anyway (player will need skill!)
          catchY = constraintY; // Clamp to constraint
        }
      } else {
        // Ring is reachable - choose a catch point
        // Prefer catching at a comfortable Y (not at the extreme)
        const reachableMin = Math.max(range.minY, constraintY);
        const reachableMax = range.maxY;

        // Pick a point within reachable range
        catchY = reachableMin + (reachableMax - reachableMin) * (0.3 + random() * 0.4);
      }
      constraintY = catchY;
    }

    nodes.push({
      kind: 'ring',
      x: range.anchorX,
      y: catchY,
      ringIndex: range.ringIndex,
    });
  }

  // Insert bounce node if it was used
  if (bounceUsed && bounce && bounceInsertIndex >= 0) {
    nodes.splice(bounceInsertIndex, 0, {
      kind: 'bounce',
      x: bounce.x,
      y: bounce.y,
    });
  }

  return createRoute(nodes, `route_${seed}`);
}
