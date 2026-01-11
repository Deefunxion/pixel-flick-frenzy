// src/game/engine/spriteConfig.ts

/**
 * Sprite sheet configuration for Zeno character
 * Defines paths, frame sizes, and animation metadata
 *
 * Sprite sheet format: Horizontal strip (2816 x 128 px)
 * - 22 frames total, each 128x128 pixels
 * - All frames in a single row
 */

// Frame size in the sprite sheet (pixels)
export const FRAME_WIDTH = 128;
export const FRAME_HEIGHT = 128;

// In-game display size (scales down from frame size)
export const ZENO_DISPLAY_WIDTH = 50;
export const ZENO_DISPLAY_HEIGHT = 50;

// Sprite sheet paths
export const SPRITE_SHEETS = {
  flipbook: '/assets/sprites/zeno-flipbook.png',
  noir: '/assets/sprites/zeno-noir.png',
} as const;

// Animation types
export type AnimationName = 'idle' | 'coil' | 'bolt' | 'impact' | 'fail';

// Animation configuration
export interface AnimationConfig {
  name: AnimationName;
  frames: number[];      // Frame indices in the sprite sheet
  frameRate: number;     // Frames per second
  loop: boolean;         // Whether to loop or stop on last frame
}

// Frame layout: horizontal strip, frames 0-21
// Frames arranged left-to-right: idle (0-3), coil (4-9), bolt (10-12), impact (13-17), fail (18-21)

export const ANIMATIONS: AnimationConfig[] = [
  {
    name: 'idle',
    frames: [0, 1, 2, 3],
    frameRate: 4,  // Slow breathing animation
    loop: true,
  },
  {
    name: 'coil',
    frames: [4],  // Temporarily single frame - noir sprite sheet needs fixing
    frameRate: 1.4,  // ~0.7 sec per frame for slow charging feel
    loop: false,
  },
  {
    name: 'bolt',
    frames: [10],  // Single frame - removed 11 (empty) and 12 (reversed)
    frameRate: 8,
    loop: true,
  },
  {
    name: 'impact',
    frames: [13, 14, 15, 16, 17],
    frameRate: 10,  // Slower landing
    loop: false,
  },
  {
    name: 'fail',
    frames: [18, 19, 20, 21],
    frameRate: 8,  // Slower tumble
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
