// src/game/engine/arcade/__tests__/frictionZones.test.ts
import { describe, it, expect } from 'vitest';
import {
  createFrictionZoneFromPlacement,
  createFrictionZonesFromLevel,
  isInFrictionZone,
  getFrictionMultiplier,
  getCurrentFrictionZone,
  applyFrictionModifier,
  hasFrictionZones,
} from '../frictionZones';
import type { FrictionZonePlacement } from '../types';

describe('Friction Zones', () => {
  describe('createFrictionZoneFromPlacement', () => {
    it('creates ice zone with default friction', () => {
      const placement: FrictionZonePlacement = {
        x: 200,
        y: 220,
        width: 80,
        type: 'ice',
      };

      const zone = createFrictionZoneFromPlacement(placement);

      expect(zone.x).toBe(200);
      expect(zone.y).toBe(220);
      expect(zone.width).toBe(80);
      expect(zone.type).toBe('ice');
      expect(zone.frictionMultiplier).toBe(0.2);  // Default ice friction
    });

    it('creates sticky zone with default friction', () => {
      const placement: FrictionZonePlacement = {
        x: 300,
        y: 220,
        width: 60,
        type: 'sticky',
      };

      const zone = createFrictionZoneFromPlacement(placement);

      expect(zone.type).toBe('sticky');
      expect(zone.frictionMultiplier).toBe(3.0);  // Default sticky friction
    });

    it('uses custom strength when specified', () => {
      const placement: FrictionZonePlacement = {
        x: 200,
        y: 220,
        width: 80,
        type: 'ice',
        strength: 0.5,
      };

      const zone = createFrictionZoneFromPlacement(placement);

      expect(zone.frictionMultiplier).toBe(0.5);
    });
  });

  describe('createFrictionZonesFromLevel', () => {
    it('creates multiple zones from placements', () => {
      const placements: FrictionZonePlacement[] = [
        { x: 100, y: 220, width: 50, type: 'ice' },
        { x: 200, y: 220, width: 50, type: 'sticky' },
        { x: 300, y: 220, width: 50, type: 'ice' },
      ];

      const zones = createFrictionZonesFromLevel(placements);

      expect(zones).toHaveLength(3);
      expect(zones[0].type).toBe('ice');
      expect(zones[1].type).toBe('sticky');
      expect(zones[2].type).toBe('ice');
    });
  });

  describe('isInFrictionZone', () => {
    it('returns true when player is inside zone', () => {
      const zone = createFrictionZoneFromPlacement({
        x: 200, y: 220, width: 80, type: 'ice',
      });

      // Center of zone
      expect(isInFrictionZone(200, 220, zone)).toBe(true);

      // Near left edge
      expect(isInFrictionZone(165, 220, zone)).toBe(true);

      // Near right edge
      expect(isInFrictionZone(235, 220, zone)).toBe(true);
    });

    it('returns false when player is outside zone', () => {
      const zone = createFrictionZoneFromPlacement({
        x: 200, y: 220, width: 80, type: 'ice',
      });

      // To the left
      expect(isInFrictionZone(150, 220, zone)).toBe(false);

      // To the right
      expect(isInFrictionZone(250, 220, zone)).toBe(false);

      // Above (different Y)
      expect(isInFrictionZone(200, 200, zone)).toBe(false);
    });
  });

  describe('getFrictionMultiplier', () => {
    it('returns 1.0 when not in any zone', () => {
      const zones = createFrictionZonesFromLevel([
        { x: 200, y: 220, width: 80, type: 'ice' },
      ]);

      const multiplier = getFrictionMultiplier(100, 220, zones);

      expect(multiplier).toBe(1.0);
    });

    it('returns ice multiplier when in ice zone', () => {
      const zones = createFrictionZonesFromLevel([
        { x: 200, y: 220, width: 80, type: 'ice' },
      ]);

      const multiplier = getFrictionMultiplier(200, 220, zones);

      expect(multiplier).toBe(0.2);
    });

    it('returns sticky multiplier when in sticky zone', () => {
      const zones = createFrictionZonesFromLevel([
        { x: 200, y: 220, width: 80, type: 'sticky' },
      ]);

      const multiplier = getFrictionMultiplier(200, 220, zones);

      expect(multiplier).toBe(3.0);
    });

    it('returns 1.0 for empty zones array', () => {
      const multiplier = getFrictionMultiplier(200, 220, []);

      expect(multiplier).toBe(1.0);
    });
  });

  describe('getCurrentFrictionZone', () => {
    it('returns null when not in any zone', () => {
      const zones = createFrictionZonesFromLevel([
        { x: 200, y: 220, width: 80, type: 'ice' },
      ]);

      const zone = getCurrentFrictionZone(100, 220, zones);

      expect(zone).toBeNull();
    });

    it('returns the zone player is in', () => {
      const zones = createFrictionZonesFromLevel([
        { x: 100, y: 220, width: 50, type: 'ice' },
        { x: 200, y: 220, width: 50, type: 'sticky' },
      ]);

      const zone = getCurrentFrictionZone(200, 220, zones);

      expect(zone).not.toBeNull();
      expect(zone?.type).toBe('sticky');
    });
  });

  describe('applyFrictionModifier', () => {
    it('returns base friction when not in zone', () => {
      const zones = createFrictionZonesFromLevel([
        { x: 200, y: 220, width: 80, type: 'ice' },
      ]);
      const baseFriction = 0.96;

      const result = applyFrictionModifier(baseFriction, 100, 220, zones);

      expect(result).toBe(0.96);
    });

    it('reduces friction for ice zone (more slippery)', () => {
      const zones = createFrictionZonesFromLevel([
        { x: 200, y: 220, width: 80, type: 'ice' },
      ]);
      const baseFriction = 0.96;  // 4% velocity lost per frame

      const result = applyFrictionModifier(baseFriction, 200, 220, zones);

      // Ice multiplier 0.2 means grip is 0.04 * 0.2 = 0.008
      // So friction should be 1 - 0.008 = 0.992
      expect(result).toBeCloseTo(0.992);
      expect(result).toBeGreaterThan(baseFriction);  // Higher friction = more slippery
    });

    it('increases friction for sticky zone (more grip)', () => {
      const zones = createFrictionZonesFromLevel([
        { x: 200, y: 220, width: 80, type: 'sticky' },
      ]);
      const baseFriction = 0.96;  // 4% velocity lost per frame

      const result = applyFrictionModifier(baseFriction, 200, 220, zones);

      // Sticky multiplier 3.0 means grip is 0.04 * 3.0 = 0.12
      // So friction should be 1 - 0.12 = 0.88
      expect(result).toBeCloseTo(0.88);
      expect(result).toBeLessThan(baseFriction);  // Lower friction = more grip
    });

    it('clamps friction to valid range', () => {
      const zones = createFrictionZonesFromLevel([
        { x: 200, y: 220, width: 80, type: 'sticky', strength: 100 },  // Extreme value
      ]);
      const baseFriction = 0.96;

      const result = applyFrictionModifier(baseFriction, 200, 220, zones);

      // Should be clamped to minimum 0.5
      expect(result).toBeGreaterThanOrEqual(0.5);
      expect(result).toBeLessThanOrEqual(0.999);
    });
  });

  describe('hasFrictionZones', () => {
    it('returns false for empty array', () => {
      expect(hasFrictionZones([])).toBe(false);
    });

    it('returns true when zones exist', () => {
      const zones = createFrictionZonesFromLevel([
        { x: 200, y: 220, width: 80, type: 'ice' },
      ]);

      expect(hasFrictionZones(zones)).toBe(true);
    });
  });
});
