// src/game/engine/backgroundAssets.ts

import { assetPath } from '@/lib/assetPath';

/**
 * Background asset paths and configuration
 * All assets are 2x resolution (canvas is 480x240, assets are 960x480 base)
 */

export const BACKGROUND_ASSETS = {
  paper: assetPath('/assets/background/paper-background.png'),

  clouds: {
    large: assetPath('/assets/background/clouds/cloud-large.png'),
    medium: assetPath('/assets/background/clouds/cloud-medium.png'),
    small: assetPath('/assets/background/clouds/cloud-small.png'),
  },

  terrain: {
    ground: assetPath('/assets/background/terrain/terrain-ground.png'),
    cliffEdge: assetPath('/assets/background/terrain/cliff-edge.png'),
  },

  void: {
    layer1: assetPath('/assets/background/void/void-layer-1.png'),
    layer2: assetPath('/assets/background/void/void-layer-2.png'),
    layer3: assetPath('/assets/background/void/void-layer-3.png'),
    gradient: assetPath('/assets/background/void/void-gradient.png'),
  },

  flag: {
    frame1: assetPath('/assets/background/flag/flag-frame-01.png'),
    frame2: assetPath('/assets/background/flag/flag-frame-02.png'),
    frame3: assetPath('/assets/background/flag/flag-frame-03.png'),
    frame4: assetPath('/assets/background/flag/flag-frame-04.png'),
  },

  wind: {
    swoosh1: assetPath('/assets/background/wind/wind-swoosh-1.png'),
    swoosh2: assetPath('/assets/background/wind/wind-swoosh-2.png'),
    swoosh3: assetPath('/assets/background/wind/wind-swoosh-3.png'),
    particlePaper: assetPath('/assets/background/wind/particle-paper-scrap.png'),
    particleLeaf: assetPath('/assets/background/wind/particle-leaf.png'),
    particleDust1: assetPath('/assets/background/wind/particle-dust-1.png'),
    particleDust2: assetPath('/assets/background/wind/particle-dust-2.png'),
  },

  // Decorative elements
  decor: {
    sun: assetPath('/assets/background/Background_assets/4.png'),
    birdDove: assetPath('/assets/background/Background_assets/8.png'),
    birdSeagull: assetPath('/assets/background/Background_assets/10.png'),
    tree: assetPath('/assets/background/Background_assets/11.png'),
    bush: assetPath('/assets/background/Background_assets/12.png'),
    rocks: assetPath('/assets/background/Background_assets/13.png'),
    grass: assetPath('/assets/background/Background_assets/14.png'),
    signpost: assetPath('/assets/background/Background_assets/17.png'),
  },
};

/** Noir theme background asset paths */
export const NOIR_BACKGROUND_ASSETS = {
  background: assetPath('/assets/background/noir/noir-background.png'),

  clouds: {
    large: assetPath('/assets/background/noir/clouds/noir-cloud-large.png'),
    medium: assetPath('/assets/background/noir/clouds/noir-cloud-medium.png'),
    small: assetPath('/assets/background/noir/clouds/noir-cloud-small.png'),
  },

  terrain: {
    ground: assetPath('/assets/background/noir/terrain/noir-terrain-ground.png'),
    cliffEdge: assetPath('/assets/background/noir/terrain/noir-cliff-edge.png'),
  },

  void: {
    layer1: assetPath('/assets/background/noir/void/noir-void-layer-1.png'),
    layer2: assetPath('/assets/background/noir/void/noir-void-layer-2.png'),
    layer3: assetPath('/assets/background/noir/void/noir-void-layer-3.png'),
    gradient: assetPath('/assets/background/noir/void/noir-void-gradient.png'),
  },

  flag: {
    frame1: assetPath('/assets/background/noir/flag/noir-flag-frame-01.png'),
    frame2: assetPath('/assets/background/noir/flag/noir-flag-frame-02.png'),
    frame3: assetPath('/assets/background/noir/flag/noir-flag-frame-03.png'),
    frame4: assetPath('/assets/background/noir/flag/noir-flag-frame-04.png'),
  },

  wind: {
    swoosh1: assetPath('/assets/background/noir/wind/noir-wind-swoosh-1.png'),
    swoosh2: assetPath('/assets/background/noir/wind/noir-wind-swoosh-2.png'),
    swoosh3: assetPath('/assets/background/noir/wind/noir-wind-swoosh-3.png'),
    particleDust1: assetPath('/assets/background/noir/wind/noir-particle-dust-1.png'),
    particleDust2: assetPath('/assets/background/noir/wind/noir-particle-dust-2.png'),
    particleDust3: assetPath('/assets/background/noir/wind/noir-particle-dust-3.png'),
  },
};

/** Get flat array of all asset paths for preloading */
export function getAllBackgroundAssetPaths(): string[] {
  const paths: string[] = [];

  paths.push(BACKGROUND_ASSETS.paper);
  paths.push(...Object.values(BACKGROUND_ASSETS.clouds));
  paths.push(...Object.values(BACKGROUND_ASSETS.terrain));
  paths.push(...Object.values(BACKGROUND_ASSETS.void));
  paths.push(...Object.values(BACKGROUND_ASSETS.flag));
  paths.push(...Object.values(BACKGROUND_ASSETS.wind));
  paths.push(...Object.values(BACKGROUND_ASSETS.decor));

  return paths;
}

/** Get flat array of all noir background asset paths for preloading */
export function getAllNoirBackgroundAssetPaths(): string[] {
  const paths: string[] = [];

  paths.push(NOIR_BACKGROUND_ASSETS.background);
  paths.push(...Object.values(NOIR_BACKGROUND_ASSETS.clouds));
  paths.push(...Object.values(NOIR_BACKGROUND_ASSETS.terrain));
  paths.push(...Object.values(NOIR_BACKGROUND_ASSETS.void));
  paths.push(...Object.values(NOIR_BACKGROUND_ASSETS.flag));
  paths.push(...Object.values(NOIR_BACKGROUND_ASSETS.wind));

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
  // Decor elements (approximate sizes from PNGs)
  sun: { width: 120, height: 120 },
  bird: { width: 60, height: 40 },
  tree: { width: 80, height: 100 },
  bush: { width: 70, height: 50 },
  rocks: { width: 100, height: 50 },
  grass: { width: 50, height: 40 },
  signpost: { width: 60, height: 70 },
} as const;

/** Noir asset dimensions at 2x scale */
export const NOIR_ASSET_DIMENSIONS = {
  background: { width: 960, height: 480 },
  cloudLarge: { width: 280, height: 140 },
  cloudMedium: { width: 200, height: 100 },
  cloudSmall: { width: 140, height: 70 },
  terrainGround: { width: 960, height: 120 },
  cliffEdge: { width: 240, height: 400 },
  voidLayer: { width: 1920, height: 200 },
  voidGradient: { width: 960, height: 200 },
  flag: { width: 80, height: 120 },
  swoosh: { width: 300, height: 60 },
  particleDust1: { width: 16, height: 16 },
  particleDust2: { width: 12, height: 12 },
  particleDust3: { width: 8, height: 8 },
} as const;

/** Canvas scale factor (assets are 2x) */
export const ASSET_SCALE = 0.50; // +10% zoom-in on background layers
