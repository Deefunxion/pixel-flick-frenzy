// src/game/engine/arcade/progression/types.ts

export interface World {
  id: number;           // 1-25
  name: string;         // "World 1", "World 2", etc.
  galaxyId: number;     // 1-5
  startLevel: number;   // First level in world (1, 11, 21...)
  endLevel: number;     // Last level in world (10, 20, 30...)
  requiredStars: number; // Stars needed to unlock (0 for World 1)
}

export interface Galaxy {
  id: number;           // 1-5
  name: string;         // "Grasslands", "Desert", etc.
  worlds: number[];     // World IDs in this galaxy [1,2,3,4,5]
  startLevel: number;   // First level in galaxy
  endLevel: number;     // Last level in galaxy
  colorPalette: GalaxyColorPalette;
  parallaxAssets: GalaxyParallaxAssets;
}

export interface GalaxyColorPalette {
  sky: string;          // Background gradient top
  horizon: string;      // Background gradient bottom
  ground: string;       // Ground color
  accent: string;       // UI accent color
  paper: string;        // Paper/HUD background
}

export interface GalaxyParallaxAssets {
  far: string;          // Furthest layer (mountains/clouds)
  mid: string;          // Middle layer (hills/trees)
  near: string;         // Nearest layer (grass/rocks)
}

export interface ProgressionState {
  unlockedWorlds: number[];      // World IDs player can access
  currentWorld: number;          // Currently selected world
  totalStarsEarned: number;      // Cached total for quick lookups
}
