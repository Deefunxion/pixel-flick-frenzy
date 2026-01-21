import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  startPageFlip,
  isPageFlipActive,
  getPageFlipProgress,
  completePageFlip,
} from '../pageFlip';
import { createInitialState } from '../state';
import type { GameState } from '../types';

describe('PageFlip', () => {
  let state: GameState;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    state = createInitialState({ reduceFx: false });

    // Mock canvas
    mockCanvas = {
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test'),
      width: 480,
      height: 240,
      getContext: vi.fn().mockReturnValue({}),
    } as unknown as HTMLCanvasElement;
  });

  describe('startPageFlip', () => {
    it('should activate page flip when reduceFx is false', () => {
      state.reduceFx = false;
      startPageFlip(state, mockCanvas, 1000);

      expect(state.pageFlip.active).toBe(true);
      expect(state.pageFlip.startMs).toBe(1000);
    });

    it('should not activate page flip when reduceFx is true', () => {
      state.reduceFx = true;
      startPageFlip(state, mockCanvas, 1000);

      expect(state.pageFlip.active).toBe(false);
    });

    it('should set default direction to left', () => {
      state.reduceFx = false;
      startPageFlip(state, mockCanvas, 1000);

      expect(state.pageFlip.direction).toBe('left');
    });

    it('should accept custom direction', () => {
      state.reduceFx = false;
      startPageFlip(state, mockCanvas, 1000, 'right');

      expect(state.pageFlip.direction).toBe('right');
    });
  });

  describe('isPageFlipActive', () => {
    it('should return true when active', () => {
      state.pageFlip.active = true;
      expect(isPageFlipActive(state)).toBe(true);
    });

    it('should return false when inactive', () => {
      state.pageFlip.active = false;
      expect(isPageFlipActive(state)).toBe(false);
    });
  });

  describe('getPageFlipProgress', () => {
    it('should return 0 when not active', () => {
      state.pageFlip.active = false;
      expect(getPageFlipProgress(state, 1000)).toBe(0);
    });

    it('should return 0 at start', () => {
      state.pageFlip.active = true;
      state.pageFlip.startMs = 1000;
      state.pageFlip.durationMs = 450;

      expect(getPageFlipProgress(state, 1000)).toBe(0);
    });

    it('should return 0.5 at midpoint', () => {
      state.pageFlip.active = true;
      state.pageFlip.startMs = 1000;
      state.pageFlip.durationMs = 450;

      expect(getPageFlipProgress(state, 1225)).toBeCloseTo(0.5, 1);
    });

    it('should return 1 at end', () => {
      state.pageFlip.active = true;
      state.pageFlip.startMs = 1000;
      state.pageFlip.durationMs = 450;

      expect(getPageFlipProgress(state, 1450)).toBe(1);
    });

    it('should clamp progress to 1', () => {
      state.pageFlip.active = true;
      state.pageFlip.startMs = 1000;
      state.pageFlip.durationMs = 450;

      expect(getPageFlipProgress(state, 2000)).toBe(1);
    });
  });

  describe('completePageFlip', () => {
    it('should deactivate page flip', () => {
      state.pageFlip.active = true;
      state.pageFlip.snapshotReady = true;

      completePageFlip(state);

      expect(state.pageFlip.active).toBe(false);
      expect(state.pageFlip.snapshotReady).toBe(false);
    });
  });
});
