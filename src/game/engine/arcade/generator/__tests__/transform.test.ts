// src/game/engine/arcade/generator/__tests__/transform.test.ts
import { StrokeTransformer } from '../transform';
import type { CharacterData } from '../types';

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
      expect(distance).toBeGreaterThanOrEqual(35); // Allow small tolerance
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
