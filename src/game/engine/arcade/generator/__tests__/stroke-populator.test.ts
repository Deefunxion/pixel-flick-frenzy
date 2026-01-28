import { describe, it, expect } from 'vitest';
import { populateStrokeWithCoins, PopulateOptions } from '../stroke-populator';
import type { StrokeOverlay } from '../../types';

function makeStroke(pointCount: number): StrokeOverlay {
  const points = Array.from({ length: pointCount }, (_, i) => ({
    x: 50 + i * 35,
    y: 100,
  }));
  const widths = Array.from({ length: pointCount }, (_, i) =>
    1.4 - (i / (pointCount - 1)) * 0.8  // Taper from 1.4 to 0.6
  );
  return {
    id: 'stroke-0',
    points,
    widths,
    populated: false,
    doodleIds: [],
  };
}

describe('populateStrokeWithCoins', () => {
  it('places coins along stroke path', () => {
    const stroke = makeStroke(10);
    const options: PopulateOptions = { density: 0.5 };
    const coins = populateStrokeWithCoins(stroke, options);

    expect(coins.length).toBeGreaterThan(0);
    // Coins are placed along the stroke path (positions should be within stroke bounds)
    const minX = Math.min(...stroke.points.map(p => p.x));
    const maxX = Math.max(...stroke.points.map(p => p.x));
    for (const coin of coins) {
      expect(coin.x).toBeGreaterThanOrEqual(minX);
      expect(coin.x).toBeLessThanOrEqual(maxX);
    }
  });

  it('density 0.3 produces fewer coins than density 0.9', () => {
    const stroke = makeStroke(20);
    const sparse = populateStrokeWithCoins(stroke, { density: 0.3 });
    const dense = populateStrokeWithCoins(stroke, { density: 0.9 });

    expect(dense.length).toBeGreaterThan(sparse.length);
  });

  it('coin scale follows stroke width (calligraphic)', () => {
    const stroke = makeStroke(10);
    const coins = populateStrokeWithCoins(stroke, { density: 1.0 });

    // First coin should be larger than last (stroke tapers)
    expect(coins[0].scale).toBeGreaterThan(coins[coins.length - 1].scale!);
  });

  it('assigns sequential IDs starting from startId', () => {
    const stroke = makeStroke(5);
    const coins = populateStrokeWithCoins(stroke, { density: 1.0, startId: 10 });

    expect(coins[0].sequence).toBe(10);
    expect(coins[1].sequence).toBe(11);
  });

  it('respects minimum spacing between coins', () => {
    const stroke = makeStroke(20);
    const coins = populateStrokeWithCoins(stroke, { density: 1.0, minSpacing: 15 });

    for (let i = 1; i < coins.length; i++) {
      const dx = coins[i].x - coins[i - 1].x;
      const dy = coins[i].y - coins[i - 1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      expect(dist).toBeGreaterThanOrEqual(14); // Allow small float error
    }
  });

  it('returns empty array for stroke with less than 2 points', () => {
    const stroke: StrokeOverlay = {
      id: 'stroke-0',
      points: [{ x: 100, y: 100 }],
      widths: [1.0],
      populated: false,
      doodleIds: [],
    };
    const coins = populateStrokeWithCoins(stroke, { density: 1.0 });
    expect(coins).toEqual([]);
  });

  it('assigns star sprite to first and last coins', () => {
    const stroke = makeStroke(10);
    const coins = populateStrokeWithCoins(stroke, { density: 0.5 });

    if (coins.length >= 2) {
      expect(coins[0].sprite).toBe('star');
      expect(coins[coins.length - 1].sprite).toBe('star');
    }
  });

  it('assigns coin sprite to middle coins', () => {
    const stroke = makeStroke(20);
    const coins = populateStrokeWithCoins(stroke, { density: 0.8 });

    if (coins.length >= 3) {
      // Check some middle coins have 'coin' sprite
      const middleCoins = coins.slice(1, -1);
      const coinSprites = middleCoins.filter(c => c.sprite === 'coin');
      expect(coinSprites.length).toBeGreaterThan(0);
    }
  });
});
