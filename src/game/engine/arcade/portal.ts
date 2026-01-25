// src/game/engine/arcade/portal.ts
import type { PortalPair, PortalExitDirection } from './types';

export interface Portal {
  // Portal A (left side)
  aX: number;
  aY: number;
  // Portal B (right side)
  bX: number;
  bY: number;
  radius: number;
  usedThisThrow: boolean;
  lastUsedSide: 'a' | 'b' | null;
  // Exit behavior
  exitDirection: PortalExitDirection;
  exitSpeed: number;
  scale: number;
}

const DEFAULT_RADIUS = 18;
const BASE_EXIT_SPEED = 8; // Base horizontal speed on exit

export function createPortalFromPair(pair: PortalPair): Portal {
  const scale = pair.scale ?? 1.0;
  return {
    aX: pair.entry.x,
    aY: pair.entry.y,
    bX: pair.exit.x,
    bY: pair.exit.y,
    radius: DEFAULT_RADIUS * scale,
    usedThisThrow: false,
    lastUsedSide: null,
    exitDirection: pair.exitDirection ?? 'straight',
    exitSpeed: pair.exitSpeed ?? 1.0,
    scale,
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
 * Get exit velocity based on direction setting
 */
function getExitVelocity(
  direction: PortalExitDirection,
  exitSpeed: number,
  enteredSide: 'a' | 'b'
): { vx: number; vy: number } {
  const speed = BASE_EXIT_SPEED * exitSpeed;

  // When entering A, exit from B (going right)
  // When entering B, exit from A (going left)
  const horizontalSign = enteredSide === 'a' ? 1 : -1;

  switch (direction) {
    case 'up-45':
      // 45 degrees upward
      return {
        vx: speed * horizontalSign * 0.707,
        vy: -speed * 0.707,  // Negative = up
      };
    case 'down-45':
      // 45 degrees downward
      return {
        vx: speed * horizontalSign * 0.707,
        vy: speed * 0.707,   // Positive = down
      };
    case 'straight':
    default:
      // Horizontal
      return {
        vx: speed * horizontalSign,
        vy: 0,
      };
  }
}

/**
 * Teleport player to the opposite portal and apply exit velocity
 */
export function applyPortalTeleport(
  portal: Portal,
  enteredSide: 'a' | 'b',
  position: { px: number; py: number },
  velocity: { vx: number; vy: number }
): void {
  // Teleport to opposite side
  if (enteredSide === 'a') {
    position.px = portal.bX;
    position.py = portal.bY;
  } else {
    position.px = portal.aX;
    position.py = portal.aY;
  }

  // Apply exit velocity based on direction setting
  const exitVel = getExitVelocity(portal.exitDirection, portal.exitSpeed, enteredSide);
  velocity.vx = exitVel.vx;
  velocity.vy = exitVel.vy;

  portal.usedThisThrow = true;
  portal.lastUsedSide = enteredSide;
}

export function resetPortal(portal: Portal | null): void {
  if (portal) {
    portal.usedThisThrow = false;
    portal.lastUsedSide = null;
  }
}
