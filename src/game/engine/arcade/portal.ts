// src/game/engine/arcade/portal.ts
import type { PortalPair } from './types';

export interface Portal {
  entryX: number;
  entryY: number;
  exitX: number;
  exitY: number;
  radius: number;
  usedThisThrow: boolean;
}

const DEFAULT_RADIUS = 15;

export function createPortalFromPair(pair: PortalPair): Portal {
  return {
    entryX: pair.entry.x,
    entryY: pair.entry.y,
    exitX: pair.exit.x,
    exitY: pair.exit.y,
    radius: DEFAULT_RADIUS,
    usedThisThrow: false,
  };
}

export function checkPortalEntry(
  playerX: number,
  playerY: number,
  portal: Portal
): boolean {
  if (portal.usedThisThrow) return false;

  const dx = playerX - portal.entryX;
  const dy = playerY - portal.entryY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < portal.radius;
}

export function applyPortalTeleport(
  portal: Portal,
  position: { px: number; py: number },
  _velocity: { vx: number; vy: number }
): void {
  // Teleport to exit
  position.px = portal.exitX;
  position.py = portal.exitY;

  // Preserve momentum (direction and speed unchanged)
  // velocity stays the same

  portal.usedThisThrow = true;
}

export function resetPortal(portal: Portal | null): void {
  if (portal) {
    portal.usedThisThrow = false;
  }
}
