// src/game/engine/__tests__/routes.test.ts
import { describe, it, expect } from 'vitest';
import {
  createRoute,
  checkRouteNodeProgress,
  isRouteComplete,
  getRouteFailReason,
  type Route,
  type RouteNode,
} from '../routes';

describe('Routes System', () => {
  describe('checkRouteNodeProgress', () => {
    it('advances to next node when current node completed', () => {
      const route = createRoute([
        { kind: 'ring', x: 150, y: 100 },
        { kind: 'ring', x: 300, y: 120 },
      ]);

      const result = checkRouteNodeProgress(route, 0, 'ring', 150, 100);

      expect(result.advanced).toBe(true);
      expect(result.newIndex).toBe(1);
    });

    it('fails if node completed out of order', () => {
      const route = createRoute([
        { kind: 'ring', x: 150, y: 100 },
        { kind: 'ring', x: 300, y: 120 },
      ]);

      const result = checkRouteNodeProgress(route, 0, 'ring', 300, 120);

      expect(result.advanced).toBe(false);
      expect(result.failed).toBe(true);
      expect(result.failReason).toBe('Wrong order');
    });

    it('handles bounce nodes', () => {
      const route = createRoute([
        { kind: 'ring', x: 150, y: 100 },
        { kind: 'bounce', x: 200, y: 80 },
      ]);

      // Complete first node
      checkRouteNodeProgress(route, 0, 'ring', 150, 100);

      // Complete bounce
      const result = checkRouteNodeProgress(route, 1, 'bounce', 200, 80);
      expect(result.advanced).toBe(true);
    });
  });

  describe('isRouteComplete', () => {
    it('returns true when all nodes completed', () => {
      const route = createRoute([{ kind: 'ring', x: 150, y: 100 }]);
      route.currentIndex = 1;

      expect(isRouteComplete(route)).toBe(true);
    });

    it('returns false when nodes remain', () => {
      const route = createRoute([
        { kind: 'ring', x: 150, y: 100 },
        { kind: 'ring', x: 300, y: 120 },
      ]);
      route.currentIndex = 1;

      expect(isRouteComplete(route)).toBe(false);
    });
  });

  describe('getRouteFailReason', () => {
    it('returns null when route not failed', () => {
      const route = createRoute([{ kind: 'ring', x: 150, y: 100 }]);
      expect(getRouteFailReason(route)).toBeNull();
    });

    it('returns fail reason when route failed', () => {
      const route = createRoute([
        { kind: 'ring', x: 150, y: 100 },
        { kind: 'ring', x: 300, y: 120 },
      ]);

      // Trigger failure by completing wrong node
      checkRouteNodeProgress(route, 0, 'ring', 300, 120);

      expect(getRouteFailReason(route)).toBe('Wrong order');
    });
  });
});
