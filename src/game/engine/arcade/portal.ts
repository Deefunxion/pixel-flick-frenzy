// src/game/engine/arcade/portal.ts
import type { PortalPair } from './types';

export interface Portal {
  // Portal A (left side)
  aX: number;
  aY: number;
  // Portal B (right side)
  bX: number;
  bY: number;
  radius: number;
  usedThisThrow: boolean;
  lastUsedSide: 'a' | 'b' | null;  // Track which side was used
}

const DEFAULT_RADIUS = 18;

export function createPortalFromPair(pair: PortalPair): Portal {
  return {
    aX: pair.entry.x,
    aY: pair.entry.y,
    bX: pair.exit.x,
    bY: pair.exit.y,
    radius: DEFAULT_RADIUS,
    usedThisThrow: false,
    lastUsedSide: null,
  };
}

/**
 * Check if player is entering either portal
 * Returns 'a', 'b', or null
 */
export function checkPortalEntry(
  playerX: number,
  playerY: number,
  portal: Portal
): 'a' | 'b' | null {
  if (portal.usedThisThrow) return null;

  // Check portal A
  const dxA = playerX - portal.aX;
  const dyA = playerY - portal.aY;
  const distA = Math.sqrt(dxA * dxA + dyA * dyA);
  if (distA < portal.radius) return 'a';

  // Check portal B
  const dxB = playerX - portal.bX;
  const dyB = playerY - portal.bY;
  const distB = Math.sqrt(dxB * dxB + dyB * dyB);
  if (distB < portal.radius) return 'b';

  return null;
}

/**
 * Teleport player to the opposite portal
 */
export function applyPortalTeleport(
  portal: Portal,
  enteredSide: 'a' | 'b',
  position: { px: number; py: number },
  _velocity: { vx: number; vy: number }
): void {
  // Teleport to opposite side
  if (enteredSide === 'a') {
    position.px = portal.bX;
    position.py = portal.bY;
  } else {
    position.px = portal.aX;
    position.py = portal.aY;
  }

  // Preserve momentum (direction and speed unchanged)
  // velocity stays the same

  portal.usedThisThrow = true;
  portal.lastUsedSide = enteredSide;
}

export function resetPortal(portal: Portal | null): void {
  if (portal) {
    portal.usedThisThrow = false;
    portal.lastUsedSide = null;
  }
}
