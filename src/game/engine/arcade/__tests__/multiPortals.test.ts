// src/game/engine/arcade/__tests__/multiPortals.test.ts
import { describe, it, expect } from 'vitest';
import {
  createPortalFromPair,
  createPortalsFromLevel,
  checkMultiPortalEntry,
  updatePortals,
  resetPortals,
  applyPortalTeleport,
} from '../portal';
import type { PortalPair } from '../types';

describe('Multi-Portals', () => {
  describe('createPortalFromPair with colorId', () => {
    it('uses colorId from pair when specified', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
        colorId: 3,
      };

      const portal = createPortalFromPair(pair);

      expect(portal.colorId).toBe(3);
    });

    it('uses default colorId when not specified', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
      };

      const portal = createPortalFromPair(pair, 2);

      expect(portal.colorId).toBe(2);
    });

    it('defaults to colorId 0 when no default provided', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
      };

      const portal = createPortalFromPair(pair);

      expect(portal.colorId).toBe(0);
    });
  });

  describe('createPortalsFromLevel', () => {
    it('creates empty array when no portals', () => {
      const portals = createPortalsFromLevel(null, undefined);

      expect(portals).toHaveLength(0);
    });

    it('creates single portal from portal field (backward compatible)', () => {
      const singlePortal: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
      };

      const portals = createPortalsFromLevel(singlePortal, undefined);

      expect(portals).toHaveLength(1);
      expect(portals[0].aX).toBe(100);
      expect(portals[0].colorId).toBe(0);
    });

    it('creates multiple portals from portals array', () => {
      const portalPairs: PortalPair[] = [
        { entry: { x: 100, y: 100 }, exit: { x: 150, y: 50 } },
        { entry: { x: 200, y: 100 }, exit: { x: 250, y: 50 } },
        { entry: { x: 300, y: 100 }, exit: { x: 350, y: 50 } },
      ];

      const portals = createPortalsFromLevel(null, portalPairs);

      expect(portals).toHaveLength(3);
      expect(portals[0].colorId).toBe(0);
      expect(portals[1].colorId).toBe(1);
      expect(portals[2].colorId).toBe(2);
    });

    it('uses colorId from placement when specified', () => {
      const portalPairs: PortalPair[] = [
        { entry: { x: 100, y: 100 }, exit: { x: 150, y: 50 }, colorId: 5 },
        { entry: { x: 200, y: 100 }, exit: { x: 250, y: 50 }, colorId: 3 },
      ];

      const portals = createPortalsFromLevel(null, portalPairs);

      expect(portals[0].colorId).toBe(5);
      expect(portals[1].colorId).toBe(3);
    });

    it('combines single portal and portals array', () => {
      const singlePortal: PortalPair = {
        entry: { x: 50, y: 100 },
        exit: { x: 80, y: 50 },
      };
      const portalPairs: PortalPair[] = [
        { entry: { x: 100, y: 100 }, exit: { x: 150, y: 50 } },
        { entry: { x: 200, y: 100 }, exit: { x: 250, y: 50 } },
      ];

      const portals = createPortalsFromLevel(singlePortal, portalPairs);

      expect(portals).toHaveLength(3);
      // Single portal comes first
      expect(portals[0].aX).toBe(50);
      expect(portals[1].aX).toBe(100);
      expect(portals[2].aX).toBe(200);
    });
  });

  describe('checkMultiPortalEntry', () => {
    it('returns null when no portals match', () => {
      const portals = createPortalsFromLevel(null, [
        { entry: { x: 100, y: 100 }, exit: { x: 150, y: 50 } },
        { entry: { x: 200, y: 100 }, exit: { x: 250, y: 50 } },
      ]);

      const result = checkMultiPortalEntry(50, 50, portals);

      expect(result).toBeNull();
    });

    it('returns correct portal and side when player enters first portal', () => {
      const portals = createPortalsFromLevel(null, [
        { entry: { x: 100, y: 100 }, exit: { x: 150, y: 50 } },
        { entry: { x: 200, y: 100 }, exit: { x: 250, y: 50 } },
      ]);

      const result = checkMultiPortalEntry(100, 100, portals);

      expect(result).not.toBeNull();
      expect(result?.portal.aX).toBe(100);
      expect(result?.side).toBe('a');
    });

    it('returns correct portal and side when player enters second portal', () => {
      const portals = createPortalsFromLevel(null, [
        { entry: { x: 100, y: 100 }, exit: { x: 150, y: 50 } },
        { entry: { x: 200, y: 100 }, exit: { x: 250, y: 50 } },
      ]);

      const result = checkMultiPortalEntry(200, 100, portals);

      expect(result).not.toBeNull();
      expect(result?.portal.aX).toBe(200);
      expect(result?.side).toBe('a');
    });

    it('returns correct side when entering exit side', () => {
      const portals = createPortalsFromLevel(null, [
        { entry: { x: 100, y: 100 }, exit: { x: 150, y: 50 } },
      ]);

      const result = checkMultiPortalEntry(150, 50, portals);

      expect(result).not.toBeNull();
      expect(result?.side).toBe('b');
    });

    it('skips used portals', () => {
      const portals = createPortalsFromLevel(null, [
        { entry: { x: 100, y: 100 }, exit: { x: 150, y: 50 } },
        { entry: { x: 200, y: 100 }, exit: { x: 250, y: 50 } },
      ]);

      // Mark first portal as used
      portals[0].usedThisThrow = true;

      // Player at first portal position should not enter (already used)
      const result = checkMultiPortalEntry(100, 100, portals);
      expect(result).toBeNull();

      // Player at second portal should still work
      const result2 = checkMultiPortalEntry(200, 100, portals);
      expect(result2).not.toBeNull();
    });
  });

  describe('updatePortals', () => {
    it('updates timing for all portals', () => {
      const portals = createPortalsFromLevel(null, [
        {
          entry: { x: 100, y: 100 },
          exit: { x: 150, y: 50 },
          timing: { onDuration: 1000, offDuration: 1000 },
        },
        {
          entry: { x: 200, y: 100 },
          exit: { x: 250, y: 50 },
          timing: { onDuration: 500, offDuration: 500, offset: 500 },
        },
      ]);

      // At t=0, first portal active, second inactive (due to offset)
      updatePortals(portals, 0);
      expect(portals[0].isActive).toBe(true);
      expect(portals[1].isActive).toBe(false);

      // At t=500, first still active, second now active
      updatePortals(portals, 500);
      expect(portals[0].isActive).toBe(true);
      expect(portals[1].isActive).toBe(true);
    });
  });

  describe('resetPortals', () => {
    it('resets all portals', () => {
      const portals = createPortalsFromLevel(null, [
        { entry: { x: 100, y: 100 }, exit: { x: 150, y: 50 } },
        { entry: { x: 200, y: 100 }, exit: { x: 250, y: 50 } },
      ]);

      // Use both portals
      portals[0].usedThisThrow = true;
      portals[1].usedThisThrow = true;

      resetPortals(portals);

      expect(portals[0].usedThisThrow).toBe(false);
      expect(portals[1].usedThisThrow).toBe(false);
    });
  });

  describe('multi-portal teleportation', () => {
    it('teleports within correct portal pair', () => {
      const portals = createPortalsFromLevel(null, [
        { entry: { x: 100, y: 100 }, exit: { x: 150, y: 50 } },
        { entry: { x: 200, y: 100 }, exit: { x: 250, y: 50 } },
      ]);

      const position = { px: 100, py: 100 };
      const velocity = { vx: 5, vy: 2 };

      // Enter first portal
      applyPortalTeleport(portals[0], 'a', position, velocity);

      // Should teleport to first portal's exit (150, 50)
      expect(position.px).toBe(150);
      expect(position.py).toBe(50);
      expect(portals[0].usedThisThrow).toBe(true);
      expect(portals[1].usedThisThrow).toBe(false);
    });
  });
});
