// src/game/engine/arcade/arcadeAssets.ts
import { assetPath } from '@/lib/assetPath';

// Sprite animation configuration
export interface SpriteConfig {
  frames: string[];      // Array of frame paths
  fps: number;           // Animation speed
  loop: boolean;         // Whether to loop animation
}

// Hazard sprites (3 frames each, looping)
export const HAZARD_SPRITES: Record<string, SpriteConfig> = {
  spike: {
    frames: [
      assetPath('/assets/arcade/hazards/spike1a.png'),
      assetPath('/assets/arcade/hazards/spike2a.png'),
      assetPath('/assets/arcade/hazards/spike3a.png'),
    ],
    fps: 4,
    loop: true,
  },
  saw: {
    frames: [
      assetPath('/assets/arcade/hazards/saw1a.png'),
      assetPath('/assets/arcade/hazards/saw2a.png'),
      assetPath('/assets/arcade/hazards/saw3a.png'),
    ],
    fps: 8,  // Faster for spinning saw
    loop: true,
  },
  fire: {
    frames: [
      assetPath('/assets/arcade/hazards/fire1a.png'),
      assetPath('/assets/arcade/hazards/fire2a.png'),
      assetPath('/assets/arcade/hazards/fire3a.png'),
    ],
    fps: 6,
    loop: true,
  },
};

// Spring sprites (3 frames, for bounce animation)
export const SPRING_SPRITES: SpriteConfig = {
  frames: [
    assetPath('/assets/arcade/springs/spring1a.png'),
    assetPath('/assets/arcade/springs/spring2a.png'),
    assetPath('/assets/arcade/springs/spring3a.png'),
  ],
  fps: 8,
  loop: false,
};

// Portal sprites by color (3 frames each)
export const PORTAL_COLORS = ['blue', 'green', 'orange', 'pink', 'purple', 'yellow'] as const;
export type PortalColor = typeof PORTAL_COLORS[number];

export const PORTAL_SPRITES: Record<PortalColor, SpriteConfig> = {
  blue: {
    frames: [
      assetPath('/assets/arcade/portals/portal_blue_1.png'),
      assetPath('/assets/arcade/portals/portal_blue_2.png'),
      assetPath('/assets/arcade/portals/portal_blue_3.png'),
    ],
    fps: 6,
    loop: true,
  },
  green: {
    frames: [
      assetPath('/assets/arcade/portals/portal_green_1.png'),
      assetPath('/assets/arcade/portals/portal_green_2.png'),
      assetPath('/assets/arcade/portals/portal_green_3.png'),
    ],
    fps: 6,
    loop: true,
  },
  orange: {
    frames: [
      assetPath('/assets/arcade/portals/portal_orange_1.png'),
      assetPath('/assets/arcade/portals/portal_orange_2.png'),
      assetPath('/assets/arcade/portals/portal_orange_3.png'),
    ],
    fps: 6,
    loop: true,
  },
  pink: {
    frames: [
      assetPath('/assets/arcade/portals/portal_pink_1.png'),
      assetPath('/assets/arcade/portals/portal_pink_2.png'),
      assetPath('/assets/arcade/portals/portal_pink_3.png'),
    ],
    fps: 6,
    loop: true,
  },
  purple: {
    frames: [
      assetPath('/assets/arcade/portals/portal_purple_1.png'),
      assetPath('/assets/arcade/portals/portal_purple_2.png'),
      assetPath('/assets/arcade/portals/portal_purple_3.png'),
    ],
    fps: 6,
    loop: true,
  },
  yellow: {
    frames: [
      assetPath('/assets/arcade/portals/portal_yellow_1.png'),
      assetPath('/assets/arcade/portals/portal_yellow_2.png'),
      assetPath('/assets/arcade/portals/portal_yellow_3.png'),
    ],
    fps: 6,
    loop: true,
  },
};

// Zone sprites
export const ZONE_SPRITES: Record<string, SpriteConfig> = {
  ice: {
    frames: [
      assetPath('/assets/arcade/zones/ice1a.png'),
      assetPath('/assets/arcade/zones/ice2a.png'),
      assetPath('/assets/arcade/zones/ice3a.png'),
    ],
    fps: 4,
    loop: true,
  },
  sticky: {
    frames: [
      assetPath('/assets/arcade/zones/sticky1a.png'),
      assetPath('/assets/arcade/zones/sticky2a.png'),
      assetPath('/assets/arcade/zones/sticky3a.png'),
    ],
    fps: 4,
    loop: true,
  },
  wind: {
    frames: [
      assetPath('/assets/arcade/zones/wind1a.png'),
      assetPath('/assets/arcade/zones/wind2a.png'),
    ],
    fps: 6,
    loop: true,
  },
};

// Explosion effect
export const EXPLOSION_SPRITES: SpriteConfig = {
  frames: [
    assetPath('/assets/arcade/effects/explosion1a.png'),
    assetPath('/assets/arcade/effects/explosion2a.png'),
    assetPath('/assets/arcade/effects/explosion3a.png'),
  ],
  fps: 10,
  loop: false,
};

// Sprite cache for loaded images
const spriteCache: Map<string, HTMLImageElement> = new Map();

/**
 * Get or load a sprite image
 */
export function getSprite(path: string): HTMLImageElement | null {
  const cached = spriteCache.get(path);
  if (cached) {
    return cached.complete && cached.naturalWidth > 0 ? cached : null;
  }

  const img = new Image();
  img.src = path;
  spriteCache.set(path, img);
  return null; // Return null until loaded
}

/**
 * Get current animation frame based on time
 */
export function getAnimationFrame(config: SpriteConfig, timeMs: number): number {
  const frameDuration = 1000 / config.fps;
  const totalFrames = config.frames.length;

  if (config.loop) {
    return Math.floor((timeMs / frameDuration) % totalFrames);
  } else {
    return Math.min(Math.floor(timeMs / frameDuration), totalFrames - 1);
  }
}

/**
 * Preload all arcade sprites
 */
export function preloadArcadeSprites(): void {
  // Preload hazards
  Object.values(HAZARD_SPRITES).forEach(config => {
    config.frames.forEach(path => {
      const img = new Image();
      img.src = path;
      spriteCache.set(path, img);
    });
  });

  // Preload springs
  SPRING_SPRITES.frames.forEach(path => {
    const img = new Image();
    img.src = path;
    spriteCache.set(path, img);
  });

  // Preload portals
  Object.values(PORTAL_SPRITES).forEach(config => {
    config.frames.forEach(path => {
      const img = new Image();
      img.src = path;
      spriteCache.set(path, img);
    });
  });

  // Preload zones
  Object.values(ZONE_SPRITES).forEach(config => {
    config.frames.forEach(path => {
      const img = new Image();
      img.src = path;
      spriteCache.set(path, img);
    });
  });

  // Preload explosion
  EXPLOSION_SPRITES.frames.forEach(path => {
    const img = new Image();
    img.src = path;
    spriteCache.set(path, img);
  });
}

// Auto-preload on module import
preloadArcadeSprites();
