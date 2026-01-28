// src/game/engine/arcade/generator/__tests__/transform.test.ts
import { describe, it, expect } from 'vitest';
import { StrokeTransformer } from '../transform';
import type { CharacterData } from '../types';
import type { StrokeOverlay } from '../../types';

describe('StrokeTransformer', () => {
  const mockCharacter: CharacterData = {
    character: '大',
    strokeCount: 3,
    strokes: [
      { path: '', points: [{ x: 500, y: 100 }, { x: 500, y: 700 }] },
      { path: '', points: [{ x: 200, y: 400 }, { x: 500, y: 400 }] },
      { path: '', points: [{ x: 500, y: 400 }, { x: 800, y: 700 }] },
    ],
  };

  it('transforms points to game canvas coordinates', () => {
    const transformer = new StrokeTransformer();
    const points = transformer.transformToGameCanvas(mockCharacter);

    // All points should be within game bounds (50-400 x 35-190)
    for (const point of points) {
      expect(point.x).toBeGreaterThanOrEqual(50);
      expect(point.x).toBeLessThanOrEqual(400);
      expect(point.y).toBeGreaterThanOrEqual(35);
      expect(point.y).toBeLessThanOrEqual(190);
    }
  });

  it('can rotate character 90 degrees', () => {
    const transformer = new StrokeTransformer({ rotation: 90 });
    const points = transformer.transformToGameCanvas(mockCharacter);

    expect(points.length).toBeGreaterThan(0);
  });

  it('extracts doodle positions spread evenly across play area', () => {
    const transformer = new StrokeTransformer();
    const doodlePositions = transformer.extractDoodlePositions(mockCharacter, 5);

    // Should have requested number of positions
    expect(doodlePositions.length).toBe(5);

    // Positions should span most of the play area (50-400)
    const minX = Math.min(...doodlePositions.map(p => p.x));
    const maxX = Math.max(...doodlePositions.map(p => p.x));
    expect(maxX - minX).toBeGreaterThan(200); // Should span at least 200 pixels
  });

  it('ensures minimum spacing between doodles', () => {
    const transformer = new StrokeTransformer();
    const doodlePositions = transformer.extractDoodlePositions(mockCharacter, 8);

    // Check spacing between consecutive positions
    for (let i = 1; i < doodlePositions.length; i++) {
      const prev = doodlePositions[i - 1];
      const curr = doodlePositions[i];
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      expect(distance).toBeGreaterThanOrEqual(20); // Allow small tolerance (MIN_DOODLE_SPACING is 25)
    }
  });

  it('gets full path for trajectory analysis', () => {
    const transformer = new StrokeTransformer();
    const path = transformer.getFullPath(mockCharacter);

    // Should have all points from all strokes
    const totalPoints = mockCharacter.strokes.reduce((sum, s) => sum + s.points.length, 0);
    expect(path.length).toBe(totalPoints);
  });

  it('flips horizontally when option set', () => {
    // Use a character with asymmetric points
    const asymmetricChar: CharacterData = {
      character: 'test',
      strokeCount: 1,
      strokes: [
        { path: '', points: [{ x: 200, y: 500 }, { x: 800, y: 500 }] },
      ],
    };

    const transformerNormal = new StrokeTransformer();
    const transformerFlipped = new StrokeTransformer({ flipHorizontal: true });

    const pointsNormal = transformerNormal.transformToGameCanvas(asymmetricChar);
    const pointsFlipped = transformerFlipped.transformToGameCanvas(asymmetricChar);

    // Flipped points should have different x values (first point at x=200 vs x=800)
    expect(pointsNormal[0].x).not.toEqual(pointsFlipped[0].x);
  });
});

// Helper to create test character
function makeCharacter(points: Array<{ x: number; y: number }>): CharacterData {
  return {
    character: 'test',
    strokeCount: 1,
    strokes: [{ path: '', points }],
  };
}

describe('StrokeTransformer with archetypes', () => {
  describe('runner archetype', () => {
    it('compresses Y range to 90-150', () => {
      const char = makeCharacter([
        { x: 100, y: 100 },
        { x: 500, y: 500 },
        { x: 900, y: 900 },
      ]);
      const transformer = new StrokeTransformer({ archetype: 'runner' });
      const positions = transformer.extractDoodlePositions(char, 3);

      for (const pos of positions) {
        expect(pos.y).toBeGreaterThanOrEqual(90);
        expect(pos.y).toBeLessThanOrEqual(150);
      }
    });

    it('spreads X across full width (50-400)', () => {
      const char = makeCharacter([
        { x: 400, y: 500 },
        { x: 500, y: 500 },
        { x: 600, y: 500 },
      ]);
      const transformer = new StrokeTransformer({ archetype: 'runner' });
      const positions = transformer.extractDoodlePositions(char, 5);

      const xs = positions.map(p => p.x);
      expect(Math.min(...xs)).toBeLessThan(100);
      expect(Math.max(...xs)).toBeGreaterThan(350);
    });
  });

  describe('climber archetype', () => {
    it('inverts Y (first doodle low, last doodle high)', () => {
      const char = makeCharacter([
        { x: 500, y: 100 }, // top in SVG
        { x: 500, y: 500 },
        { x: 500, y: 900 }, // bottom in SVG
      ]);
      const transformer = new StrokeTransformer({ archetype: 'climber' });
      const positions = transformer.extractDoodlePositions(char, 5);

      // First doodle should be LOW (high Y = bottom of screen)
      expect(positions[0].y).toBeGreaterThan(150);
      // Last doodle should be HIGH (low Y = top of screen)
      expect(positions[positions.length - 1].y).toBeLessThan(80);
    });

    it('uses narrow X range (120-280)', () => {
      const char = makeCharacter([
        { x: 100, y: 500 },
        { x: 900, y: 500 },
      ]);
      const transformer = new StrokeTransformer({ archetype: 'climber' });
      const positions = transformer.extractDoodlePositions(char, 5);

      for (const pos of positions) {
        expect(pos.x).toBeGreaterThanOrEqual(120);
        expect(pos.x).toBeLessThanOrEqual(280);
      }
    });
  });

  describe('zigzag archetype', () => {
    it('alternates Y between high and low bands', () => {
      const char = makeCharacter([
        { x: 100, y: 500 },
        { x: 300, y: 500 },
        { x: 500, y: 500 },
        { x: 700, y: 500 },
        { x: 900, y: 500 },
      ]);
      const transformer = new StrokeTransformer({ archetype: 'zigzag' });
      const positions = transformer.extractDoodlePositions(char, 6);

      // Check alternating pattern
      for (let i = 1; i < positions.length; i++) {
        const prev = positions[i - 1];
        const curr = positions[i];
        // Should alternate between high (<100) and low (>130) bands
        const prevHigh = prev.y < 115;
        const currHigh = curr.y < 115;
        expect(prevHigh).not.toBe(currHigh);
      }
    });
  });

  describe('split archetype', () => {
    it('places doodles in two X clusters', () => {
      const char = makeCharacter([
        { x: 200, y: 500 },
        { x: 800, y: 500 },
      ]);
      const transformer = new StrokeTransformer({ archetype: 'split' });
      const positions = transformer.extractDoodlePositions(char, 6);

      // leftCluster: 60-150, rightCluster: 280-380
      const leftCluster = positions.filter(p => p.x <= 160);
      const rightCluster = positions.filter(p => p.x >= 270);

      expect(leftCluster.length).toBeGreaterThan(0);
      expect(rightCluster.length).toBeGreaterThan(0);

      // Should be no doodles in clear middle zone (170-260)
      const middleZone = positions.filter(p => p.x > 160 && p.x < 270);
      expect(middleZone.length).toBe(0);
    });
  });

  describe('getArchetype', () => {
    it('returns the archetype being used', () => {
      const transformer = new StrokeTransformer({ archetype: 'climber' });
      expect(transformer.getArchetype()).toBe('climber');
    });

    it('defaults to general archetype', () => {
      const transformer = new StrokeTransformer();
      expect(transformer.getArchetype()).toBe('general');
    });
  });
});

describe('StrokeTransformer.createStrokeOverlays', () => {
  it('creates overlay for each stroke in character', () => {
    const character: CharacterData = {
      character: '一',
      strokeCount: 1,
      strokes: [
        { path: '', points: [{ x: 100, y: 500 }, { x: 900, y: 500 }] }
      ],
    };
    const transformer = new StrokeTransformer();
    const overlays = transformer.createStrokeOverlays(character);

    expect(overlays.length).toBe(1);
    expect(overlays[0].id).toBe('stroke-0');
    expect(overlays[0].populated).toBe(false);
    expect(overlays[0].doodleIds).toEqual([]);
  });

  it('transforms SVG coordinates to game canvas coordinates', () => {
    const character: CharacterData = {
      character: '一',
      strokeCount: 1,
      strokes: [
        { path: '', points: [{ x: 0, y: 500 }, { x: 1000, y: 500 }] }
      ],
    };
    const transformer = new StrokeTransformer();
    const overlays = transformer.createStrokeOverlays(character);

    // SVG 0-1000 maps to game 50-400 (X) and 30-190 (Y)
    expect(overlays[0].points[0].x).toBeGreaterThanOrEqual(50);
    expect(overlays[0].points[0].x).toBeLessThanOrEqual(400);
    expect(overlays[0].points[overlays[0].points.length - 1].x).toBeGreaterThanOrEqual(50);
    expect(overlays[0].points[overlays[0].points.length - 1].x).toBeLessThanOrEqual(400);
  });

  it('includes width data for each point', () => {
    const character: CharacterData = {
      character: '一',
      strokeCount: 1,
      strokes: [
        { path: '', points: [
          { x: 100, y: 500 },
          { x: 300, y: 500 },
          { x: 500, y: 500 },
          { x: 700, y: 500 },
          { x: 900, y: 500 },
        ]}
      ],
    };
    const transformer = new StrokeTransformer();
    const overlays = transformer.createStrokeOverlays(character);

    expect(overlays[0].widths.length).toBe(overlays[0].points.length);
    // First width > last width (calligraphic taper)
    expect(overlays[0].widths[0]).toBeGreaterThan(overlays[0].widths[overlays[0].widths.length - 1]);
  });

  it('creates multiple overlays for multi-stroke characters', () => {
    const character: CharacterData = {
      character: '二',
      strokeCount: 2,
      strokes: [
        { path: '', points: [{ x: 100, y: 300 }, { x: 900, y: 300 }] },
        { path: '', points: [{ x: 100, y: 700 }, { x: 900, y: 700 }] },
      ],
    };
    const transformer = new StrokeTransformer();
    const overlays = transformer.createStrokeOverlays(character);

    expect(overlays.length).toBe(2);
    expect(overlays[0].id).toBe('stroke-0');
    expect(overlays[1].id).toBe('stroke-1');
  });
});
