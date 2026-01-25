// src/game/engine/arcade/__tests__/hazards.test.ts
import { describe, it, expect } from 'vitest';
import {
  createHazardFromPlacement,
  createHazardsFromLevel,
  updateHazards,
  checkHazardCollision,
  checkSingleHazardCollision,
  resetHazards,
} from '../hazards';
import type { HazardPlacement } from '../types';

describe('Hazards', () => {
  describe('createHazardFromPlacement', () => {
    it('creates static hazard with default values', () => {
      const placement: HazardPlacement = {
        x: 100,
        y: 150,
        radius: 15,
        sprite: 'spike',
      };

      const hazard = createHazardFromPlacement(placement);

      expect(hazard.baseX).toBe(100);
      expect(hazard.baseY).toBe(150);
      expect(hazard.currentX).toBe(100);
      expect(hazard.currentY).toBe(150);
      expect(hazard.radius).toBe(15);
      expect(hazard.sprite).toBe('spike');
      expect(hazard.motion.type).toBe('static');
      expect(hazard.phase).toBe(0);
      expect(hazard.scale).toBe(1);
    });

    it('creates hazard with linear motion', () => {
      const placement: HazardPlacement = {
        x: 100,
        y: 150,
        radius: 15,
        sprite: 'saw',
        motion: { type: 'linear', axis: 'x', range: 50, speed: 30 },
      };

      const hazard = createHazardFromPlacement(placement);

      expect(hazard.motion.type).toBe('linear');
      if (hazard.motion.type === 'linear') {
        expect(hazard.motion.axis).toBe('x');
        expect(hazard.motion.range).toBe(50);
        expect(hazard.motion.speed).toBe(30);
      }
    });

    it('creates hazard with circular motion', () => {
      const placement: HazardPlacement = {
        x: 200,
        y: 100,
        radius: 20,
        sprite: 'fire',
        motion: { type: 'circular', radius: 30, speed: 60 },
      };

      const hazard = createHazardFromPlacement(placement);

      expect(hazard.motion.type).toBe('circular');
      if (hazard.motion.type === 'circular') {
        expect(hazard.motion.radius).toBe(30);
        expect(hazard.motion.speed).toBe(60);
      }
    });

    it('applies scale to radius', () => {
      const placement: HazardPlacement = {
        x: 100,
        y: 100,
        radius: 10,
        sprite: 'spike',
        scale: 2.0,
      };

      const hazard = createHazardFromPlacement(placement);

      expect(hazard.radius).toBe(20);
      expect(hazard.scale).toBe(2.0);
    });
  });

  describe('createHazardsFromLevel', () => {
    it('creates multiple hazards from placements', () => {
      const placements: HazardPlacement[] = [
        { x: 100, y: 100, radius: 15, sprite: 'spike' },
        { x: 200, y: 100, radius: 15, sprite: 'saw' },
        { x: 300, y: 100, radius: 15, sprite: 'fire' },
      ];

      const hazards = createHazardsFromLevel(placements);

      expect(hazards.length).toBe(3);
      expect(hazards[0].sprite).toBe('spike');
      expect(hazards[1].sprite).toBe('saw');
      expect(hazards[2].sprite).toBe('fire');
    });
  });

  describe('updateHazards', () => {
    it('does not move static hazards', () => {
      const hazards = [
        createHazardFromPlacement({ x: 100, y: 100, radius: 15, sprite: 'spike' }),
      ];

      updateHazards(hazards, 1000);

      expect(hazards[0].currentX).toBe(100);
      expect(hazards[0].currentY).toBe(100);
    });

    it('moves linear hazards along axis', () => {
      const hazards = [
        createHazardFromPlacement({
          x: 100, y: 100, radius: 15, sprite: 'saw',
          motion: { type: 'linear', axis: 'x', range: 50, speed: 60 },
        }),
      ];

      // At quarter cycle, should be at maximum offset
      hazards[0].phase = 0.25;
      updateHazards(hazards, 0);  // Just update position without advancing phase

      // Recalculate: sin(0.25 * 2 * PI) = sin(PI/2) = 1
      const expectedX = 100 + Math.sin(0.25 * Math.PI * 2) * 50;
      expect(hazards[0].currentX).toBeCloseTo(expectedX);
      expect(hazards[0].currentY).toBe(100);
    });

    it('moves circular hazards in orbit', () => {
      const hazards = [
        createHazardFromPlacement({
          x: 100, y: 100, radius: 15, sprite: 'fire',
          motion: { type: 'circular', radius: 30, speed: 60 },
        }),
      ];

      // At quarter cycle, should be at 90 degrees (right side)
      hazards[0].phase = 0.25;
      updateHazards(hazards, 0);

      const angle = 0.25 * Math.PI * 2;
      const expectedX = 100 + Math.cos(angle) * 30;
      const expectedY = 100 + Math.sin(angle) * 30;
      expect(hazards[0].currentX).toBeCloseTo(expectedX);
      expect(hazards[0].currentY).toBeCloseTo(expectedY);
    });

    it('advances phase based on time and speed', () => {
      const hazards = [
        createHazardFromPlacement({
          x: 100, y: 100, radius: 15, sprite: 'saw',
          motion: { type: 'linear', axis: 'x', range: 50, speed: 60 },
        }),
      ];

      // Initial phase is 0
      expect(hazards[0].phase).toBe(0);

      // After 1 second at speed 60, phase should advance
      // deltaPhase = (1000 / 1000) * (60 / 60) = 1
      // phase = (0 + 1) % 1 = 0 (wraps around)
      // So we test with a smaller delta that won't cause wrap
      updateHazards(hazards, 100);  // 100ms

      // deltaPhase = (100 / 1000) * (60 / 60) = 0.1
      expect(hazards[0].phase).toBeCloseTo(0.1);
    });

    it('wraps phase at 1.0', () => {
      const hazards = [
        createHazardFromPlacement({
          x: 100, y: 100, radius: 15, sprite: 'saw',
          motion: { type: 'linear', axis: 'x', range: 50, speed: 60 },
        }),
      ];

      hazards[0].phase = 0.95;
      updateHazards(hazards, 500);  // Advance past 1.0

      expect(hazards[0].phase).toBeLessThan(1);
      expect(hazards[0].phase).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checkHazardCollision', () => {
    it('returns hazard when player is inside radius', () => {
      const hazards = [
        createHazardFromPlacement({ x: 100, y: 100, radius: 20, sprite: 'spike' }),
      ];

      const result = checkHazardCollision(105, 105, hazards);

      expect(result).not.toBeNull();
      expect(result?.sprite).toBe('spike');
    });

    it('returns null when player is outside radius', () => {
      const hazards = [
        createHazardFromPlacement({ x: 100, y: 100, radius: 20, sprite: 'spike' }),
      ];

      const result = checkHazardCollision(150, 100, hazards);

      expect(result).toBeNull();
    });

    it('checks against current position for moving hazards', () => {
      const hazards = [
        createHazardFromPlacement({
          x: 100, y: 100, radius: 15, sprite: 'saw',
          motion: { type: 'linear', axis: 'x', range: 50, speed: 60 },
        }),
      ];

      // Move hazard to x=150
      hazards[0].currentX = 150;

      // Player at base position (100, 100) - no collision
      expect(checkHazardCollision(100, 100, hazards)).toBeNull();

      // Player at current position (150, 100) - collision
      expect(checkHazardCollision(150, 100, hazards)).not.toBeNull();
    });

    it('returns first colliding hazard when multiple hazards present', () => {
      const hazards = [
        createHazardFromPlacement({ x: 100, y: 100, radius: 20, sprite: 'spike' }),
        createHazardFromPlacement({ x: 200, y: 100, radius: 20, sprite: 'saw' }),
      ];

      // Player at first hazard
      const result1 = checkHazardCollision(100, 100, hazards);
      expect(result1?.sprite).toBe('spike');

      // Player at second hazard
      const result2 = checkHazardCollision(200, 100, hazards);
      expect(result2?.sprite).toBe('saw');
    });
  });

  describe('checkSingleHazardCollision', () => {
    it('returns true when player collides', () => {
      const hazard = createHazardFromPlacement({ x: 100, y: 100, radius: 20, sprite: 'spike' });

      expect(checkSingleHazardCollision(100, 100, hazard)).toBe(true);
      expect(checkSingleHazardCollision(115, 100, hazard)).toBe(true);
    });

    it('returns false when player does not collide', () => {
      const hazard = createHazardFromPlacement({ x: 100, y: 100, radius: 20, sprite: 'spike' });

      expect(checkSingleHazardCollision(130, 100, hazard)).toBe(false);
    });
  });

  describe('resetHazards', () => {
    it('resets phase and position to base values', () => {
      const hazards = [
        createHazardFromPlacement({
          x: 100, y: 100, radius: 15, sprite: 'saw',
          motion: { type: 'linear', axis: 'x', range: 50, speed: 60 },
        }),
      ];

      // Advance hazard
      hazards[0].phase = 0.5;
      hazards[0].currentX = 150;
      hazards[0].currentY = 120;

      resetHazards(hazards);

      expect(hazards[0].phase).toBe(0);
      expect(hazards[0].currentX).toBe(100);
      expect(hazards[0].currentY).toBe(100);
    });
  });
});
