// src/game/engine/arcade/generator/__tests__/random.test.ts
import { SeededRandom } from '../random';

describe('SeededRandom', () => {
  it('produces deterministic sequence for same seed', () => {
    const rng1 = new SeededRandom('test-seed');
    const rng2 = new SeededRandom('test-seed');

    const seq1 = [rng1.next(), rng1.next(), rng1.next()];
    const seq2 = [rng2.next(), rng2.next(), rng2.next()];

    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = new SeededRandom('seed-a');
    const rng2 = new SeededRandom('seed-b');

    expect(rng1.next()).not.toEqual(rng2.next());
  });

  it('nextInt returns integers in range', () => {
    const rng = new SeededRandom('test');
    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('pick selects from array deterministically', () => {
    const rng1 = new SeededRandom('pick-test');
    const rng2 = new SeededRandom('pick-test');
    const arr = ['a', 'b', 'c', 'd', 'e'];

    expect(rng1.pick(arr)).toEqual(rng2.pick(arr));
  });

  it('shuffle is deterministic', () => {
    const rng1 = new SeededRandom('shuffle-test');
    const rng2 = new SeededRandom('shuffle-test');
    const arr1 = [1, 2, 3, 4, 5];
    const arr2 = [1, 2, 3, 4, 5];

    expect(rng1.shuffle(arr1)).toEqual(rng2.shuffle(arr2));
  });

  it('derive creates child RNG with different sequence', () => {
    const rng = new SeededRandom('parent');
    const child1 = rng.derive('child1');
    const child2 = rng.derive('child2');

    expect(child1.next()).not.toEqual(child2.next());
  });
});
