import { describe, it, expect } from 'vitest';
import {
  ARCHETYPE_TRANSFORMS,
  getArchetypeForWorld,
  selectArchetypeForLevel
} from '../archetypes';
import type { Archetype } from '../types';

describe('ARCHETYPE_TRANSFORMS', () => {
  it('defines transforms for all 7 archetypes', () => {
    const archetypes: Archetype[] = ['runner', 'diver', 'climber', 'zigzag', 'perimeter', 'split', 'general'];
    for (const arch of archetypes) {
      expect(ARCHETYPE_TRANSFORMS[arch]).toBeDefined();
      expect(ARCHETYPE_TRANSFORMS[arch].xMin).toBeGreaterThanOrEqual(50);
      expect(ARCHETYPE_TRANSFORMS[arch].xMax).toBeLessThanOrEqual(400);
      expect(ARCHETYPE_TRANSFORMS[arch].yMin).toBeGreaterThanOrEqual(30);
      expect(ARCHETYPE_TRANSFORMS[arch].yMax).toBeLessThanOrEqual(190);
    }
  });

  it('runner has compressed Y range (90-150)', () => {
    const t = ARCHETYPE_TRANSFORMS.runner;
    expect(t.yMin).toBe(90);
    expect(t.yMax).toBe(150);
    expect(t.xMin).toBe(50);
    expect(t.xMax).toBe(400);
  });

  it('climber has inverted Y', () => {
    expect(ARCHETYPE_TRANSFORMS.climber.invertY).toBe(true);
  });

  it('zigzag has alternating bands', () => {
    const t = ARCHETYPE_TRANSFORMS.zigzag;
    expect(t.alternateBands).toBe(true);
    expect(t.bandA).toEqual({ min: 40, max: 100 });
    expect(t.bandB).toEqual({ min: 130, max: 190 });
  });

  it('perimeter pushes to edges', () => {
    expect(ARCHETYPE_TRANSFORMS.perimeter.pushToEdges).toBe(true);
  });

  it('split bifurcates X into two clusters', () => {
    const t = ARCHETYPE_TRANSFORMS.split;
    expect(t.bifurcateX).toBe(true);
    expect(t.leftCluster).toEqual({ min: 60, max: 150 });
    expect(t.rightCluster).toEqual({ min: 280, max: 380 });
  });
});

describe('getArchetypeForWorld', () => {
  it('world 1 returns runner 100%', () => {
    // Call 100 times, all should be runner
    for (let i = 0; i < 100; i++) {
      expect(getArchetypeForWorld(1, Math.random())).toBe('runner');
    }
  });

  it('world 4 returns climber 70%, others 30%', () => {
    const results: Record<Archetype, number> = { runner: 0, diver: 0, climber: 0, zigzag: 0, perimeter: 0, split: 0, general: 0 };
    for (let i = 0; i < 1000; i++) {
      const arch = getArchetypeForWorld(4, i / 1000);
      results[arch]++;
    }
    // Climber should be ~700
    expect(results.climber).toBeGreaterThan(650);
    expect(results.climber).toBeLessThan(750);
  });

  it('world 12 returns perimeter 40%, mixed 60%', () => {
    const results: Record<Archetype, number> = { runner: 0, diver: 0, climber: 0, zigzag: 0, perimeter: 0, split: 0, general: 0 };
    for (let i = 0; i < 1000; i++) {
      const arch = getArchetypeForWorld(12, i / 1000);
      results[arch]++;
    }
    expect(results.perimeter).toBeGreaterThan(350);
    expect(results.perimeter).toBeLessThan(450);
  });
});

describe('selectArchetypeForLevel', () => {
  it('level 5 returns runner', () => {
    expect(selectArchetypeForLevel(5, 0.5)).toBe('runner');
  });

  it('level 35 prefers climber', () => {
    // With roll < 0.7, should get climber
    expect(selectArchetypeForLevel(35, 0.3)).toBe('climber');
  });

  it('level 200 can return any archetype', () => {
    const seen = new Set<Archetype>();
    for (let i = 0; i < 1000; i++) {
      seen.add(selectArchetypeForLevel(200, i / 1000));
    }
    // Should see at least 4 different archetypes
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });
});
