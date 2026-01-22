/**
 * Rings System - Moving ring targets for score multipliers
 *
 * 3 rings per throw with different motion patterns:
 * - Ring 1 (150-180px): Oscillation (easy)
 * - Ring 2 (250-300px): Circular orbit (medium)
 * - Ring 3 (350-390px): Lissajous figure-8 (hard)
 */

import { H } from '@/game/constants';
import { assetPath } from '@/lib/assetPath';

// Motion pattern types
export type RingPattern = 'oscillate' | 'orbit' | 'lissajous';

export interface OscillationParams {
  amplitude: number;    // 15-25px vertical range
  frequency: number;    // 0.003-0.005 (slow, readable)
  phase: number;        // 0-2π offset
}

export interface OrbitParams {
  radius: number;       // 15-25px orbit size
  speed: number;        // 0.002-0.004 radians/ms
  clockwise: boolean;
}

export interface LissajousParams {
  ampX: number;         // 20-30px horizontal
  ampY: number;         // 15-20px vertical
  freqRatio: number;    // 1.5 or 2 (creates the shape)
  phase: number;        // π/2 for clean figure-8
  speed: number;        // 0.002-0.003
}

export type RingParams = OscillationParams | OrbitParams | LissajousParams;

export interface Ring {
  // Anchor position (center of motion)
  anchorX: number;
  anchorY: number;

  // Current animated position
  x: number;
  y: number;

  // Motion pattern
  pattern: RingPattern;
  params: RingParams;
  initialAngle: number;

  // Visual properties
  color: string;
  ringIndex: number;  // 0, 1, or 2

  // State
  passed: boolean;
  passedAt: number;
}

// Ring colors by difficulty (fallback for particles)
export const RING_COLORS = {
  easy: '#7FD858',    // Green-Gold
  medium: '#FFD700',  // Gold
  hard: '#FFA500',    // Orange-Gold
};

// Ring sprite assets (using assetPath for itch.io compatibility)
export const RING_SPRITES = {
  easy: assetPath('/assets/rings/6.png'),    // Green glow
  medium: assetPath('/assets/rings/5.png'),  // Gold glow
  hard: assetPath('/assets/rings/4.png'),    // Orange
  // Upgraded sprites (shown when previous rings passed)
  mediumUpgraded: assetPath('/assets/rings/7.png'),  // Ring 2 after Ring 1 passed
  hardUpgraded: assetPath('/assets/rings/8.png'),    // Ring 3 after all 3 passed
};

// Ring multipliers (escalating)
export const RING_MULTIPLIERS = [1.1, 1.25, 1.5];

// Hit zone radius (generous for fun, +15% to match larger visuals)
export const RING_HIT_ZONE = 20; // Increased 20% from 17 for more generous collision

// Ring zones along trajectory - WIDER spread for more variety
const RING_ZONES = [
  { minX: 100, maxX: 180, pattern: 'oscillate' as RingPattern, color: RING_COLORS.easy },
  { minX: 200, maxX: 320, pattern: 'orbit' as RingPattern, color: RING_COLORS.medium },
  { minX: 330, maxX: 400, pattern: 'lissajous' as RingPattern, color: RING_COLORS.hard },
];

/**
 * Seeded random number generator (mulberry32)
 * Deterministic randomness based on seed for consistent ring configs
 */
export function seededRandom(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Generate pattern-specific parameters
 * WILD MODE: Much bigger movements, more variety!
 */
function generateOscillationParams(random: () => number): OscillationParams {
  return {
    amplitude: 40 + random() * 40,         // 40-80px - BIG vertical swings
    frequency: 0.0017 + random() * 0.00255, // 15% slower (was 0.002-0.005)
    phase: random() * Math.PI * 2,         // 0-2π random start
  };
}

function generateOrbitParams(random: () => number): OrbitParams {
  return {
    radius: 35 + random() * 35,            // 35-70px - LARGE orbits
    speed: 0.00085 + random() * 0.00255,   // 15% slower (was 0.001-0.004)
    clockwise: random() > 0.5,
  };
}

function generateLissajousParams(random: () => number): LissajousParams {
  return {
    ampX: 50 + random() * 40,              // 50-90px horizontal sweep
    ampY: 35 + random() * 30,              // 35-65px vertical sweep
    freqRatio: 1 + random() * 2,           // 1-3 - more pattern variety
    phase: random() * Math.PI,             // Random phase for variety
    speed: 0.00085 + random() * 0.0017,    // 15% slower (was 0.001-0.003)
  };
}

function generatePatternParams(pattern: RingPattern, random: () => number): RingParams {
  switch (pattern) {
    case 'oscillate':
      return generateOscillationParams(random);
    case 'orbit':
      return generateOrbitParams(random);
    case 'lissajous':
      return generateLissajousParams(random);
  }
}

/**
 * Calculate anchor Y with randomness
 * More spread across the playable vertical area
 */
function calculateAnchorY(x: number, random: () => number): number {
  // Base Y follows rough trajectory arc
  const progress = x / 420;
  const arcHeight = 100; // Higher arc
  const baseY = H - 30; // Slightly above ground

  // Parabolic arc base
  const arcY = baseY - arcHeight * Math.sin(progress * Math.PI);

  // Add significant randomness (±40px)
  const randomOffset = (random() - 0.5) * 80;
  const y = arcY + randomOffset;

  // Clamp to playable area (more headroom)
  return Math.max(60, Math.min(H - 60, y));
}

/**
 * Generate a single ring configuration
 */
function generateRingConfig(seed: number, ringIndex: number): Omit<Ring, 'x' | 'y'> {
  const random = seededRandom(seed + ringIndex * 1000);
  const zone = RING_ZONES[ringIndex];

  const anchorX = zone.minX + random() * (zone.maxX - zone.minX);
  const anchorY = calculateAnchorY(anchorX, random);

  return {
    anchorX,
    anchorY,
    pattern: zone.pattern,
    params: generatePatternParams(zone.pattern, random),
    initialAngle: random() * Math.PI * 2,
    color: zone.color,
    ringIndex,
    passed: false,
    passedAt: 0,
  };
}

/**
 * Generate all 3 rings for a throw
 */
export function generateRings(seed: number): Ring[] {
  return [0, 1, 2].map(index => {
    const config = generateRingConfig(seed, index);
    return {
      ...config,
      x: config.anchorX,
      y: config.anchorY,
    };
  });
}

/**
 * Update ring position based on motion pattern
 */
export function updateRingPosition(ring: Ring, timeMs: number): void {
  const { pattern, params, anchorX, anchorY, initialAngle } = ring;

  switch (pattern) {
    case 'oscillate': {
      const p = params as OscillationParams;
      ring.x = anchorX;
      ring.y = anchorY + p.amplitude * Math.sin(p.frequency * timeMs + p.phase);
      break;
    }
    case 'orbit': {
      const p = params as OrbitParams;
      const direction = p.clockwise ? 1 : -1;
      const angle = direction * p.speed * timeMs + initialAngle;
      ring.x = anchorX + p.radius * Math.cos(angle);
      ring.y = anchorY + p.radius * Math.sin(angle);
      break;
    }
    case 'lissajous': {
      const p = params as LissajousParams;
      const t = timeMs * p.speed;
      ring.x = anchorX + p.ampX * Math.sin(t);
      ring.y = anchorY + p.ampY * Math.sin(p.freqRatio * t + p.phase);
      break;
    }
  }
}

/**
 * Check if Zeno passes through a ring
 */
export function checkRingCollision(zenoX: number, zenoY: number, ring: Ring): boolean {
  if (ring.passed) return false;

  const dx = zenoX - ring.x;
  const dy = zenoY - ring.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < RING_HIT_ZONE;
}

/**
 * Reset all rings for a new throw (marks as not passed)
 */
export function resetRings(rings: Ring[]): void {
  rings.forEach(ring => {
    ring.passed = false;
    ring.passedAt = 0;
  });
}
