// src/game/engine/arcade/generator/archetypes.ts
import type { Archetype, ArchetypeTransform } from './types';

export const ARCHETYPE_TRANSFORMS: Record<Archetype, ArchetypeTransform> = {
  runner: {
    xMin: 50, xMax: 400,
    yMin: 90, yMax: 150,
    invertY: false,
    alternateBands: false,
    pushToEdges: false,
    bifurcateX: false,
  },
  diver: {
    xMin: 80, xMax: 350,
    yMin: 40, yMax: 190,
    invertY: false,
    alternateBands: false,
    pushToEdges: false,
    bifurcateX: false,
  },
  climber: {
    xMin: 120, xMax: 280,
    yMin: 30, yMax: 190,
    invertY: true,
    alternateBands: false,
    pushToEdges: false,
    bifurcateX: false,
  },
  zigzag: {
    xMin: 50, xMax: 400,
    yMin: 40, yMax: 190,
    invertY: false,
    alternateBands: true,
    bandA: { min: 40, max: 100 },
    bandB: { min: 130, max: 190 },
    pushToEdges: false,
    bifurcateX: false,
  },
  perimeter: {
    xMin: 50, xMax: 400,
    yMin: 30, yMax: 190,
    invertY: false,
    alternateBands: false,
    pushToEdges: true,
    bifurcateX: false,
  },
  split: {
    xMin: 50, xMax: 400,
    yMin: 40, yMax: 180,
    invertY: false,
    alternateBands: false,
    pushToEdges: false,
    bifurcateX: true,
    leftCluster: { min: 60, max: 150 },
    rightCluster: { min: 280, max: 380 },
  },
  general: {
    xMin: 50, xMax: 400,
    yMin: 40, yMax: 180,
    invertY: false,
    alternateBands: false,
    pushToEdges: false,
    bifurcateX: false,
  },
};

// World archetype configuration
// [dominant archetype, dominance %, fallback archetypes]
interface WorldArchetypeConfig {
  dominant: Archetype;
  dominance: number; // 0-1, percentage that returns dominant
  fallbacks: Archetype[];
}

const WORLD_ARCHETYPE_CONFIG: Record<number, WorldArchetypeConfig> = {
  1: { dominant: 'runner', dominance: 1.0, fallbacks: [] },
  2: { dominant: 'runner', dominance: 0.9, fallbacks: ['diver'] },
  3: { dominant: 'diver', dominance: 0.8, fallbacks: ['runner'] },
  4: { dominant: 'climber', dominance: 0.7, fallbacks: ['runner', 'diver'] },
  5: { dominant: 'runner', dominance: 0.7, fallbacks: ['climber', 'diver'] },
  6: { dominant: 'zigzag', dominance: 0.7, fallbacks: ['runner', 'diver'] },
  7: { dominant: 'climber', dominance: 0.6, fallbacks: ['zigzag', 'runner'] },
  8: { dominant: 'general', dominance: 0.5, fallbacks: ['runner', 'diver', 'climber', 'zigzag'] },
  9: { dominant: 'general', dominance: 0.5, fallbacks: ['runner', 'diver', 'climber', 'zigzag'] },
  10: { dominant: 'general', dominance: 0.5, fallbacks: ['runner', 'diver', 'climber', 'zigzag'] },
  11: { dominant: 'general', dominance: 0.5, fallbacks: ['runner', 'diver', 'climber', 'zigzag'] },
  12: { dominant: 'perimeter', dominance: 0.4, fallbacks: ['runner', 'diver', 'climber', 'zigzag'] },
  13: { dominant: 'split', dominance: 0.4, fallbacks: ['runner', 'diver', 'climber', 'zigzag', 'perimeter'] },
  14: { dominant: 'general', dominance: 0.4, fallbacks: ['runner', 'diver', 'climber', 'zigzag', 'perimeter', 'split'] },
  // Remix worlds 15-25: all archetypes available
  15: { dominant: 'runner', dominance: 0.6, fallbacks: ['diver', 'climber', 'zigzag', 'perimeter', 'split'] },
  16: { dominant: 'climber', dominance: 0.6, fallbacks: ['zigzag', 'runner', 'diver', 'perimeter', 'split'] },
  17: { dominant: 'perimeter', dominance: 0.6, fallbacks: ['split', 'runner', 'diver', 'climber', 'zigzag'] },
  18: { dominant: 'general', dominance: 0.3, fallbacks: ['runner', 'diver', 'climber', 'zigzag', 'perimeter', 'split'] },
  19: { dominant: 'general', dominance: 0.3, fallbacks: ['runner', 'diver', 'climber', 'zigzag', 'perimeter', 'split'] },
  20: { dominant: 'general', dominance: 0.3, fallbacks: ['runner', 'diver', 'climber', 'zigzag', 'perimeter', 'split'] },
  21: { dominant: 'general', dominance: 0.3, fallbacks: ['runner', 'diver', 'climber', 'zigzag', 'perimeter', 'split'] },
  22: { dominant: 'general', dominance: 0.3, fallbacks: ['runner', 'diver', 'climber', 'zigzag', 'perimeter', 'split'] },
  23: { dominant: 'general', dominance: 0.3, fallbacks: ['runner', 'diver', 'climber', 'zigzag', 'perimeter', 'split'] },
  24: { dominant: 'general', dominance: 0.3, fallbacks: ['runner', 'diver', 'climber', 'zigzag', 'perimeter', 'split'] },
  25: { dominant: 'general', dominance: 0.3, fallbacks: ['runner', 'diver', 'climber', 'zigzag', 'perimeter', 'split'] },
};

/**
 * Get world number from level (1-indexed)
 */
function getWorldFromLevel(level: number): number {
  return Math.ceil(level / 10);
}

/**
 * Get archetype for a world with given random roll (0-1)
 */
export function getArchetypeForWorld(world: number, roll: number): Archetype {
  const config = WORLD_ARCHETYPE_CONFIG[world] || WORLD_ARCHETYPE_CONFIG[25];

  if (roll < config.dominance) {
    return config.dominant;
  }

  if (config.fallbacks.length === 0) {
    return config.dominant;
  }

  // Distribute remaining probability among fallbacks
  const fallbackRoll = (roll - config.dominance) / (1 - config.dominance);
  const fallbackIndex = Math.floor(fallbackRoll * config.fallbacks.length);
  return config.fallbacks[Math.min(fallbackIndex, config.fallbacks.length - 1)];
}

/**
 * Select archetype for a specific level
 */
export function selectArchetypeForLevel(level: number, roll: number): Archetype {
  const world = getWorldFromLevel(level);
  return getArchetypeForWorld(world, roll);
}

/**
 * Check if archetype requires mandatory props
 */
export function archetypeRequiresProps(archetype: Archetype): { springs: boolean; portals: boolean } {
  switch (archetype) {
    case 'climber':
    case 'zigzag':
      return { springs: true, portals: false };
    case 'perimeter':
    case 'split':
      return { springs: false, portals: true };
    default:
      return { springs: false, portals: false };
  }
}

/**
 * Get unused prop handling strategy for archetype
 * 'remove' = clean levels, 'reposition' = make prop necessary
 */
export function getUnusedPropStrategy(archetype: Archetype): 'remove' | 'reposition' {
  switch (archetype) {
    case 'runner':
    case 'diver':
      return 'remove';
    default:
      return 'reposition';
  }
}
