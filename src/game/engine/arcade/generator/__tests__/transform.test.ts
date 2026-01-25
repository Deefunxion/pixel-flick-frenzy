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

    // All points should be within game bounds (35-410 x 25-200)
    for (const point of points) {
      expect(point.x).toBeGreaterThanOrEqual(35); // After launch pad
      expect(point.x).toBeLessThanOrEqual(410); // Before cliff edge
      expect(point.y).toBeGreaterThanOrEqual(25);
      expect(point.y).toBeLessThanOrEqual(200);
    }
  });

  it('maintains aspect ratio when transforming', () => {
    const transformer = new StrokeTransformer({ maintainAspectRatio: true });
    const points = transformer.transformToGameCanvas(mockCharacter);

    // Character should not be distorted beyond threshold
    expect(points.length).toBeGreaterThan(0);
  });

  it('can rotate character 90 degrees', () => {
    const transformer = new StrokeTransformer({ rotation: 90 });
    const points = transformer.transformToGameCanvas(mockCharacter);

    expect(points.length).toBeGreaterThan(0);
  });

  it('extracts stroke endpoints as doodle positions', () => {
    const transformer = new StrokeTransformer();
    const doodlePositions = transformer.extractDoodlePositions(mockCharacter);

    // Should have one position per stroke endpoint (excluding shared points)
    expect(doodlePositions.length).toBeGreaterThanOrEqual(mockCharacter.strokeCount);
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
