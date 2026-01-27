// src/game/engine/arcade/__tests__/windZones.test.ts
import { describe, it, expect } from 'vitest';
import {
  createWindZoneFromPlacement,
  createWindZonesFromLevel,
  isInWindZone,
  getWindForce,
  applyWindForces,
  getActiveWindZones,
} from '../windZones';
import type { WindZonePlacement } from '../types';

describe('WindZones', () => {
  describe('createWindZoneFromPlacement', () => {
    it('creates wind zone with computed radiusSquared', () => {
      const placement: WindZonePlacement = {
        x: 200,
        y: 100,
        radius: 40,
        angle: 0, // right
        strength: 0.3,
      };

      const zone = createWindZoneFromPlacement(placement);

      expect(zone.x).toBe(200);
      expect(zone.y).toBe(100);
      expect(zone.radius).toBe(40);
      expect(zone.angle).toBe(0);
      expect(zone.strength).toBe(0.3);
      expect(zone.scale).toBe(1.0);
      expect(zone.radiusSquared).toBe(1600); // 40 * 40
    });

    it('uses provided scale', () => {
      const placement: WindZonePlacement = {
        x: 100,
        y: 100,
        radius: 30,
        angle: 90,
        strength: 0.2,
        scale: 1.5,
      };

      const zone = createWindZoneFromPlacement(placement);
      expect(zone.scale).toBe(1.5);
    });
  });

  describe('createWindZonesFromLevel', () => {
    it('returns empty array for undefined', () => {
      expect(createWindZonesFromLevel(undefined)).toEqual([]);
    });

    it('creates multiple zones from placements', () => {
      const placements: WindZonePlacement[] = [
        { x: 100, y: 100, radius: 30, angle: 270, strength: 0.2 }, // up
        { x: 200, y: 100, radius: 30, angle: 90, strength: 0.4 },  // down
      ];

      const zones = createWindZonesFromLevel(placements);

      expect(zones).toHaveLength(2);
      expect(zones[0].angle).toBe(270);
      expect(zones[1].angle).toBe(90);
    });
  });

  describe('isInWindZone', () => {
    const zone = createWindZoneFromPlacement({
      x: 200,
      y: 100,
      radius: 50,
      angle: 0,
      strength: 0.3,
    });

    it('returns true for point inside zone', () => {
      expect(isInWindZone(200, 100, zone)).toBe(true); // center
      expect(isInWindZone(180, 90, zone)).toBe(true);  // inside
      expect(isInWindZone(220, 110, zone)).toBe(true); // inside
    });

    it('returns false for point outside zone', () => {
      expect(isInWindZone(100, 100, zone)).toBe(false); // far left
      expect(isInWindZone(300, 100, zone)).toBe(false); // far right
      expect(isInWindZone(200, 30, zone)).toBe(false);  // above
      expect(isInWindZone(200, 170, zone)).toBe(false); // below
    });

    it('returns true for point on boundary', () => {
      expect(isInWindZone(250, 100, zone)).toBe(true); // right edge (50 away)
      expect(isInWindZone(150, 100, zone)).toBe(true); // left edge (50 away)
    });

    it('returns false for point just outside boundary', () => {
      expect(isInWindZone(251, 100, zone)).toBe(false); // just past right edge
    });
  });

  describe('getWindForce', () => {
    it('returns correct force for each angle', () => {
      const rightZone = createWindZoneFromPlacement({
        x: 0, y: 0, radius: 10, angle: 0, strength: 0.5, // right
      });
      const leftZone = createWindZoneFromPlacement({
        x: 0, y: 0, radius: 10, angle: 180, strength: 0.3, // left
      });
      const upZone = createWindZoneFromPlacement({
        x: 0, y: 0, radius: 10, angle: 270, strength: 0.4, // up
      });
      const downZone = createWindZoneFromPlacement({
        x: 0, y: 0, radius: 10, angle: 90, strength: 0.2, // down
      });

      const rightForce = getWindForce(rightZone);
      expect(rightForce.fx).toBeCloseTo(0.5);
      expect(rightForce.fy).toBeCloseTo(0);

      const leftForce = getWindForce(leftZone);
      expect(leftForce.fx).toBeCloseTo(-0.3);
      expect(leftForce.fy).toBeCloseTo(0);

      const upForce = getWindForce(upZone);
      expect(upForce.fx).toBeCloseTo(0);
      expect(upForce.fy).toBeCloseTo(-0.4);

      const downForce = getWindForce(downZone);
      expect(downForce.fx).toBeCloseTo(0);
      expect(downForce.fy).toBeCloseTo(0.2);
    });

    it('returns diagonal force for 45 degree angle', () => {
      const diagonalZone = createWindZoneFromPlacement({
        x: 0, y: 0, radius: 10, angle: 45, strength: 1.0,
      });

      const force = getWindForce(diagonalZone);
      expect(force.fx).toBeCloseTo(Math.SQRT1_2); // cos(45) = sqrt(2)/2
      expect(force.fy).toBeCloseTo(Math.SQRT1_2); // sin(45) = sqrt(2)/2
    });
  });

  describe('applyWindForces', () => {
    it('applies force when player is in zone', () => {
      const zones = createWindZonesFromLevel([
        { x: 200, y: 100, radius: 50, angle: 0, strength: 0.5 }, // right
      ]);

      const velocity = { vx: 5, vy: 2 };
      const affected = applyWindForces(200, 100, velocity, zones);

      expect(affected).toBe(true);
      expect(velocity.vx).toBeCloseTo(5.5); // 5 + 0.5
      expect(velocity.vy).toBeCloseTo(2);   // unchanged
    });

    it('does not apply force when player is outside zone', () => {
      const zones = createWindZonesFromLevel([
        { x: 200, y: 100, radius: 50, angle: 0, strength: 0.5 },
      ]);

      const velocity = { vx: 5, vy: 2 };
      const affected = applyWindForces(50, 100, velocity, zones);

      expect(affected).toBe(false);
      expect(velocity.vx).toBe(5);
      expect(velocity.vy).toBe(2);
    });

    it('applies forces from multiple overlapping zones', () => {
      const zones = createWindZonesFromLevel([
        { x: 200, y: 100, radius: 100, angle: 0, strength: 0.3 },   // right
        { x: 200, y: 100, radius: 100, angle: 270, strength: 0.2 }, // up
      ]);

      const velocity = { vx: 0, vy: 0 };
      const affected = applyWindForces(200, 100, velocity, zones);

      expect(affected).toBe(true);
      expect(velocity.vx).toBeCloseTo(0.3);
      expect(velocity.vy).toBeCloseTo(-0.2);
    });
  });

  describe('getActiveWindZones', () => {
    it('returns zones affecting player position', () => {
      const zones = createWindZonesFromLevel([
        { x: 100, y: 100, radius: 30, angle: 270, strength: 0.2 }, // up - player inside
        { x: 250, y: 100, radius: 30, angle: 90, strength: 0.4 },  // down - player outside
        { x: 100, y: 100, radius: 50, angle: 0, strength: 0.3 },   // right - player inside
      ]);

      // Player at x=100, y=100 should be in zones 0 and 2
      const active = getActiveWindZones(100, 100, zones);

      expect(active).toHaveLength(2);
      expect(active.some(z => z.angle === 270)).toBe(true);
      expect(active.some(z => z.angle === 0)).toBe(true);
    });

    it('returns empty array when player in no zones', () => {
      const zones = createWindZonesFromLevel([
        { x: 100, y: 100, radius: 30, angle: 270, strength: 0.2 },
      ]);

      const active = getActiveWindZones(300, 300, zones);
      expect(active).toHaveLength(0);
    });
  });
});
