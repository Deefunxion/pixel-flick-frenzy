import { describe, it, expect } from 'vitest';
import { connectStrokes, ConnectionResult } from '../stroke-connector';
import type { StrokeOverlay } from '../../types';

function makeStroke(id: string, startX: number, startY: number, endX: number, endY: number): StrokeOverlay {
  return {
    id,
    points: [{ x: startX, y: startY }, { x: endX, y: endY }],
    widths: [1.2, 0.8],
    populated: true,
    doodleIds: [1, 2],
  };
}

describe('connectStrokes', () => {
  it('connects two horizontal strokes with a spring (going up)', () => {
    const stroke1 = makeStroke('s1', 50, 150, 200, 150);  // Lower
    const stroke2 = makeStroke('s2', 150, 80, 300, 80);   // Higher

    const result = connectStrokes([stroke1, stroke2], 21); // World 3 = portals available

    expect(result.springs.length).toBeGreaterThan(0);
  });

  it('uses portal for large horizontal gap when available', () => {
    const stroke1 = makeStroke('s1', 50, 100, 100, 100);  // Left side
    const stroke2 = makeStroke('s2', 300, 100, 400, 100); // Right side, big gap (200px)

    const result = connectStrokes([stroke1, stroke2], 21); // Portals unlocked

    expect(result.portals.length).toBeGreaterThan(0);
  });

  it('only uses springs in world 1-2 (no portals)', () => {
    const stroke1 = makeStroke('s1', 50, 100, 150, 100);
    const stroke2 = makeStroke('s2', 300, 100, 400, 100);

    const result = connectStrokes([stroke1, stroke2], 10); // World 1

    expect(result.portals.length).toBe(0);
    expect(result.springs.length).toBeGreaterThan(0);
  });

  it('adds wind zone in world 5+ for horizontal transitions', () => {
    const stroke1 = makeStroke('s1', 50, 100, 100, 100);
    const stroke2 = makeStroke('s2', 220, 110, 350, 110);  // >100px horizontal, <50px vertical

    const result = connectStrokes([stroke1, stroke2], 45); // World 5

    expect(result.windZones.length).toBeGreaterThan(0);
  });

  it('returns empty result for single stroke', () => {
    const stroke1 = makeStroke('s1', 50, 100, 150, 100);

    const result = connectStrokes([stroke1], 21);

    expect(result.springs.length).toBe(0);
    expect(result.portals.length).toBe(0);
    expect(result.windZones.length).toBe(0);
    expect(result.gravityWells.length).toBe(0);
  });

  it('skips unpopulated strokes', () => {
    const stroke1 = makeStroke('s1', 50, 100, 150, 100);
    const stroke2: StrokeOverlay = {
      id: 's2',
      points: [{ x: 200, y: 100 }, { x: 300, y: 100 }],
      widths: [1.0, 1.0],
      populated: false,  // Not populated
      doodleIds: [],
    };
    const stroke3 = makeStroke('s3', 350, 80, 400, 80);

    const result = connectStrokes([stroke1, stroke2, stroke3], 21);

    // Should connect stroke1 to stroke3 directly (skipping stroke2)
    expect(result.springs.length + result.portals.length).toBeGreaterThan(0);
  });

  it('creates spring with correct direction for upward movement', () => {
    const stroke1 = makeStroke('s1', 100, 180, 200, 180);  // Lower
    const stroke2 = makeStroke('s2', 200, 80, 300, 80);    // Higher, slightly right

    const result = connectStrokes([stroke1, stroke2], 10);

    expect(result.springs.length).toBe(1);
    expect(['up', 'up-right', 'up-left']).toContain(result.springs[0].direction);
  });
});
