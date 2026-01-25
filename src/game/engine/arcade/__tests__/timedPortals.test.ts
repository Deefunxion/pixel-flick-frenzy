// src/game/engine/arcade/__tests__/timedPortals.test.ts
import { describe, it, expect } from 'vitest';
import {
  createPortalFromPair,
  checkPortalEntry,
  updatePortal,
  resetPortal,
  isPortalActive,
} from '../portal';
import type { PortalPair } from '../types';

describe('Timed Portals', () => {
  describe('createPortalFromPair', () => {
    it('creates portal without timing when not specified', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
      };

      const portal = createPortalFromPair(pair);

      expect(portal.timing).toBeNull();
      expect(portal.isActive).toBe(true);
    });

    it('creates portal with timing configuration', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
        timing: {
          onDuration: 2000,
          offDuration: 1000,
          offset: 500,
        },
      };

      const portal = createPortalFromPair(pair);

      expect(portal.timing).not.toBeNull();
      expect(portal.timing!.onDuration).toBe(2000);
      expect(portal.timing!.offDuration).toBe(1000);
      expect(portal.timing!.offset).toBe(500);
      expect(portal.timing!.cycleDuration).toBe(3000);
    });

    it('defaults offset to 0 when not specified', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
        timing: {
          onDuration: 1500,
          offDuration: 500,
        },
      };

      const portal = createPortalFromPair(pair);

      expect(portal.timing!.offset).toBe(0);
    });
  });

  describe('updatePortal', () => {
    it('does not affect portal without timing', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
      };
      const portal = createPortalFromPair(pair);

      updatePortal(portal, 5000);

      expect(portal.isActive).toBe(true);
    });

    it('activates portal during onDuration phase', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
        timing: { onDuration: 2000, offDuration: 1000 },
      };
      const portal = createPortalFromPair(pair);

      // At t=0, should be active (start of on phase)
      updatePortal(portal, 0);
      expect(portal.isActive).toBe(true);

      // At t=1000, should still be active (middle of on phase)
      updatePortal(portal, 1000);
      expect(portal.isActive).toBe(true);

      // At t=1999, should still be active (end of on phase)
      updatePortal(portal, 1999);
      expect(portal.isActive).toBe(true);
    });

    it('deactivates portal during offDuration phase', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
        timing: { onDuration: 2000, offDuration: 1000 },
      };
      const portal = createPortalFromPair(pair);

      // At t=2000, should be inactive (start of off phase)
      updatePortal(portal, 2000);
      expect(portal.isActive).toBe(false);

      // At t=2500, should be inactive (middle of off phase)
      updatePortal(portal, 2500);
      expect(portal.isActive).toBe(false);

      // At t=2999, should be inactive (end of off phase)
      updatePortal(portal, 2999);
      expect(portal.isActive).toBe(false);
    });

    it('cycles back to active after full cycle', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
        timing: { onDuration: 2000, offDuration: 1000 }, // cycle = 3000ms
      };
      const portal = createPortalFromPair(pair);

      // At t=3000, should be active again (new cycle)
      updatePortal(portal, 3000);
      expect(portal.isActive).toBe(true);

      // At t=6000, should be active (2 full cycles)
      updatePortal(portal, 6000);
      expect(portal.isActive).toBe(true);
    });

    it('respects offset for staggered timing', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
        timing: { onDuration: 1000, offDuration: 1000, offset: 1000 },
      };
      const portal = createPortalFromPair(pair);

      // At t=0, with offset 1000, effective time is 1000 = start of off phase
      updatePortal(portal, 0);
      expect(portal.isActive).toBe(false);

      // At t=1000, effective time is 2000 = start of new cycle = on phase
      updatePortal(portal, 1000);
      expect(portal.isActive).toBe(true);
    });

    it('handles null portal safely', () => {
      expect(() => updatePortal(null, 1000)).not.toThrow();
    });
  });

  describe('checkPortalEntry', () => {
    it('returns null when portal is inactive', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
        timing: { onDuration: 1000, offDuration: 1000 },
      };
      const portal = createPortalFromPair(pair);

      // Make portal inactive
      updatePortal(portal, 1000); // Off phase
      expect(portal.isActive).toBe(false);

      // Player at portal A position should not enter
      const result = checkPortalEntry(100, 100, portal);
      expect(result).toBeNull();
    });

    it('returns side when portal is active and in range', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
        timing: { onDuration: 1000, offDuration: 1000 },
      };
      const portal = createPortalFromPair(pair);

      // Portal is active at t=0
      updatePortal(portal, 0);
      expect(portal.isActive).toBe(true);

      const result = checkPortalEntry(100, 100, portal);
      expect(result).toBe('a');
    });

    it('returns null when portal already used this throw', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
      };
      const portal = createPortalFromPair(pair);
      portal.usedThisThrow = true;

      const result = checkPortalEntry(100, 100, portal);
      expect(result).toBeNull();
    });
  });

  describe('resetPortal', () => {
    it('resets isActive based on timing at time 0', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
        timing: { onDuration: 1000, offDuration: 1000 },
      };
      const portal = createPortalFromPair(pair);

      // Move to off phase
      updatePortal(portal, 1200);
      expect(portal.isActive).toBe(false);

      // Reset should restore to initial state at t=0
      resetPortal(portal);
      expect(portal.isActive).toBe(true);
      expect(portal.usedThisThrow).toBe(false);
      expect(portal.lastUsedSide).toBeNull();
    });

    it('respects offset when resetting', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
        timing: { onDuration: 1000, offDuration: 1000, offset: 1000 },
      };
      const portal = createPortalFromPair(pair);

      // With offset 1000, at t=0 the portal starts in off phase
      resetPortal(portal);
      expect(portal.isActive).toBe(false);
    });

    it('handles null portal safely', () => {
      expect(() => resetPortal(null)).not.toThrow();
    });
  });

  describe('isPortalActive', () => {
    it('returns true for active, unused portal', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
      };
      const portal = createPortalFromPair(pair);

      expect(isPortalActive(portal)).toBe(true);
    });

    it('returns false for used portal', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
      };
      const portal = createPortalFromPair(pair);
      portal.usedThisThrow = true;

      expect(isPortalActive(portal)).toBe(false);
    });

    it('returns false for inactive timed portal', () => {
      const pair: PortalPair = {
        entry: { x: 100, y: 100 },
        exit: { x: 300, y: 50 },
        timing: { onDuration: 1000, offDuration: 1000 },
      };
      const portal = createPortalFromPair(pair);

      updatePortal(portal, 1200); // Off phase
      expect(isPortalActive(portal)).toBe(false);
    });

    it('returns false for null portal', () => {
      expect(isPortalActive(null)).toBe(false);
    });
  });
});
