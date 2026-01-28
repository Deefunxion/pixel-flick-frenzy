import { describe, it, expect } from 'vitest';
import { getAvailableProps, PropType, isUnlocked } from '../prop-unlocks';

describe('getAvailableProps', () => {
  it('world 1-2 only has springs', () => {
    expect(getAvailableProps(1)).toEqual(['spring']);
    expect(getAvailableProps(2)).toEqual(['spring']);
    expect(getAvailableProps(15)).toEqual(['spring']); // Level 15 = World 2
    expect(getAvailableProps(20)).toEqual(['spring']);
  });

  it('world 3-4 adds portals', () => {
    expect(getAvailableProps(21)).toContain('spring');
    expect(getAvailableProps(21)).toContain('portal');
    expect(getAvailableProps(40)).toContain('portal');
  });

  it('world 5-6 adds wind zones', () => {
    expect(getAvailableProps(41)).toContain('wind');
    expect(getAvailableProps(60)).toContain('wind');
  });

  it('world 7-8 adds gravity wells', () => {
    expect(getAvailableProps(61)).toContain('gravity');
    expect(getAvailableProps(80)).toContain('gravity');
  });

  it('world 9-10 adds hazards', () => {
    expect(getAvailableProps(81)).toContain('hazard');
    expect(getAvailableProps(100)).toContain('hazard');
  });

  it('world 11+ adds friction zones', () => {
    expect(getAvailableProps(101)).toContain('friction');
    const all = getAvailableProps(250);
    expect(all).toEqual(['spring', 'portal', 'wind', 'gravity', 'hazard', 'friction']);
  });
});

describe('isUnlocked', () => {
  it('spring is always unlocked', () => {
    expect(isUnlocked('spring', 1)).toBe(true);
    expect(isUnlocked('spring', 250)).toBe(true);
  });

  it('portal unlocks at world 3', () => {
    expect(isUnlocked('portal', 20)).toBe(false);
    expect(isUnlocked('portal', 21)).toBe(true);
  });

  it('wind unlocks at world 5', () => {
    expect(isUnlocked('wind', 40)).toBe(false);
    expect(isUnlocked('wind', 41)).toBe(true);
  });

  it('gravity unlocks at world 7', () => {
    expect(isUnlocked('gravity', 60)).toBe(false);
    expect(isUnlocked('gravity', 61)).toBe(true);
  });

  it('hazard unlocks at world 9', () => {
    expect(isUnlocked('hazard', 80)).toBe(false);
    expect(isUnlocked('hazard', 81)).toBe(true);
  });

  it('friction unlocks at world 11', () => {
    expect(isUnlocked('friction', 100)).toBe(false);
    expect(isUnlocked('friction', 101)).toBe(true);
  });
});
