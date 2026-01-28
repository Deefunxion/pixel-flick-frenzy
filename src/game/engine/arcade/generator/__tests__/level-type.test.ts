import { describe, it, expect } from 'vitest';
import {
  getLevelType,
  getStarRequirements,
  getDefaultDensity,
  isJuicyLevel
} from '../level-type';

describe('getLevelType', () => {
  it('levels 3, 6, 10 of each world are juicy', () => {
    // World 1
    expect(getLevelType(3)).toBe('juicy');
    expect(getLevelType(6)).toBe('juicy');
    expect(getLevelType(10)).toBe('juicy');
    // World 2
    expect(getLevelType(13)).toBe('juicy');
    expect(getLevelType(16)).toBe('juicy');
    expect(getLevelType(20)).toBe('juicy');
    // World 25
    expect(getLevelType(243)).toBe('juicy');
    expect(getLevelType(246)).toBe('juicy');
    expect(getLevelType(250)).toBe('juicy');
  });

  it('other levels are puzzly', () => {
    expect(getLevelType(1)).toBe('puzzly');
    expect(getLevelType(2)).toBe('puzzly');
    expect(getLevelType(4)).toBe('puzzly');
    expect(getLevelType(5)).toBe('puzzly');
    expect(getLevelType(7)).toBe('puzzly');
    expect(getLevelType(8)).toBe('puzzly');
    expect(getLevelType(9)).toBe('puzzly');
  });
});

describe('isJuicyLevel', () => {
  it('returns true for positions 3, 6, 10 within world', () => {
    expect(isJuicyLevel(3)).toBe(true);
    expect(isJuicyLevel(13)).toBe(true);
    expect(isJuicyLevel(23)).toBe(true);
  });

  it('returns false for non-juicy positions', () => {
    expect(isJuicyLevel(1)).toBe(false);
    expect(isJuicyLevel(5)).toBe(false);
    expect(isJuicyLevel(9)).toBe(false);
  });
});

describe('getStarRequirements', () => {
  it('puzzly levels require sequence for 3 stars', () => {
    const req = getStarRequirements('puzzly');
    expect(req.oneStar).toBe('land');
    expect(req.twoStar).toBe('allCoins');
    expect(req.threeStar).toBe('allCoinsInSequence');
  });

  it('juicy levels require all coins (no sequence) for 3 stars', () => {
    const req = getStarRequirements('juicy');
    expect(req.oneStar).toBe('land');
    expect(req.twoStar).toBe('halfCoins');
    expect(req.threeStar).toBe('allCoins');
  });
});

describe('getDefaultDensity', () => {
  it('puzzly levels have sparse density (0.3)', () => {
    expect(getDefaultDensity('puzzly')).toBe(0.3);
  });

  it('juicy levels have dense density (0.9)', () => {
    expect(getDefaultDensity('juicy')).toBe(0.9);
  });
});
