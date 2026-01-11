// src/game/engine/fxConfig.ts

/**
 * Special Effects sprite sheet configuration
 * Defines paths, frame sizes, and animation metadata for all FX
 *
 * NOTE: Display sizes are scaled down ~4x from source assets
 * to fit the 480x240 game canvas where characters are ~20-30px tall
 */

export type FXName =
  | 'chargeSwirl'
  | 'chargeDust'
  | 'launchBurst'
  | 'launchSparks'
  | 'speedLines'
  | 'motionTrail'
  | 'whoosh'
  | 'impactBurst'
  | 'landingDust'
  | 'groundCracks'
  | 'impactDebris'
  | 'fallSwirl'
  | 'panicMarks'
  | 'starSparkle';

export interface FXConfig {
  name: FXName;
  path: {
    flipbook: string;
    noir: string;
  };
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  frameRate: number;
  loop: boolean;
  // Display size (scaled down from source for game canvas)
  displayWidth: number;
  displayHeight: number;
  // Anchor point (0-1, where 0.5 = center)
  anchorX: number;
  anchorY: number;
}

const FX_BASE_PATH = '/assets/specialfx_assets';

export const FX_CONFIGS: FXConfig[] = [
  // === CHARGING EFFECTS ===
  {
    name: 'chargeSwirl',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-charge-swirl-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-charge-swirl-noir.png`,
    },
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 8,
    frameRate: 12,
    loop: true,
    displayWidth: 16,
    displayHeight: 16,
    anchorX: 0.5,
    anchorY: 0.5,
  },
  {
    name: 'chargeDust',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-charge-dust-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-charge-dust-noir.png`,
    },
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 8,
    frameRate: 10,
    loop: true,
    displayWidth: 8,
    displayHeight: 8,
    anchorX: 0.5,
    anchorY: 1.0, // Bottom-anchored (dust rises from ground)
  },

  // === LAUNCH EFFECTS ===
  {
    name: 'launchBurst',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-launch-burst-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-launch-burst-noir.png`,
    },
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 8,
    frameRate: 15,
    loop: false,
    displayWidth: 16,
    displayHeight: 16,
    anchorX: 0.5,
    anchorY: 0.5,
  },
  {
    name: 'launchSparks',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-launch-sparks-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-launch-sparks-noir.png`,
    },
    frameWidth: 48,
    frameHeight: 48,
    frameCount: 8,
    frameRate: 20,
    loop: false,
    displayWidth: 12,
    displayHeight: 12,
    anchorX: 0.5,
    anchorY: 0.5,
  },

  // === FLIGHT EFFECTS ===
  {
    name: 'speedLines',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-speed-lines-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-speed-lines-noir.png`,
    },
    frameWidth: 128,
    frameHeight: 64,
    frameCount: 4,
    frameRate: 16,
    loop: true,
    displayWidth: 32,
    displayHeight: 16,
    anchorX: 0.7, // Offset right so lines trail behind
    anchorY: 0.5,
  },
  {
    name: 'motionTrail',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-motion-trail-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-motion-trail-noir.png`,
    },
    frameWidth: 50,
    frameHeight: 50,
    frameCount: 4,
    frameRate: 8,
    loop: false,
    displayWidth: 12,
    displayHeight: 12,
    anchorX: 0.5,
    anchorY: 0.5,
  },
  {
    name: 'whoosh',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-whoosh-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-whoosh-noir.png`,
    },
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 4,
    frameRate: 12,
    loop: true,
    displayWidth: 16,
    displayHeight: 16,
    anchorX: 0.5,
    anchorY: 0.5,
  },

  // === LANDING EFFECTS ===
  {
    name: 'impactBurst',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-impact-burst-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-impact-burst-noir.png`,
    },
    frameWidth: 80,
    frameHeight: 80,
    frameCount: 8,
    frameRate: 15,
    loop: false,
    displayWidth: 20,
    displayHeight: 20,
    anchorX: 0.5,
    anchorY: 0.5,
  },
  {
    name: 'landingDust',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-landing-dust-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-landing-dust-noir.png`,
    },
    frameWidth: 80,
    frameHeight: 64,
    frameCount: 8,
    frameRate: 12,
    loop: false,
    displayWidth: 20,
    displayHeight: 16,
    anchorX: 0.5,
    anchorY: 1.0, // Bottom-anchored
  },
  {
    name: 'groundCracks',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-ground-cracks-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-ground-cracks-noir.png`,
    },
    frameWidth: 80,
    frameHeight: 60,
    frameCount: 6,
    frameRate: 10,
    loop: false,
    displayWidth: 20,
    displayHeight: 15,
    anchorX: 0.5,
    anchorY: 0.0, // Top-anchored (cracks spread down from impact)
  },
  {
    name: 'impactDebris',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-impact-debris-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-impact-debris-noir.png`,
    },
    frameWidth: 48,
    frameHeight: 48,
    frameCount: 8,
    frameRate: 15,
    loop: false,
    displayWidth: 12,
    displayHeight: 12,
    anchorX: 0.5,
    anchorY: 1.0, // Bottom-anchored
  },

  // === FAILURE EFFECTS ===
  {
    name: 'fallSwirl',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-fall-swirl-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-fall-swirl-noir.png`,
    },
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 4,
    frameRate: 8,
    loop: true,
    displayWidth: 16,
    displayHeight: 16,
    anchorX: 0.5,
    anchorY: 0.5,
  },
  {
    name: 'panicMarks',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-panic-marks-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-panic-marks-noir.png`,
    },
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 4,
    frameRate: 6,
    loop: true,
    displayWidth: 8,
    displayHeight: 8,
    anchorX: 0.5,
    anchorY: 1.0, // Appears above head
  },

  // === UI EFFECTS ===
  {
    name: 'starSparkle',
    path: {
      flipbook: `${FX_BASE_PATH}/flipbook/fx-star-sparkle-flipbook.png`,
      noir: `${FX_BASE_PATH}/noir/fx-star-sparkle-noir.png`,
    },
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 4,
    frameRate: 6,
    loop: true,
    displayWidth: 8,
    displayHeight: 8,
    anchorX: 0.5,
    anchorY: 0.5,
  },
];

/**
 * Get FX config by name
 */
export function getFXConfig(name: FXName): FXConfig | undefined {
  return FX_CONFIGS.find(c => c.name === name);
}

/**
 * Get all FX asset paths for preloading
 */
export function getAllFXPaths(theme: 'flipbook' | 'noir'): string[] {
  return FX_CONFIGS.map(c => c.path[theme]);
}
