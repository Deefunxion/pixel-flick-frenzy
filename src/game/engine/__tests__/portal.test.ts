// src/game/engine/__tests__/portal.test.ts
import { describe, it, expect } from 'vitest';
import {
  createPortalFromPair,
  checkPortalEntry,
  applyPortalTeleport,
  type Portal,
} from '../arcade/portal';
import type { PortalPair } from '../arcade/types';

describe('Portal System', () => {
  it('should create portal from pair', () => {
    const pair: PortalPair = {
      entry: { x: 100, y: 150 },
      exit: { x: 350, y: 80 },
    };

    const portal = createPortalFromPair(pair);
    expect(portal.entryX).toBe(100);
    expect(portal.exitX).toBe(350);
    expect(portal.usedThisThrow).toBe(false);
  });

  it('should detect entry collision', () => {
    const portal: Portal = {
      entryX: 100,
      entryY: 150,
      exitX: 350,
      exitY: 80,
      radius: 15,
      usedThisThrow: false,
    };

    expect(checkPortalEntry(100, 150, portal)).toBe(true);
    expect(checkPortalEntry(200, 150, portal)).toBe(false);
  });

  it('should not collide when already used', () => {
    const portal: Portal = {
      entryX: 100,
      entryY: 150,
      exitX: 350,
      exitY: 80,
      radius: 15,
      usedThisThrow: true,
    };

    expect(checkPortalEntry(100, 150, portal)).toBe(false);
  });

  it('should teleport player to exit', () => {
    const portal: Portal = {
      entryX: 100,
      entryY: 150,
      exitX: 350,
      exitY: 80,
      radius: 15,
      usedThisThrow: false,
    };

    const position = { px: 100, py: 150 };
    const velocity = { vx: 5, vy: -3 };

    applyPortalTeleport(portal, position, velocity);

    expect(position.px).toBe(350);
    expect(position.py).toBe(80);
    expect(velocity.vx).toBe(5); // Preserved
    expect(velocity.vy).toBe(-3); // Preserved
    expect(portal.usedThisThrow).toBe(true);
  });
});
