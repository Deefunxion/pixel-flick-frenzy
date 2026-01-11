// src/game/engine/backgroundAssets.ts

/**
 * Background asset paths and configuration
 * All assets are 2x resolution (canvas is 480x240, assets are 960x480 base)
 */

export const BACKGROUND_ASSETS = {
  paper: '/assets/background/paper-background.png',

  clouds: {
    large: '/assets/background/clouds/cloud-large.png',
    medium: '/assets/background/clouds/cloud-medium.png',
    small: '/assets/background/clouds/cloud-small.png',
  },

  terrain: {
    ground: '/assets/background/terrain/terrain-ground.png',
    cliffEdge: '/assets/background/terrain/cliff-edge.png',
  },

  void: {
    layer1: '/assets/background/void/void-layer-1.png',
    layer2: '/assets/background/void/void-layer-2.png',
    layer3: '/assets/background/void/void-layer-3.png',
    gradient: '/assets/background/void/void-gradient.png',
  },

  flag: {
    frame1: '/assets/background/flag/flag-frame-01.png',
    frame2: '/assets/background/flag/flag-frame-02.png',
    frame3: '/assets/background/flag/flag-frame-03.png',
    frame4: '/assets/background/flag/flag-frame-04.png',
  },

  wind: {
    swoosh1: '/assets/background/wind/wind-swoosh-1.png',
    swoosh2: '/assets/background/wind/wind-swoosh-2.png',
    swoosh3: '/assets/background/wind/wind-swoosh-3.png',
    particlePaper: '/assets/background/wind/particle-paper-scrap.png',
    particleLeaf: '/assets/background/wind/particle-leaf.png',
    particleDust1: '/assets/background/wind/particle-dust-1.png',
    particleDust2: '/assets/background/wind/particle-dust-2.png',
  },
} as const;

/** Get flat array of all asset paths for preloading */
export function getAllBackgroundAssetPaths(): string[] {
  const paths: string[] = [];

  paths.push(BACKGROUND_ASSETS.paper);
  paths.push(...Object.values(BACKGROUND_ASSETS.clouds));
  paths.push(...Object.values(BACKGROUND_ASSETS.terrain));
  paths.push(...Object.values(BACKGROUND_ASSETS.void));
  paths.push(...Object.values(BACKGROUND_ASSETS.flag));
  paths.push(...Object.values(BACKGROUND_ASSETS.wind));

  return paths;
}

/** Asset dimensions at 2x scale */
export const ASSET_DIMENSIONS = {
  paper: { width: 960, height: 480 },
  cloudLarge: { width: 280, height: 140 },
  cloudMedium: { width: 200, height: 100 },
  cloudSmall: { width: 140, height: 70 },
  terrainGround: { width: 960, height: 100 },
  cliffEdge: { width: 200, height: 300 },
  voidLayer: { width: 1920, height: 200 },
  flag: { width: 80, height: 120 },
  swoosh: { width: 300, height: 60 },
} as const;

/** Canvas scale factor (assets are 2x) */
export const ASSET_SCALE = 0.5;
