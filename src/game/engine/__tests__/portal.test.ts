// src/game/engine/__tests__/portal.test.ts
import { describe, it, expect } from 'vitest';
import {
  createPortalFromPair,
  checkPortalEntry,
  applyPortalTeleport,
  type Portal,
} from '../arcade/portal';
import type { PortalPair } from '../arcade/types';

describe('Portal System (Bidirectional)', () => {
  it('should create portal from pair', () => {
    const pair: PortalPair = {
      entry: { x: 100, y: 150 },
      exit: { x: 350, y: 80 },
    };

    const portal = createPortalFromPair(pair);
    expect(portal.aX).toBe(100);
    expect(portal.aY).toBe(150);
    expect(portal.bX).toBe(350);
    expect(portal.bY).toBe(80);
    expect(portal.usedThisThrow).toBe(false);
  });

  it('should detect entry from side A', () => {
    const portal: Portal = {
      aX: 100,
      aY: 150,
      bX: 350,
      bY: 80,
      radius: 15,
      usedThisThrow: false,
      lastUsedSide: null,
      exitDirection: 'straight',
      exitSpeed: 1.0,
      scale: 1.0,
      timing: null,
      isActive: true,
      colorId: 0,
    };

    expect(checkPortalEntry(100, 150, portal)).toBe('a');
    expect(checkPortalEntry(200, 150, portal)).toBe(null);
  });

  it('should detect entry from side B (bidirectional)', () => {
    const portal: Portal = {
      aX: 100,
      aY: 150,
      bX: 350,
      bY: 80,
      radius: 15,
      usedThisThrow: false,
      lastUsedSide: null,
      exitDirection: 'straight',
      exitSpeed: 1.0,
      scale: 1.0,
      timing: null,
      isActive: true,
      colorId: 0,
    };

    expect(checkPortalEntry(350, 80, portal)).toBe('b');
  });

  it('should not collide when already used', () => {
    const portal: Portal = {
      aX: 100,
      aY: 150,
      bX: 350,
      bY: 80,
      radius: 15,
      usedThisThrow: true,
      lastUsedSide: 'a',
      exitDirection: 'straight',
      exitSpeed: 1.0,
      scale: 1.0,
      timing: null,
      isActive: true,
      colorId: 0,
    };

    expect(checkPortalEntry(100, 150, portal)).toBe(null);
    expect(checkPortalEntry(350, 80, portal)).toBe(null);
  });

  it('should teleport from A to B', () => {
    const portal: Portal = {
      aX: 100,
      aY: 150,
      bX: 350,
      bY: 80,
      radius: 15,
      usedThisThrow: false,
      lastUsedSide: null,
      exitDirection: 'straight',
      exitSpeed: 1.0,
      scale: 1.0,
      timing: null,
      isActive: true,
      colorId: 0,
    };

    const position = { px: 100, py: 150 };
    const velocity = { vx: 5, vy: -3 };

    applyPortalTeleport(portal, 'a', position, velocity);

    expect(position.px).toBe(350);
    expect(position.py).toBe(80);
    // Exit velocity is now calculated from exitDirection and exitSpeed
    // Entering from A exits toward B (positive vx)
    expect(velocity.vx).toBeGreaterThan(0);
    expect(velocity.vy).toBe(0); // 'straight' = horizontal
    expect(portal.usedThisThrow).toBe(true);
    expect(portal.lastUsedSide).toBe('a');
  });

  it('should teleport from B to A (reverse direction)', () => {
    const portal: Portal = {
      aX: 100,
      aY: 150,
      bX: 350,
      bY: 80,
      radius: 15,
      usedThisThrow: false,
      lastUsedSide: null,
      exitDirection: 'straight',
      exitSpeed: 1.0,
      scale: 1.0,
      timing: null,
      isActive: true,
      colorId: 0,
    };

    const position = { px: 350, py: 80 };
    const velocity = { vx: -3, vy: 2 };

    applyPortalTeleport(portal, 'b', position, velocity);

    expect(position.px).toBe(100);
    expect(position.py).toBe(150);
    // Exit velocity is now calculated from exitDirection and exitSpeed
    // Entering from B exits toward A (negative vx)
    expect(velocity.vx).toBeLessThan(0);
    expect(velocity.vy).toBe(0); // 'straight' = horizontal
    expect(portal.usedThisThrow).toBe(true);
    expect(portal.lastUsedSide).toBe('b');
  });
});
