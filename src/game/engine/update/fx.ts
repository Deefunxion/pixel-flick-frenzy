/**
 * FX module for update system
 * Handles particle updates, stars, grid, trail aging, ring positions
 */

import type { GameState } from '../types';
import { updateRingPosition } from '../rings';

/**
 * Update stars (background effect)
 */
export function updateStars(state: GameState, nowMs: number): void {
  for (const star of state.stars) {
    star.x -= star.speed;
    if (star.x < 0) {
      star.x = 160;
      star.y = Math.random() * (80 * 0.6);
    }
    star.brightness = 0.3 + Math.abs(Math.sin(nowMs / 500 + star.x)) * 0.7;
  }
}

/**
 * Update grid offset (scrolling effect)
 */
export function updateGrid(state: GameState): void {
  state.gridOffset = (state.gridOffset + 0.3) % 10;
}

/**
 * Age and clean up trail points
 */
export function updateTrail(state: GameState): void {
  for (const t of state.trail) t.age++;
  state.trail = state.trail.filter((t) => t.age < 40);
}

/**
 * Update old particle system
 */
export function updateParticles(state: GameState): void {
  state.particles = state.particles.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life--;
    return p.life > 0;
  });
}

/**
 * Update new particle system
 */
export function updateParticleSystem(state: GameState): void {
  if (state.particleSystem) {
    state.particleSystem.update(1);
  }
}

/**
 * Update all ring positions for smooth animation
 */
export function updateRingPositions(state: GameState, nowMs: number): void {
  for (const ring of state.rings) {
    updateRingPosition(ring, nowMs);
  }
}

/**
 * Update edge glow decay
 */
export function updateEdgeGlow(state: GameState): void {
  if (state.edgeGlowIntensity > 0) {
    state.edgeGlowIntensity *= 0.95;
    if (state.edgeGlowIntensity < 0.01) {
      state.edgeGlowIntensity = 0;
    }
  }
}

/**
 * Reset multiplier (risk multiplier removed - only ring multiplier affects score)
 */
export function resetCurrentMultiplier(state: GameState): void {
  state.currentMultiplier = 1;
}
