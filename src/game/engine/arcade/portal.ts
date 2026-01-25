// src/game/engine/arcade/portal.ts
import type { PortalPair, PortalExitDirection } from './types';

// Timing configuration for timed portals
export interface PortalTiming {
  onDuration: number;   // Time active in ms
  offDuration: number;  // Time inactive in ms
  offset: number;       // Initial phase offset in ms
  cycleDuration: number; // Total cycle time (on + off)
}

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
  // Timing state
  timing: PortalTiming | null;  // null = always active
  isActive: boolean;            // Current active state (for timed portals)
}

const DEFAULT_RADIUS = 18;
const BASE_EXIT_SPEED = 8; // Base horizontal speed on exit

export function createPortalFromPair(pair: PortalPair): Portal {
  const scale = pair.scale ?? 1.0;

  // Create timing if specified
  let timing: PortalTiming | null = null;
  if (pair.timing) {
    timing = {
      onDuration: pair.timing.onDuration,
      offDuration: pair.timing.offDuration,
      offset: pair.timing.offset ?? 0,
      cycleDuration: pair.timing.onDuration + pair.timing.offDuration,
    };
  }

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
    timing,
    isActive: true,  // Start active (timing will update this)
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
  // Portal must be active and not used this throw
  if (!portal.isActive || portal.usedThisThrow) return null;

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
    // Reset isActive based on timing (at time 0)
    if (portal.timing) {
      const phase = portal.timing.offset % portal.timing.cycleDuration;
      portal.isActive = phase < portal.timing.onDuration;
    } else {
      portal.isActive = true;
    }
  }
}

/**
 * Update portal timing state based on current time
 * @param portal - Portal to update
 * @param timeMs - Current game time in milliseconds
 */
export function updatePortal(portal: Portal | null, timeMs: number): void {
  if (!portal || !portal.timing) return;

  // Calculate where we are in the cycle
  const adjustedTime = timeMs + portal.timing.offset;
  const cyclePosition = adjustedTime % portal.timing.cycleDuration;

  // Active during first part of cycle (onDuration)
  portal.isActive = cyclePosition < portal.timing.onDuration;
}

/**
 * Check if a portal is currently in its active phase
 */
export function isPortalActive(portal: Portal | null): boolean {
  if (!portal) return false;
  return portal.isActive && !portal.usedThisThrow;
}
