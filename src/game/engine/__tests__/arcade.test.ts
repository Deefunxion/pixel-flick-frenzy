// src/game/engine/__tests__/arcade.test.ts
import { describe, it, expect } from 'vitest';
import type { ArcadeLevel, DoodlePlacement, SpringPlacement, PortalPair } from '../arcade/types';

describe('Arcade Types', () => {
  it('should define a valid ArcadeLevel structure', () => {
    const level: ArcadeLevel = {
      id: 1,
      landingTarget: 410,
      doodles: [],
      springs: [],
      portal: null,
    };
    expect(level.id).toBe(1);
    expect(level.landingTarget).toBe(410);
  });

  it('should define doodle placement with sequence', () => {
    const doodle: DoodlePlacement = {
      x: 200,
      y: 120,
      size: 'large',
      sprite: 'paperplane',
      sequence: 1,
    };
    expect(doodle.sequence).toBe(1);
    expect(doodle.size).toBe('large');
  });

  it('should define spring with direction', () => {
    const spring: SpringPlacement = {
      x: 250,
      y: 100,
      direction: 'up-left',
    };
    expect(spring.direction).toBe('up-left');
  });

  it('should define portal pair', () => {
    const portal: PortalPair = {
      entry: { x: 100, y: 150 },
      exit: { x: 350, y: 80 },
    };
    expect(portal.entry.x).toBe(100);
    expect(portal.exit.x).toBe(350);
  });
});
