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
    it('creates wind zone with computed bounds', () => {
      const placement: WindZonePlacement = {
        x: 200,
        y: 100,
        width: 80,
        height: 60,
        direction: 'right',
        strength: 0.3,
      };

      const zone = createWindZoneFromPlacement(placement);

      expect(zone.x).toBe(200);
      expect(zone.y).toBe(100);
      expect(zone.width).toBe(80);
      expect(zone.height).toBe(60);
      expect(zone.direction).toBe('right');
      expect(zone.strength).toBe(0.3);
      // Bounds should be centered
      expect(zone.left).toBe(160);   // 200 - 40
      expect(zone.right).toBe(240);  // 200 + 40
      expect(zone.top).toBe(70);     // 100 - 30
      expect(zone.bottom).toBe(130); // 100 + 30
    });
  });

  describe('createWindZonesFromLevel', () => {
    it('returns empty array for undefined', () => {
      expect(createWindZonesFromLevel(undefined)).toEqual([]);
    });

    it('creates multiple zones from placements', () => {
      const placements: WindZonePlacement[] = [
        { x: 100, y: 100, width: 50, height: 50, direction: 'up', strength: 0.2 },
        { x: 200, y: 100, width: 50, height: 50, direction: 'down', strength: 0.4 },
      ];

      const zones = createWindZonesFromLevel(placements);

      expect(zones).toHaveLength(2);
      expect(zones[0].direction).toBe('up');
      expect(zones[1].direction).toBe('down');
    });
  });

  describe('isInWindZone', () => {
    const zone = createWindZoneFromPlacement({
      x: 200,
      y: 100,
      width: 100,
      height: 60,
      direction: 'right',
      strength: 0.3,
    });

    it('returns true for point inside zone', () => {
      expect(isInWindZone(200, 100, zone)).toBe(true); // center
      expect(isInWindZone(160, 80, zone)).toBe(true);  // top-left
      expect(isInWindZone(240, 120, zone)).toBe(true); // bottom-right
    });

    it('returns false for point outside zone', () => {
      expect(isInWindZone(100, 100, zone)).toBe(false); // left of zone
      expect(isInWindZone(300, 100, zone)).toBe(false); // right of zone
      expect(isInWindZone(200, 50, zone)).toBe(false);  // above zone
      expect(isInWindZone(200, 150, zone)).toBe(false); // below zone
    });

    it('returns true for point on boundary', () => {
      expect(isInWindZone(150, 100, zone)).toBe(true); // left edge
      expect(isInWindZone(250, 100, zone)).toBe(true); // right edge
    });
  });

  describe('getWindForce', () => {
    it('returns correct force for each direction', () => {
      const rightZone = createWindZoneFromPlacement({
        x: 0, y: 0, width: 10, height: 10, direction: 'right', strength: 0.5,
      });
      const leftZone = createWindZoneFromPlacement({
        x: 0, y: 0, width: 10, height: 10, direction: 'left', strength: 0.3,
      });
      const upZone = createWindZoneFromPlacement({
        x: 0, y: 0, width: 10, height: 10, direction: 'up', strength: 0.4,
      });
      const downZone = createWindZoneFromPlacement({
        x: 0, y: 0, width: 10, height: 10, direction: 'down', strength: 0.2,
      });

      expect(getWindForce(rightZone)).toEqual({ fx: 0.5, fy: 0 });
      expect(getWindForce(leftZone)).toEqual({ fx: -0.3, fy: 0 });
      expect(getWindForce(upZone)).toEqual({ fx: 0, fy: -0.4 });
      expect(getWindForce(downZone)).toEqual({ fx: 0, fy: 0.2 });
    });
  });

  describe('applyWindForces', () => {
    it('applies force when player is in zone', () => {
      const zones = createWindZonesFromLevel([
        { x: 200, y: 100, width: 100, height: 60, direction: 'right', strength: 0.5 },
      ]);

      const velocity = { vx: 5, vy: 2 };
      const affected = applyWindForces(200, 100, velocity, zones);

      expect(affected).toBe(true);
      expect(velocity.vx).toBe(5.5); // 5 + 0.5
      expect(velocity.vy).toBe(2);   // unchanged
    });

    it('does not apply force when player is outside zone', () => {
      const zones = createWindZonesFromLevel([
        { x: 200, y: 100, width: 100, height: 60, direction: 'right', strength: 0.5 },
      ]);

      const velocity = { vx: 5, vy: 2 };
      const affected = applyWindForces(50, 100, velocity, zones);

      expect(affected).toBe(false);
      expect(velocity.vx).toBe(5);
      expect(velocity.vy).toBe(2);
    });

    it('applies forces from multiple overlapping zones', () => {
      const zones = createWindZonesFromLevel([
        { x: 200, y: 100, width: 200, height: 100, direction: 'right', strength: 0.3 },
        { x: 200, y: 100, width: 200, height: 100, direction: 'up', strength: 0.2 },
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
        { x: 100, y: 100, width: 50, height: 50, direction: 'up', strength: 0.2 },
        { x: 200, y: 100, width: 50, height: 50, direction: 'down', strength: 0.4 },
        { x: 150, y: 100, width: 150, height: 50, direction: 'right', strength: 0.3 },
      ]);

      // Player at x=100, y=100 should be in zones 0 and 2
      const active = getActiveWindZones(100, 100, zones);

      expect(active).toHaveLength(2);
      expect(active.some(z => z.direction === 'up')).toBe(true);
      expect(active.some(z => z.direction === 'right')).toBe(true);
    });

    it('returns empty array when player in no zones', () => {
      const zones = createWindZonesFromLevel([
        { x: 100, y: 100, width: 50, height: 50, direction: 'up', strength: 0.2 },
      ]);

      const active = getActiveWindZones(300, 300, zones);
      expect(active).toHaveLength(0);
    });
  });
});
