// src/game/engine/arcade/__tests__/movingDoodles.test.ts
import { describe, it, expect } from 'vitest';
import {
  createMovingDoodleState,
  updateMovingDoodle,
  resetMovingDoodlePhase,
} from '../movingDoodles';
import { createDoodleFromPlacement, updateDoodles, resetDoodles } from '../doodles';
import type { DoodlePlacement } from '../types';

describe('MovingDoodles', () => {
  describe('createMovingDoodleState', () => {
    it('creates static state with base position', () => {
      const state = createMovingDoodleState(100, 150);
      expect(state.baseX).toBe(100);
      expect(state.baseY).toBe(150);
      expect(state.currentX).toBe(100);
      expect(state.currentY).toBe(150);
      expect(state.phase).toBe(0);
      expect(state.motion.type).toBe('static');
    });

    it('creates linear motion state', () => {
      const state = createMovingDoodleState(100, 150, {
        type: 'linear',
        axis: 'x',
        range: 30,
        speed: 1,
      });
      expect(state.motion.type).toBe('linear');
    });

    it('creates circular motion state', () => {
      const state = createMovingDoodleState(100, 150, {
        type: 'circular',
        radius: 20,
        speed: 0.5,
      });
      expect(state.motion.type).toBe('circular');
    });
  });

  describe('updateMovingDoodle', () => {
    it('does not move static doodles', () => {
      const state = createMovingDoodleState(100, 150, { type: 'static' });
      updateMovingDoodle(state, 1000);
      expect(state.currentX).toBe(100);
      expect(state.currentY).toBe(150);
      expect(state.phase).toBe(0);
    });

    it('moves linear doodle along X axis', () => {
      const state = createMovingDoodleState(100, 150, {
        type: 'linear',
        axis: 'x',
        range: 30,
        speed: 1, // 1 cycle per second
      });

      // At 250ms (1/4 cycle), should be at peak positive offset
      updateMovingDoodle(state, 250);
      expect(state.currentX).toBeCloseTo(130, 0); // base + range
      expect(state.currentY).toBe(150); // Y unchanged

      // Reset and go to 750ms (3/4 cycle), should be at peak negative
      resetMovingDoodlePhase(state);
      updateMovingDoodle(state, 750);
      expect(state.currentX).toBeCloseTo(70, 0); // base - range
    });

    it('moves linear doodle along Y axis', () => {
      const state = createMovingDoodleState(100, 150, {
        type: 'linear',
        axis: 'y',
        range: 20,
        speed: 2, // 2 cycles per second
      });

      // At 125ms (1/4 cycle at speed 2), should be at peak positive
      updateMovingDoodle(state, 125);
      expect(state.currentX).toBe(100); // X unchanged
      expect(state.currentY).toBeCloseTo(170, 0); // base + range
    });

    it('moves circular doodle in orbit', () => {
      const state = createMovingDoodleState(100, 150, {
        type: 'circular',
        radius: 25,
        speed: 1,
      });

      // At 0ms, should be at base + radius on X (cos(0) = 1)
      expect(state.currentX).toBe(100);

      // After 250ms (1/4 cycle), should be at base + radius on Y
      updateMovingDoodle(state, 250);
      expect(state.currentX).toBeCloseTo(100, 0); // cos(90°) ≈ 0
      expect(state.currentY).toBeCloseTo(175, 0); // sin(90°) = 1 → base + radius
    });
  });

  describe('resetMovingDoodlePhase', () => {
    it('resets phase and position to base', () => {
      const state = createMovingDoodleState(100, 150, {
        type: 'linear',
        axis: 'x',
        range: 30,
        speed: 1,
      });

      updateMovingDoodle(state, 500);
      expect(state.phase).not.toBe(0);

      resetMovingDoodlePhase(state);
      expect(state.phase).toBe(0);
      expect(state.currentX).toBe(100);
      expect(state.currentY).toBe(150);
    });
  });

  describe('Doodle integration', () => {
    it('creates static doodle without motion state', () => {
      const placement: DoodlePlacement = {
        x: 200,
        y: 100,
        size: 'large',
        sprite: 'coin',
        sequence: 1,
      };

      const doodle = createDoodleFromPlacement(placement);
      expect(doodle.motionState).toBeNull();
      expect(doodle.baseX).toBe(200);
      expect(doodle.baseY).toBe(100);
    });

    it('creates moving doodle with motion state', () => {
      const placement: DoodlePlacement = {
        x: 200,
        y: 100,
        size: 'large',
        sprite: 'star',
        sequence: 2,
        motion: { type: 'linear', axis: 'y', range: 25, speed: 0.5 },
      };

      const doodle = createDoodleFromPlacement(placement);
      expect(doodle.motionState).not.toBeNull();
      expect(doodle.motionState?.motion.type).toBe('linear');
    });

    it('updateDoodles moves doodles with motion', () => {
      const placements: DoodlePlacement[] = [
        { x: 100, y: 100, size: 'small', sprite: 'coin', sequence: 1 }, // static
        {
          x: 200, y: 100, size: 'large', sprite: 'star', sequence: 2,
          motion: { type: 'linear', axis: 'x', range: 30, speed: 1 },
        },
      ];

      const doodles = placements.map(createDoodleFromPlacement);

      // Update with 250ms
      updateDoodles(doodles, 250);

      // Static doodle unchanged
      expect(doodles[0].x).toBe(100);
      expect(doodles[0].y).toBe(100);

      // Moving doodle should be offset
      expect(doodles[1].x).toBeCloseTo(230, 0); // 200 + 30
      expect(doodles[1].y).toBe(100);
    });

    it('resetDoodles resets motion phase', () => {
      const placement: DoodlePlacement = {
        x: 200, y: 100, size: 'large', sprite: 'coin', sequence: 1,
        motion: { type: 'circular', radius: 20, speed: 1 },
      };

      const doodles = [createDoodleFromPlacement(placement)];
      updateDoodles(doodles, 500);

      expect(doodles[0].x).not.toBe(200);

      resetDoodles(doodles);
      expect(doodles[0].x).toBe(200);
      expect(doodles[0].y).toBe(100);
      expect(doodles[0].motionState?.phase).toBe(0);
    });

    it('collected doodles do not move', () => {
      const placement: DoodlePlacement = {
        x: 200, y: 100, size: 'large', sprite: 'coin', sequence: 1,
        motion: { type: 'linear', axis: 'x', range: 30, speed: 1 },
      };

      const doodles = [createDoodleFromPlacement(placement)];
      doodles[0].collected = true;

      const initialX = doodles[0].x;
      updateDoodles(doodles, 500);

      expect(doodles[0].x).toBe(initialX); // Should not move
    });
  });
});
