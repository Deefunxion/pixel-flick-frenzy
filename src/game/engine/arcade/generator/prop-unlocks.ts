// src/game/engine/arcade/generator/prop-unlocks.ts

export type PropType = 'spring' | 'portal' | 'wind' | 'gravity' | 'hazard' | 'friction';

interface PropUnlock {
  prop: PropType;
  unlockWorld: number;
}

const PROP_UNLOCK_SCHEDULE: PropUnlock[] = [
  { prop: 'spring', unlockWorld: 1 },
  { prop: 'portal', unlockWorld: 3 },
  { prop: 'wind', unlockWorld: 5 },
  { prop: 'gravity', unlockWorld: 7 },
  { prop: 'hazard', unlockWorld: 9 },
  { prop: 'friction', unlockWorld: 11 },
];

/**
 * Get world number from level (1-indexed)
 */
function getWorld(level: number): number {
  return Math.ceil(level / 10);
}

/**
 * Check if a prop type is unlocked at given level
 */
export function isUnlocked(prop: PropType, level: number): boolean {
  const world = getWorld(level);
  const unlock = PROP_UNLOCK_SCHEDULE.find(u => u.prop === prop);
  return unlock ? world >= unlock.unlockWorld : false;
}

/**
 * Get all available prop types for a level
 */
export function getAvailableProps(level: number): PropType[] {
  const world = getWorld(level);
  return PROP_UNLOCK_SCHEDULE
    .filter(u => world >= u.unlockWorld)
    .map(u => u.prop);
}

/**
 * Get the prop type that was just unlocked in this world (if any)
 */
export function getNewlyUnlockedProp(level: number): PropType | null {
  const world = getWorld(level);
  const unlock = PROP_UNLOCK_SCHEDULE.find(u => u.unlockWorld === world);
  return unlock?.prop ?? null;
}

/**
 * Get unlock world for a prop type
 */
export function getUnlockWorld(prop: PropType): number {
  const unlock = PROP_UNLOCK_SCHEDULE.find(u => u.prop === prop);
  return unlock?.unlockWorld ?? 999;
}
