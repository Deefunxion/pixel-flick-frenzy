// src/game/engine/arcade/__tests__/calligraphicScale.test.ts
import {
  detectStrokeBoundaries,
  calculateDoodleScale,
  assignDoodleSprite,
  type StrokeBoundary,
} from '../calligraphicScale';
import type { DoodlePlacement, PortalPair } from '../types';

describe('calligraphicScale', () => {
  describe('detectStrokeBoundaries', () => {
    it('returns single stroke when no portals and no X-resets', () => {
      const doodles: DoodlePlacement[] = [
        { x: 100, y: 100, size: 'large', sprite: 'coin', sequence: 1 },
        { x: 200, y: 100, size: 'large', sprite: 'coin', sequence: 2 },
        { x: 300, y: 100, size: 'large', sprite: 'coin', sequence: 3 },
      ];
      const result = detectStrokeBoundaries(doodles, []);
      expect(result).toEqual([{ startIndex: 0, endIndex: 2 }]);
    });

    it('splits stroke at portal exit position', () => {
      const doodles: DoodlePlacement[] = [
        { x: 100, y: 100, size: 'large', sprite: 'coin', sequence: 1 },
        { x: 200, y: 100, size: 'large', sprite: 'coin', sequence: 2 },
        { x: 300, y: 100, size: 'large', sprite: 'coin', sequence: 3 },
        { x: 120, y: 100, size: 'large', sprite: 'coin', sequence: 4 }, // After portal
        { x: 220, y: 100, size: 'large', sprite: 'coin', sequence: 5 },
      ];
      const portals: PortalPair[] = [
        { entry: { x: 350, y: 100 }, exit: { x: 80, y: 100 } },
      ];
      const result = detectStrokeBoundaries(doodles, portals);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ startIndex: 0, endIndex: 2 });
      expect(result[1]).toEqual({ startIndex: 3, endIndex: 4 });
    });

    it('splits stroke at X-position reset (fallback)', () => {
      const doodles: DoodlePlacement[] = [
        { x: 100, y: 100, size: 'large', sprite: 'coin', sequence: 1 },
        { x: 200, y: 100, size: 'large', sprite: 'coin', sequence: 2 },
        { x: 80, y: 100, size: 'large', sprite: 'coin', sequence: 3 }, // X reset
        { x: 180, y: 100, size: 'large', sprite: 'coin', sequence: 4 },
      ];
      const result = detectStrokeBoundaries(doodles, []);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ startIndex: 0, endIndex: 1 });
      expect(result[1]).toEqual({ startIndex: 2, endIndex: 3 });
    });
  });

  describe('calculateDoodleScale', () => {
    it('returns 1.8 for single doodle stroke', () => {
      expect(calculateDoodleScale(0, 1)).toBe(1.8);
    });

    it('returns 1.8 and 1.0 for two doodle stroke', () => {
      expect(calculateDoodleScale(0, 2)).toBe(1.8);
      expect(calculateDoodleScale(1, 2)).toBe(1.0);
    });

    it('uses eased interpolation for larger strokes', () => {
      // 5 doodles: positions 0, 1, 2, 3, 4
      const scales = [0, 1, 2, 3, 4].map(i => calculateDoodleScale(i, 5));

      // First should be 1.8
      expect(scales[0]).toBe(1.8);

      // Last should be 0.7
      expect(scales[4]).toBeCloseTo(0.7, 1);

      // Middle values should decrease (eased)
      expect(scales[1]).toBeGreaterThan(scales[2]);
      expect(scales[2]).toBeGreaterThan(scales[3]);
      expect(scales[3]).toBeGreaterThan(scales[4]);
    });

    it('uses linear interpolation for large strokes (>10 doodles)', () => {
      // 15 doodles - should use linear interpolation for consistent steps
      const scales: number[] = [];
      for (let i = 0; i < 15; i++) {
        scales.push(calculateDoodleScale(i, 15));
      }

      // First should be 1.8
      expect(scales[0]).toBe(1.8);

      // Should decrease monotonically
      for (let i = 1; i < scales.length; i++) {
        expect(scales[i]).toBeLessThan(scales[i - 1]);
      }

      // Steps should be uniform (linear interpolation)
      const firstStep = scales[0] - scales[1];
      const midStep = scales[7] - scales[8];
      expect(Math.abs(firstStep - midStep)).toBeLessThan(0.01);
    });
  });

  describe('assignDoodleSprite', () => {
    it('returns star for stroke start', () => {
      expect(assignDoodleSprite(0, 5)).toBe('star');
    });

    it('returns star for stroke end', () => {
      expect(assignDoodleSprite(4, 5)).toBe('star');
    });

    it('returns coin for middle positions', () => {
      expect(assignDoodleSprite(1, 5)).toBe('coin');
      expect(assignDoodleSprite(2, 5)).toBe('coin');
      expect(assignDoodleSprite(3, 5)).toBe('coin');
    });

    it('returns star for single doodle stroke', () => {
      expect(assignDoodleSprite(0, 1)).toBe('star');
    });

    it('returns star for both positions in two doodle stroke', () => {
      expect(assignDoodleSprite(0, 2)).toBe('star');
      expect(assignDoodleSprite(1, 2)).toBe('star');
    });
  });
});
