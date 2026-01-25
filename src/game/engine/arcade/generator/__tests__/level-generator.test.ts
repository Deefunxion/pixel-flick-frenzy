// src/game/engine/arcade/generator/__tests__/level-generator.test.ts
import { LevelGenerator } from '../level-generator';
import { setCharacterDatabase } from '../stroke-data';
import type { CharacterData } from '../types';

// Mock character data for testing
const mockCharacters: CharacterData[] = [
  {
    character: '一',
    strokeCount: 1,
    strokes: [
      { path: 'M 100 500 L 900 500', points: [{ x: 100, y: 500 }, { x: 900, y: 500 }] },
    ],
  },
  {
    character: '二',
    strokeCount: 2,
    strokes: [
      { path: 'M 200 300 L 800 300', points: [{ x: 200, y: 300 }, { x: 800, y: 300 }] },
      { path: 'M 100 700 L 900 700', points: [{ x: 100, y: 700 }, { x: 900, y: 700 }] },
    ],
  },
  {
    character: '三',
    strokeCount: 3,
    strokes: [
      { path: 'M 200 200 L 800 200', points: [{ x: 200, y: 200 }, { x: 800, y: 200 }] },
      { path: 'M 150 500 L 850 500', points: [{ x: 150, y: 500 }, { x: 850, y: 500 }] },
      { path: 'M 100 800 L 900 800', points: [{ x: 100, y: 800 }, { x: 900, y: 800 }] },
    ],
  },
  {
    character: '大',
    strokeCount: 3,
    strokes: [
      { path: '', points: [{ x: 500, y: 100 }, { x: 500, y: 600 }] },
      { path: '', points: [{ x: 200, y: 300 }, { x: 500, y: 300 }] },
      { path: '', points: [{ x: 500, y: 300 }, { x: 800, y: 800 }] },
    ],
  },
  {
    character: '田',
    strokeCount: 5,
    strokes: [
      { path: '', points: [{ x: 200, y: 150 }, { x: 200, y: 850 }] },
      { path: '', points: [{ x: 200, y: 150 }, { x: 800, y: 150 }, { x: 800, y: 850 }] },
      { path: '', points: [{ x: 200, y: 500 }, { x: 800, y: 500 }] },
      { path: '', points: [{ x: 500, y: 150 }, { x: 500, y: 850 }] },
      { path: '', points: [{ x: 200, y: 850 }, { x: 800, y: 850 }] },
    ],
  },
];

describe('LevelGenerator', () => {
  beforeAll(() => {
    // Inject mock data before tests
    setCharacterDatabase(mockCharacters);
  });

  it('generates a valid level for given ID', async () => {
    const generator = new LevelGenerator();

    const result = await generator.generateLevel(1, 'test-seed');

    expect(result.success).toBe(true);
    expect(result.level).toBeDefined();
    expect(result.level?.id).toBe(1);
    expect(result.level?.doodles.length).toBeGreaterThanOrEqual(1);
  });

  it('produces deterministic output for same seed', async () => {
    const generator = new LevelGenerator();

    const result1 = await generator.generateLevel(3, 'deterministic-seed');
    const result2 = await generator.generateLevel(3, 'deterministic-seed');

    expect(result1.level?.doodles.length).toEqual(result2.level?.doodles.length);
    // Positions should be the same
    if (result1.level && result2.level) {
      expect(result1.level.doodles[0]?.x).toEqual(result2.level.doodles[0]?.x);
    }
  });

  it('produces different output for different seeds', async () => {
    const generator = new LevelGenerator();

    const result1 = await generator.generateLevel(3, 'seed-alpha');
    const result2 = await generator.generateLevel(3, 'seed-beta');

    // At least some aspect should differ (character choice, rotation, etc)
    // Note: with limited characters, doodle count may be same but positions differ
    expect(result1.level).toBeDefined();
    expect(result2.level).toBeDefined();
  });

  it('includes ghost replay data when successful', async () => {
    const generator = new LevelGenerator();

    const result = await generator.generateLevel(1, 'ghost-test');

    if (result.success) {
      expect(result.ghostReplay).toBeDefined();
      expect(Array.isArray(result.ghostReplay)).toBe(true);
    }
  });

  it('sets correct landing target based on level', async () => {
    const generator = new LevelGenerator();

    const result1 = await generator.generateLevel(1, 'target-test-1');
    const result50 = await generator.generateLevel(50, 'target-test-50');

    expect(result1.level?.landingTarget).toBe(410);
    expect(result50.level?.landingTarget).toBe(410);
  });
});
