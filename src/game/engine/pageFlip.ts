/**
 * Page Flip Transition - "Notebook Page Turn" Effect
 *
 * Captures canvas snapshot at throw end and animates a 2D page curl
 * before resetting for the next throw.
 */

import type { GameState } from './types';

// Configuration
const SLICE_COUNT = 32; // Balance of quality vs performance
const DEFAULT_DURATION_MS = 450;

// Precomputed slice data (avoid allocations in render loop)
const sliceT: number[] = [];
for (let i = 0; i < SLICE_COUNT; i++) {
  sliceT[i] = i / (SLICE_COUNT - 1);
}

// Snapshot storage (module-level to avoid state serialization issues)
let snapshotImage: HTMLImageElement | null = null;
let snapshotLoading = false;

/**
 * Easing function for natural page feel
 */
function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Smoothstep for curl progression
 */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Capture current canvas as snapshot for page flip
 */
export function captureSnapshot(canvas: HTMLCanvasElement): Promise<boolean> {
  return new Promise((resolve) => {
    if (snapshotLoading) {
      resolve(false);
      return;
    }

    // Validate canvas
    if (!canvas || !canvas.getContext) {
      resolve(false);
      return;
    }

    snapshotLoading = true;

    try {
      const url = canvas.toDataURL('image/png');
      const img = new Image();

      img.onload = () => {
        snapshotImage = img;
        snapshotLoading = false;
        resolve(true);
      };

      img.onerror = () => {
        snapshotImage = null;
        snapshotLoading = false;
        resolve(false);
      };

      img.src = url;
    } catch (e) {
      snapshotLoading = false;
      resolve(false);
    }
  });
}

/**
 * Start the page flip transition
 */
export function startPageFlip(
  state: GameState,
  canvas: HTMLCanvasElement,
  nowMs: number,
  direction: 'left' | 'right' = 'left'
): void {
  // Respect accessibility setting
  if (state.reduceFx) {
    return;
  }

  // Set state BEFORE async capture to prevent race condition
  state.pageFlip.active = true;
  state.pageFlip.startMs = nowMs;
  state.pageFlip.durationMs = DEFAULT_DURATION_MS;
  state.pageFlip.direction = direction;
  state.pageFlip.snapshotReady = false;

  // Capture snapshot asynchronously
  captureSnapshot(canvas)
    .then((success) => {
      if (success) {
        state.pageFlip.snapshotReady = true;
      }
    })
    .catch(() => {
      // Snapshot failed - animation will abort gracefully in renderer
    });
}

/**
 * Check if page flip is currently animating
 */
export function isPageFlipActive(state: GameState): boolean {
  return state.pageFlip.active;
}

/**
 * Get current progress (0-1)
 */
export function getPageFlipProgress(state: GameState, nowMs: number): number {
  if (!state.pageFlip.active) return 0;
  const elapsed = nowMs - state.pageFlip.startMs;
  return Math.min(1, Math.max(0, elapsed / state.pageFlip.durationMs));
}

/**
 * Complete the page flip (call when animation ends)
 */
export function completePageFlip(state: GameState): void {
  state.pageFlip.active = false;
  state.pageFlip.snapshotReady = false;
  snapshotImage = null;
}

/**
 * Get the snapshot image (for rendering)
 */
export function getSnapshotImage(): HTMLImageElement | null {
  return snapshotImage;
}

/**
 * Check if snapshot is ready for rendering
 */
export function isSnapshotReady(state: GameState): boolean {
  return state.pageFlip.snapshotReady && snapshotImage !== null;
}

/**
 * Cleanup function for component unmount
 */
export function disposePageFlip(): void {
  snapshotImage = null;
  snapshotLoading = false;
}

// Export for use in render module
export { SLICE_COUNT, sliceT, easeInOutCubic, smoothstep };
