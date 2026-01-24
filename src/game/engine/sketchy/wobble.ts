// Wobble utilities for hand-drawn effect

import { WOBBLE_INTENSITY, WOBBLE_FRAME_MS } from './constants';

// Seeded random for deterministic wobble
export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Get wobble offset for hand-drawn effect
export function getWobble(
  x: number,
  y: number,
  nowMs: number,
  intensity: number = WOBBLE_INTENSITY.standard
): { dx: number; dy: number } {
  const frame = Math.floor(nowMs / WOBBLE_FRAME_MS);
  const dx = (seededRandom(x * 50 + y * 30 + frame) - 0.5) * intensity;
  const dy = (seededRandom(y * 50 + x * 30 + frame + 100) - 0.5) * intensity;
  return { dx, dy };
}

// Helper to adjust alpha of a color
export function adjustAlpha(color: string, alpha: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  // Handle rgba colors
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/, `${alpha})`);
  }
  // Handle rgb colors
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  }
  return color;
}
