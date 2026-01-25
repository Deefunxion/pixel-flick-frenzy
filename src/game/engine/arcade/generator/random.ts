// src/game/engine/arcade/generator/random.ts

// Simple seeded PRNG using mulberry32 algorithm
function mulberry32(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Convert string seed to number
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export class SeededRandom {
  private rng: () => number;

  constructor(seed: string | number) {
    const numericSeed = typeof seed === 'string' ? hashString(seed) : seed;
    this.rng = mulberry32(numericSeed);
  }

  /** Returns float in [0, 1) */
  next(): number {
    return this.rng();
  }

  /** Returns integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns float in [min, max) */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /** Pick random element from array */
  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  /** Shuffle array in place (Fisher-Yates) */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /** Create child RNG with derived seed */
  derive(suffix: string | number): SeededRandom {
    const childSeed = Math.floor(this.next() * 0xFFFFFFFF) + String(suffix);
    return new SeededRandom(childSeed);
  }
}
