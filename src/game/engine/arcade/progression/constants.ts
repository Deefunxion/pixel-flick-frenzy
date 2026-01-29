// src/game/engine/arcade/progression/constants.ts

import type { World, Galaxy, GalaxyColorPalette, GalaxyParallaxAssets } from './types';

export const LEVELS_PER_WORLD = 10;
export const WORLDS_PER_GALAXY = 5;
export const TOTAL_WORLDS = 25;
export const TOTAL_GALAXIES = 5;
export const STARS_PER_LEVEL = 3;
export const UNLOCK_THRESHOLD = 0.6; // 60% of previous world's stars

// Galaxy definitions with themes
export const GALAXY_THEMES: Record<number, { name: string; palette: GalaxyColorPalette; parallax: GalaxyParallaxAssets }> = {
  1: {
    name: 'Grasslands',
    palette: {
      sky: '#87CEEB',
      horizon: '#98D8C8',
      ground: '#7CB342',
      accent: '#4CAF50',
      paper: '#F5F0E1',
    },
    // Galaxy 1 uses the original ballpoint pen style backgroundRenderer
    // These parallax values are not used (kept for type consistency)
    parallax: {
      far: '',
      mid: '',
      near: '',
    },
  },
  2: {
    name: 'Desert',
    palette: {
      sky: '#F4A460',
      horizon: '#DEB887',
      ground: '#D2691E',
      accent: '#FF8C00',
      paper: '#FFF8DC',
    },
    parallax: {
      far: 'desert-dunes.png',
      mid: 'desert-rocks.png',
      near: 'desert-sand.png',
    },
  },
  3: {
    name: 'Ocean',
    palette: {
      sky: '#4169E1',
      horizon: '#00CED1',
      ground: '#20B2AA',
      accent: '#1E90FF',
      paper: '#E0FFFF',
    },
    parallax: {
      far: 'ocean-clouds.png',
      mid: 'ocean-waves.png',
      near: 'ocean-foam.png',
    },
  },
  4: {
    name: 'Volcano',
    palette: {
      sky: '#2F1B14',
      horizon: '#8B0000',
      ground: '#4A0000',
      accent: '#FF4500',
      paper: '#3D2817',
    },
    parallax: {
      far: 'volcano-smoke.png',
      mid: 'volcano-lava.png',
      near: 'volcano-rocks.png',
    },
  },
  5: {
    name: 'Cosmos',
    palette: {
      sky: '#0D0D2B',
      horizon: '#1A1A4E',
      ground: '#2E2E5E',
      accent: '#9370DB',
      paper: '#1C1C3C',
    },
    parallax: {
      far: 'cosmos-stars.png',
      mid: 'cosmos-nebula.png',
      near: 'cosmos-asteroids.png',
    },
  },
};

// Generate all 25 worlds
export function generateWorlds(): World[] {
  const worlds: World[] = [];

  for (let worldId = 1; worldId <= TOTAL_WORLDS; worldId++) {
    const galaxyId = Math.ceil(worldId / WORLDS_PER_GALAXY);
    const startLevel = (worldId - 1) * LEVELS_PER_WORLD + 1;
    const endLevel = worldId * LEVELS_PER_WORLD;

    // World 1 requires 0 stars, others require 60% of previous world (18 of 30)
    const requiredStars = worldId === 1 ? 0 : Math.floor(LEVELS_PER_WORLD * STARS_PER_LEVEL * UNLOCK_THRESHOLD);

    worlds.push({
      id: worldId,
      name: `World ${worldId}`,
      galaxyId,
      startLevel,
      endLevel,
      requiredStars,
    });
  }

  return worlds;
}

// Generate all 5 galaxies
export function generateGalaxies(): Galaxy[] {
  const galaxies: Galaxy[] = [];

  for (let galaxyId = 1; galaxyId <= TOTAL_GALAXIES; galaxyId++) {
    const theme = GALAXY_THEMES[galaxyId];
    const firstWorld = (galaxyId - 1) * WORLDS_PER_GALAXY + 1;
    const worlds = Array.from({ length: WORLDS_PER_GALAXY }, (_, i) => firstWorld + i);

    galaxies.push({
      id: galaxyId,
      name: theme.name,
      worlds,
      startLevel: (firstWorld - 1) * LEVELS_PER_WORLD + 1,
      endLevel: (firstWorld + WORLDS_PER_GALAXY - 1) * LEVELS_PER_WORLD,
      colorPalette: theme.palette,
      parallaxAssets: theme.parallax,
    });
  }

  return galaxies;
}

export const WORLDS = generateWorlds();
export const GALAXIES = generateGalaxies();
