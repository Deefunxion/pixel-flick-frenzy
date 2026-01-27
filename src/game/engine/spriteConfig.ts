// src/game/engine/spriteConfig.ts

import { assetPath } from '@/lib/assetPath';

/**
 * Sprite sheet configuration for Zeno character
 * Defines paths, frame sizes, and animation metadata
 *
 * Sprite sheet format: Horizontal strip (6400 x 128 px)
 * - 50 frames total, each 128x128 pixels
 * - All frames in a single row
 */

// Frame size in the sprite sheet (pixels)
export const FRAME_WIDTH = 128;
export const FRAME_HEIGHT = 128;

// In-game display size (scales down from frame size)
export const ZENO_DISPLAY_WIDTH = 30;
export const ZENO_DISPLAY_HEIGHT = 30;

// Sprite sheet paths (v2 = 50-frame animation system, 2026-01-17)
// Cache-busting version to force reload of new sprite sheet
const SPRITE_VERSION = 'v2';

export const SPRITE_SHEETS = {
  flipbook: assetPath(`/assets/sprites/zeno-flipbook.png?${SPRITE_VERSION}`),
  noir: assetPath(`/assets/sprites/zeno-noir.png?${SPRITE_VERSION}`),
} as const;

// Animation types
export type AnimationName = 'idle' | 'coil' | 'launch' | 'fly' | 'descend' | 'touchdown' | 'slide' | 'win' | 'lose';

// Animation configuration
export interface AnimationConfig {
  name: AnimationName;
  frames: number[];      // Frame indices in the sprite sheet
  frameRate: number;     // Frames per second
  loop: boolean;         // Whether to loop or stop on last frame
}

// Frame layout: horizontal strip, frames 0-49
// idle(0-3), coil(4-12), launch(13-16), fly(17-22), descend(23-28), touchdown(29), slide(30-33), win(34-35), lose(36-49)

export const ANIMATIONS: AnimationConfig[] = [
  {
    name: 'idle',
    frames: [0, 1, 2, 3],
    frameRate: 3,  // Slow breathing animation
    loop: true,
  },
  {
    name: 'coil',
    frames: [4, 5, 6, 7, 8, 9, 10, 11, 12],  // Charging sequence (9 frames)
    frameRate: 4,  // Slower charge-up to see all frames
    loop: false,
  },
  {
    name: 'launch',
    frames: [13, 14, 15, 16],  // Launch/jump animation
    frameRate: 8,
    loop: false,
  },
  {
    name: 'fly',
    frames: [17, 18, 19, 20, 21, 22],  // Flying through air (6 frames)
    frameRate: 4,  // Moderate speed
    loop: true,
  },
  {
    name: 'descend',
    frames: [23, 24, 25, 26, 27, 28],  // Coming down (6 frames)
    frameRate: 4,  // Moderate speed
    loop: true,
  },
  {
    name: 'touchdown',
    frames: [29],  // Landing on ground (1 frame)
    frameRate: 1,  // Static
    loop: false,
  },
  {
    name: 'slide',
    frames: [30, 31, 32, 33],  // Sliding on ground (4 frames) - plays through then holds on last frame
    frameRate: 10,  // Fast transition through first 3 frames
    loop: false,  // Stops and holds on frame 33 (4.png)
  },
  {
    name: 'win',
    frames: [34, 35],  // Victory celebration (2 poses - random selection)
    frameRate: 1,  // Static (random frame selected on play)
    loop: false,
    // Note: Animator will randomly pick one of these frames
  },
  {
    name: 'lose',
    frames: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49],  // Fall and defeat (14 frames)
    frameRate: 6,
    loop: false,
  },
];

/**
 * Get the source rectangle for a frame index.
 * Horizontal strip layout: all frames in a single row.
 */
export function getFrameRect(frameIndex: number): { x: number; y: number; w: number; h: number } {
  return {
    x: frameIndex * FRAME_WIDTH,
    y: 0,
    w: FRAME_WIDTH,
    h: FRAME_HEIGHT,
  };
}

/**
 * Get animation config by name.
 */
export function getAnimationConfig(name: AnimationName): AnimationConfig | undefined {
  return ANIMATIONS.find(a => a.name === name);
}
