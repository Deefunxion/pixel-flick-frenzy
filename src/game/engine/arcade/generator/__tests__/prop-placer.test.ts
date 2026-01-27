import { describe, it, expect } from 'vitest';
import { placePropsForTrajectory, findSpringPositions, checkPropBlocksDoodles } from '../prop-placer';
import { SeededRandom } from '../random';
import type { StrokePoint } from '../types';

describe('placePropsForTrajectory', () => {
  it('places springs for climber archetype with upward transitions', () => {
    const positions: StrokePoint[] = [
      { x: 100, y: 180 }, // Start low
      { x: 150, y: 120 }, // Go up 60px
      { x: 200, y: 60 },  // Go up 60px more
    ];
    const rng = new SeededRandom('test-climber');

    const result = placePropsForTrajectory(positions, 'climber', rng);

    expect(result.springs.length).toBeGreaterThan(0);
    expect(result.portal).toBeNull();
  });

  it('places portal for perimeter archetype', () => {
    const positions: StrokePoint[] = [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 300, y: 100 },
    ];
    const rng = new SeededRandom('test-perimeter');

    const result = placePropsForTrajectory(positions, 'perimeter', rng);

    expect(result.portal).not.toBeNull();
    expect(result.portal?.entry.x).toBeGreaterThan(300); // Near right edge
    expect(result.portal?.exit.x).toBeLessThan(100); // Near left edge
  });

  it('places portal connecting clusters for split archetype', () => {
    const positions: StrokePoint[] = [
      { x: 80, y: 100 },   // Left cluster
      { x: 120, y: 120 },  // Left cluster
      { x: 300, y: 100 },  // Right cluster
      { x: 350, y: 120 },  // Right cluster
    ];
    const rng = new SeededRandom('test-split');

    const result = placePropsForTrajectory(positions, 'split', rng);

    expect(result.portal).not.toBeNull();
    // Portal should connect left to right cluster
    expect(result.portal?.entry.x).toBeLessThan(200);
    expect(result.portal?.exit.x).toBeGreaterThan(200);
  });

  it('returns empty props for runner archetype', () => {
    const positions: StrokePoint[] = [
      { x: 100, y: 120 },
      { x: 200, y: 120 },
      { x: 300, y: 120 },
    ];
    const rng = new SeededRandom('test-runner');

    const result = placePropsForTrajectory(positions, 'runner', rng);

    expect(result.springs.length).toBe(0);
    expect(result.portal).toBeNull();
  });
});

describe('findSpringPositions', () => {
  it('finds springs at upward transitions > 25px', () => {
    const positions: StrokePoint[] = [
      { x: 100, y: 150 },
      { x: 150, y: 100 }, // Up 50px - needs spring
      { x: 200, y: 110 }, // Down 10px - no spring
      { x: 250, y: 60 },  // Up 50px - needs spring
    ];
    const rng = new SeededRandom('test-springs');

    const springs = findSpringPositions(positions, rng);

    expect(springs.length).toBe(2);
  });

  it('sets direction based on horizontal movement', () => {
    const positions: StrokePoint[] = [
      { x: 100, y: 150 },
      { x: 200, y: 100 }, // Moving right and up
    ];
    const rng = new SeededRandom('test-direction');

    const springs = findSpringPositions(positions, rng);

    expect(springs[0].direction).toBe('up-right');
  });
});

describe('checkPropBlocksDoodles', () => {
  it('returns true when prop is too close to doodle', () => {
    const doodles: StrokePoint[] = [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
    ];

    // Prop at x=110, y=100 with radius 20 is within 25px of doodle at 100,100
    expect(checkPropBlocksDoodles(110, 100, 20, doodles)).toBe(true);
  });

  it('returns false when prop is far from doodles', () => {
    const doodles: StrokePoint[] = [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
    ];

    // Prop at x=150, y=180 is far from both doodles
    expect(checkPropBlocksDoodles(150, 180, 15, doodles)).toBe(false);
  });
});
