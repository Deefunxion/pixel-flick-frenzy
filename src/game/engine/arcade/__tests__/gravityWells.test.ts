// src/game/engine/arcade/__tests__/gravityWells.test.ts
import { describe, it, expect } from 'vitest';
import {
  createGravityWellFromPlacement,
  createGravityWellsFromLevel,
  isInGravityWell,
  getGravityWellForce,
  applyGravityWellForces,
  getClosestGravityWell,
} from '../gravityWells';
import type { GravityWellPlacement } from '../types';

describe('Gravity Wells', () => {
  describe('createGravityWellFromPlacement', () => {
    it('creates attract gravity well', () => {
      const placement: GravityWellPlacement = {
        x: 200,
        y: 100,
        type: 'attract',
        radius: 50,
        strength: 0.3,
      };

      const well = createGravityWellFromPlacement(placement);

      expect(well.x).toBe(200);
      expect(well.y).toBe(100);
      expect(well.type).toBe('attract');
      expect(well.radius).toBe(50);
      expect(well.strength).toBe(0.3);
      expect(well.scale).toBe(1);
    });

    it('creates repel gravity well', () => {
      const placement: GravityWellPlacement = {
        x: 300,
        y: 150,
        type: 'repel',
        radius: 40,
        strength: 0.5,
      };

      const well = createGravityWellFromPlacement(placement);

      expect(well.type).toBe('repel');
    });

    it('applies scale to radius', () => {
      const placement: GravityWellPlacement = {
        x: 200,
        y: 100,
        type: 'attract',
        radius: 50,
        strength: 0.3,
        scale: 1.5,
      };

      const well = createGravityWellFromPlacement(placement);

      expect(well.radius).toBe(75);
      expect(well.scale).toBe(1.5);
    });
  });

  describe('createGravityWellsFromLevel', () => {
    it('creates multiple wells from placements', () => {
      const placements: GravityWellPlacement[] = [
        { x: 100, y: 100, type: 'attract', radius: 50, strength: 0.3 },
        { x: 300, y: 100, type: 'repel', radius: 40, strength: 0.4 },
      ];

      const wells = createGravityWellsFromLevel(placements);

      expect(wells.length).toBe(2);
      expect(wells[0].type).toBe('attract');
      expect(wells[1].type).toBe('repel');
    });
  });

  describe('isInGravityWell', () => {
    it('returns true when player is inside radius', () => {
      const well = createGravityWellFromPlacement({
        x: 200, y: 100, type: 'attract', radius: 50, strength: 0.3,
      });

      expect(isInGravityWell(200, 100, well)).toBe(true);
      expect(isInGravityWell(220, 100, well)).toBe(true);
      expect(isInGravityWell(200, 140, well)).toBe(true);
    });

    it('returns false when player is outside radius', () => {
      const well = createGravityWellFromPlacement({
        x: 200, y: 100, type: 'attract', radius: 50, strength: 0.3,
      });

      expect(isInGravityWell(260, 100, well)).toBe(false);
      expect(isInGravityWell(200, 160, well)).toBe(false);
      expect(isInGravityWell(100, 100, well)).toBe(false);
    });
  });

  describe('getGravityWellForce', () => {
    it('returns zero force when outside radius', () => {
      const well = createGravityWellFromPlacement({
        x: 200, y: 100, type: 'attract', radius: 50, strength: 0.3,
      });

      const force = getGravityWellForce(300, 100, well);

      expect(force.fx).toBe(0);
      expect(force.fy).toBe(0);
    });

    it('attract well pulls toward center', () => {
      const well = createGravityWellFromPlacement({
        x: 200, y: 100, type: 'attract', radius: 50, strength: 0.5,
      });

      // Player to the left of well center
      const force = getGravityWellForce(170, 100, well);

      // Force should be positive X (pulling right toward center)
      expect(force.fx).toBeGreaterThan(0);
      expect(force.fy).toBe(0);
    });

    it('repel well pushes away from center', () => {
      const well = createGravityWellFromPlacement({
        x: 200, y: 100, type: 'repel', radius: 50, strength: 0.5,
      });

      // Player to the left of well center
      const force = getGravityWellForce(170, 100, well);

      // Force should be negative X (pushing left away from center)
      expect(force.fx).toBeLessThan(0);
      // Use toBeCloseTo for float comparison (handles -0 vs 0)
      expect(force.fy).toBeCloseTo(0);
    });

    it('force is stronger closer to center', () => {
      const well = createGravityWellFromPlacement({
        x: 200, y: 100, type: 'attract', radius: 50, strength: 0.5,
      });

      // Player close to center
      const forceClose = getGravityWellForce(190, 100, well);
      // Player far from center
      const forceFar = getGravityWellForce(160, 100, well);

      expect(Math.abs(forceClose.fx)).toBeGreaterThan(Math.abs(forceFar.fx));
    });

    it('applies force in diagonal direction', () => {
      const well = createGravityWellFromPlacement({
        x: 200, y: 100, type: 'attract', radius: 50, strength: 0.5,
      });

      // Player below-left of center
      const force = getGravityWellForce(180, 120, well);

      // Force should pull toward center (positive X, negative Y)
      expect(force.fx).toBeGreaterThan(0);
      expect(force.fy).toBeLessThan(0);
    });
  });

  describe('applyGravityWellForces', () => {
    it('modifies velocity when inside well', () => {
      const wells = [
        createGravityWellFromPlacement({
          x: 200, y: 100, type: 'attract', radius: 50, strength: 0.3,
        }),
      ];
      const velocity = { vx: 5, vy: 0 };

      const result = applyGravityWellForces(180, 100, velocity, wells);

      expect(result).toBe(true);
      expect(velocity.vx).toBeGreaterThan(5);  // Pulled toward center
    });

    it('does not modify velocity when outside well', () => {
      const wells = [
        createGravityWellFromPlacement({
          x: 200, y: 100, type: 'attract', radius: 50, strength: 0.3,
        }),
      ];
      const velocity = { vx: 5, vy: 0 };

      const result = applyGravityWellForces(100, 100, velocity, wells);

      expect(result).toBe(false);
      expect(velocity.vx).toBe(5);
      expect(velocity.vy).toBe(0);
    });

    it('applies cumulative force from multiple wells', () => {
      const wells = [
        createGravityWellFromPlacement({
          x: 200, y: 100, type: 'attract', radius: 100, strength: 0.2,
        }),
        createGravityWellFromPlacement({
          x: 300, y: 100, type: 'attract', radius: 100, strength: 0.2,
        }),
      ];
      const velocity = { vx: 0, vy: 0 };

      // Player between both wells (250, 100)
      applyGravityWellForces(250, 100, velocity, wells);

      // Forces from both wells should partially cancel (one pulls left, one pulls right)
      // but not perfectly since distances differ slightly
      expect(Math.abs(velocity.vx)).toBeLessThan(0.3);
    });

    it('handles repel wells correctly', () => {
      const wells = [
        createGravityWellFromPlacement({
          x: 200, y: 100, type: 'repel', radius: 50, strength: 0.3,
        }),
      ];
      const velocity = { vx: 5, vy: 0 };

      applyGravityWellForces(180, 100, velocity, wells);

      // Pushed away from center (negative X direction)
      expect(velocity.vx).toBeLessThan(5);
    });
  });

  describe('getClosestGravityWell', () => {
    it('returns null when no wells present', () => {
      const result = getClosestGravityWell(200, 100, []);
      expect(result).toBeNull();
    });

    it('returns null when player not in any well', () => {
      const wells = [
        createGravityWellFromPlacement({
          x: 200, y: 100, type: 'attract', radius: 50, strength: 0.3,
        }),
      ];

      const result = getClosestGravityWell(100, 100, wells);
      expect(result).toBeNull();
    });

    it('returns well and distance when inside', () => {
      const wells = [
        createGravityWellFromPlacement({
          x: 200, y: 100, type: 'attract', radius: 50, strength: 0.3,
        }),
      ];

      const result = getClosestGravityWell(220, 100, wells);

      expect(result).not.toBeNull();
      expect(result?.well.x).toBe(200);
      expect(result?.distance).toBe(20);
    });

    it('returns closest well when inside multiple', () => {
      const wells = [
        createGravityWellFromPlacement({
          x: 100, y: 100, type: 'attract', radius: 100, strength: 0.3,
        }),
        createGravityWellFromPlacement({
          x: 200, y: 100, type: 'repel', radius: 100, strength: 0.3,
        }),
      ];

      // Player at 180, 100 - closer to second well (200)
      const result = getClosestGravityWell(180, 100, wells);

      expect(result).not.toBeNull();
      expect(result?.well.x).toBe(200);
      expect(result?.distance).toBe(20);
    });
  });
});
