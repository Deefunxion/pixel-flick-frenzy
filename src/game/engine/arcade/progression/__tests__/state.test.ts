// src/game/engine/arcade/progression/__tests__/state.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createProgressionState,
  getWorldForLevel,
  getGalaxyForLevel,
  getStarsInWorld,
  isWorldUnlocked,
  getNextLockedWorld,
} from '../state';
import type { ArcadeState } from '../../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

describe('Progression State', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('createProgressionState', () => {
    it('should create initial state with world 1 unlocked', () => {
      const state = createProgressionState();
      expect(state.unlockedWorlds).toContain(1);
      expect(state.currentWorld).toBe(1);
      expect(state.totalStarsEarned).toBe(0);
    });
  });

  describe('getWorldForLevel', () => {
    it('should return world 1 for levels 1-10', () => {
      expect(getWorldForLevel(1).id).toBe(1);
      expect(getWorldForLevel(10).id).toBe(1);
    });

    it('should return world 3 for levels 21-30', () => {
      expect(getWorldForLevel(21).id).toBe(3);
      expect(getWorldForLevel(30).id).toBe(3);
    });

    it('should return world 25 for level 250', () => {
      expect(getWorldForLevel(250).id).toBe(25);
    });
  });

  describe('getGalaxyForLevel', () => {
    it('should return galaxy 1 for levels 1-50', () => {
      expect(getGalaxyForLevel(1).id).toBe(1);
      expect(getGalaxyForLevel(50).id).toBe(1);
    });

    it('should return galaxy 5 for level 250', () => {
      expect(getGalaxyForLevel(250).id).toBe(5);
    });
  });

  describe('getStarsInWorld', () => {
    it('should count stars correctly for a world', () => {
      const arcadeState: Partial<ArcadeState> = {
        starsPerLevel: {
          1: { landedInZone: true, allDoodles: true, inOrder: false },
          2: { landedInZone: true, allDoodles: false, inOrder: false },
          3: { landedInZone: true, allDoodles: true, inOrder: true },
        },
      };
      expect(getStarsInWorld(1, arcadeState as ArcadeState)).toBe(6); // 2+1+3
    });

    it('should return 0 for world with no stars', () => {
      const arcadeState: Partial<ArcadeState> = { starsPerLevel: {} };
      expect(getStarsInWorld(5, arcadeState as ArcadeState)).toBe(0);
    });
  });

  describe('isWorldUnlocked', () => {
    it('should always unlock world 1', () => {
      const arcadeState: Partial<ArcadeState> = { starsPerLevel: {} };
      expect(isWorldUnlocked(1, arcadeState as ArcadeState)).toBe(true);
    });

    it('should unlock world 2 with 18+ stars in world 1', () => {
      const arcadeState: Partial<ArcadeState> = {
        starsPerLevel: Object.fromEntries(
          Array.from({ length: 10 }, (_, i) => [
            i + 1,
            { landedInZone: true, allDoodles: true, inOrder: false }, // 2 stars each = 20
          ])
        ),
      };
      expect(isWorldUnlocked(2, arcadeState as ArcadeState)).toBe(true);
    });

    it('should NOT unlock world 2 with only 15 stars in world 1', () => {
      const arcadeState: Partial<ArcadeState> = {
        starsPerLevel: Object.fromEntries(
          Array.from({ length: 5 }, (_, i) => [
            i + 1,
            { landedInZone: true, allDoodles: true, inOrder: true }, // 3 stars each = 15
          ])
        ),
      };
      expect(isWorldUnlocked(2, arcadeState as ArcadeState)).toBe(false);
    });
  });

  describe('getNextLockedWorld', () => {
    it('should return world 2 when only world 1 has no stars', () => {
      const arcadeState: Partial<ArcadeState> = { starsPerLevel: {} };
      const nextLocked = getNextLockedWorld(arcadeState as ArcadeState);
      expect(nextLocked?.id).toBe(2);
    });

    it('should return null when all worlds unlocked', () => {
      // Create state with 18+ stars in each world
      const starsPerLevel: Record<number, { landedInZone: boolean; allDoodles: boolean; inOrder: boolean }> = {};
      for (let level = 1; level <= 250; level++) {
        starsPerLevel[level] = { landedInZone: true, allDoodles: true, inOrder: false };
      }
      const arcadeState: Partial<ArcadeState> = { starsPerLevel };
      const nextLocked = getNextLockedWorld(arcadeState as ArcadeState);
      expect(nextLocked).toBeNull();
    });
  });
});
