// src/game/engine/arcade/levels.ts
import type { ArcadeLevel } from './types';

// Available sprites: 'coin', 'star' (from /assets/pickables/)
// Alternate between coin and star for visual variety
export const ARCADE_LEVELS: ArcadeLevel[] = [
  // Level 1: Just land (intro)
  {
    id: 1,
    landingTarget: 410,
    doodles: [],
    springs: [],
    portal: null,
  },
  // Level 2: 1 doodle
  {
    id: 2,
    landingTarget: 411,
    doodles: [
      { x: 200, y: 100, size: 'large', sprite: 'coin', sequence: 1 },
    ],
    springs: [],
    portal: null,
  },
  // Level 3: 2 doodles
  {
    id: 3,
    landingTarget: 412,
    doodles: [
      { x: 150, y: 90, size: 'large', sprite: 'coin', sequence: 1 },
      { x: 280, y: 110, size: 'small', sprite: 'star', sequence: 2 },
    ],
    springs: [],
    portal: null,
  },
  // Level 4: 3 doodles
  {
    id: 4,
    landingTarget: 413,
    doodles: [
      { x: 120, y: 80, size: 'large', sprite: 'star', sequence: 1 },
      { x: 220, y: 100, size: 'small', sprite: 'coin', sequence: 2 },
      { x: 320, y: 120, size: 'small', sprite: 'star', sequence: 3 },
    ],
    springs: [],
    portal: null,
  },
  // Level 5: 3 doodles, order matters
  {
    id: 5,
    landingTarget: 414,
    doodles: [
      { x: 140, y: 70, size: 'large', sprite: 'coin', sequence: 1 },
      { x: 250, y: 120, size: 'small', sprite: 'star', sequence: 2 },
      { x: 340, y: 90, size: 'small', sprite: 'coin', sequence: 3 },
    ],
    springs: [],
    portal: null,
  },
  // Level 6: 3 doodles + 1 spring
  {
    id: 6,
    landingTarget: 415,
    doodles: [
      { x: 130, y: 60, size: 'large', sprite: 'star', sequence: 1 },
      { x: 240, y: 50, size: 'small', sprite: 'coin', sequence: 2 }, // needs spring
      { x: 350, y: 100, size: 'small', sprite: 'star', sequence: 3 },
    ],
    springs: [
      { x: 180, y: 130, direction: 'up' },
    ],
    portal: null,
  },
  // Level 7: 4 doodles + 2 springs
  {
    id: 7,
    landingTarget: 416,
    doodles: [
      { x: 100, y: 80, size: 'large', sprite: 'coin', sequence: 1 },
      { x: 180, y: 40, size: 'small', sprite: 'star', sequence: 2 },
      { x: 280, y: 60, size: 'small', sprite: 'coin', sequence: 3 },
      { x: 360, y: 110, size: 'small', sprite: 'star', sequence: 4 },
    ],
    springs: [
      { x: 140, y: 120, direction: 'up-right' },
      { x: 240, y: 100, direction: 'up' },
    ],
    portal: null,
  },
  // Level 8: 5 doodles + 2 springs + portal
  {
    id: 8,
    landingTarget: 417,
    doodles: [
      { x: 80, y: 90, size: 'large', sprite: 'star', sequence: 1 },
      { x: 150, y: 50, size: 'small', sprite: 'coin', sequence: 2 },
      { x: 380, y: 60, size: 'small', sprite: 'star', sequence: 3 }, // via portal
      { x: 320, y: 100, size: 'small', sprite: 'coin', sequence: 4 },
      { x: 390, y: 130, size: 'small', sprite: 'star', sequence: 5 },
    ],
    springs: [
      { x: 120, y: 130, direction: 'up' },
      { x: 350, y: 90, direction: 'up-left' },
    ],
    portal: {
      entry: { x: 15, y: 40 },   // Upper-left frame edge
      exit: { x: 380, y: 60 },   // Right side, high up (before cliff edge 420)
    },
  },
  // Level 9: 5 doodles + 2 springs + portal (tighter)
  {
    id: 9,
    landingTarget: 418,
    doodles: [
      { x: 90, y: 70, size: 'large', sprite: 'coin', sequence: 1 },
      { x: 160, y: 45, size: 'small', sprite: 'star', sequence: 2 },
      { x: 250, y: 55, size: 'small', sprite: 'coin', sequence: 3 },
      { x: 340, y: 80, size: 'small', sprite: 'star', sequence: 4 },
      { x: 400, y: 120, size: 'small', sprite: 'coin', sequence: 5 },
    ],
    springs: [
      { x: 130, y: 110, direction: 'up-right' },
      { x: 300, y: 120, direction: 'up' },
    ],
    portal: {
      entry: { x: 15, y: 50 },   // Upper-left frame edge
      exit: { x: 370, y: 55 },   // Right side, high up (before cliff edge 420)
    },
  },
  // Level 10: 6 doodles + 2 springs + portal (final exam)
  {
    id: 10,
    landingTarget: 419,
    doodles: [
      { x: 70, y: 80, size: 'large', sprite: 'star', sequence: 1 },
      { x: 130, y: 50, size: 'small', sprite: 'coin', sequence: 2 },
      { x: 200, y: 70, size: 'small', sprite: 'star', sequence: 3 },
      { x: 300, y: 45, size: 'small', sprite: 'coin', sequence: 4 },
      { x: 370, y: 80, size: 'small', sprite: 'star', sequence: 5 },
      { x: 410, y: 110, size: 'small', sprite: 'coin', sequence: 6 },
    ],
    springs: [
      { x: 110, y: 120, direction: 'up' },
      { x: 260, y: 100, direction: 'up-right' },
    ],
    portal: {
      entry: { x: 15, y: 45 },   // Upper-left frame edge
      exit: { x: 360, y: 50 },   // Right side, high up (before cliff edge 420)
    },
  },
];

export function getLevel(id: number): ArcadeLevel | undefined {
  return ARCADE_LEVELS.find(level => level.id === id);
}

export function getTotalLevels(): number {
  return ARCADE_LEVELS.length;
}
