/**
 * Page Flip Rendering - 2D Slice-Based Curl Effect
 *
 * Renders the page flip animation using vertical slices with
 * warp, shadow, and highlight effects.
 */

import type { GameState } from './types';
import type { Theme } from '../themes';
import { W, H } from '../constants';
import {
  SLICE_COUNT,
  sliceT,
  easeInOutCubic,
  smoothstep,
  getSnapshotImage,
  isSnapshotReady,
  getPageFlipProgress,
  completePageFlip,
} from './pageFlip';

/**
 * Draw the "next page" background (clean paper)
 */
function drawNextPageBackground(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  dpr: number
): void {
  const scaledW = W * dpr;
  const scaledH = H * dpr;

  // Paper background
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, scaledW, scaledH);

  // Subtle ruled lines (notebook paper effect)
  ctx.strokeStyle = theme.uiText + '15'; // 15% opacity
  ctx.lineWidth = 1;

  const lineSpacing = 20 * dpr;
  const marginTop = 30 * dpr;

  for (let y = marginTop; y < scaledH - 10 * dpr; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(20 * dpr, y);
    ctx.lineTo(scaledW - 20 * dpr, y);
    ctx.stroke();
  }

  // Red margin line (left side)
  ctx.strokeStyle = '#cc666640'; // Faded red
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50 * dpr, 0);
  ctx.lineTo(50 * dpr, scaledH);
  ctx.stroke();
}

/**
 * Draw warped snapshot slices (the curling page)
 */
function drawWarpedSlices(
  ctx: CanvasRenderingContext2D,
  snapshot: HTMLImageElement,
  progress: number,
  dpr: number
): void {
  const ease = easeInOutCubic(progress);
  const imgW = snapshot.width;
  const imgH = snapshot.height;
  const scaledW = W * dpr;
  const scaledH = H * dpr;

  const sliceWidth = imgW / SLICE_COUNT;
  const destSliceWidth = scaledW / SLICE_COUNT;

  // Global page movement (sliding left)
  const xOffset = -ease * scaledW * 0.95;

  for (let i = 0; i < SLICE_COUNT; i++) {
    const t = sliceT[i];

    // Edge factor (0 = left edge, 1 = right edge)
    const edge = 1 - t;

    // Curl factor - right slices curl first
    const curl = smoothstep(0, 1, (ease - edge * 0.9) * 3);

    // Local bend (compression as it curls)
    const localBend = curl * destSliceWidth * 0.9;

    // Scale compression (slice gets narrower as it curls)
    const scaleX = 1 - curl * 0.75;

    // Vertical wobble (slight wave effect)
    const yShear = Math.sin(curl * Math.PI) * 6 * dpr;

    // Source rectangle (from snapshot)
    const sx = i * sliceWidth;
    const sy = 0;
    const sw = sliceWidth;
    const sh = imgH;

    // Destination rectangle (warped)
    const dx = i * destSliceWidth + xOffset + localBend;
    const dy = yShear;
    const dw = destSliceWidth * scaleX;
    const dh = scaledH;

    // Skip slices that are fully off-screen
    if (dx + dw < 0 || dx > scaledW) continue;

    ctx.drawImage(snapshot, sx, sy, sw, sh, dx, dy, dw, dh);
  }
}

/**
 * Draw fold shadow and specular highlight
 */
function drawFoldEffects(
  ctx: CanvasRenderingContext2D,
  progress: number,
  dpr: number
): void {
  const ease = easeInOutCubic(progress);
  const scaledW = W * dpr;
  const scaledH = H * dpr;

  // Calculate fold line position
  const xOffset = -ease * scaledW * 0.95;
  const foldX = scaledW + xOffset + (1 - ease) * (scaledW * 0.15);

  // Drop shadow (under the curling page)
  const shadowGrad = ctx.createLinearGradient(foldX - 60 * dpr, 0, foldX + 60 * dpr, 0);
  shadowGrad.addColorStop(0, 'transparent');
  shadowGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.25)');
  shadowGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.25)');
  shadowGrad.addColorStop(1, 'transparent');

  ctx.fillStyle = shadowGrad;
  ctx.fillRect(foldX - 60 * dpr, 0, 120 * dpr, scaledH);

  // Specular highlight (light catching the fold edge)
  const highlightAlpha = 0.15 * Math.sin(ease * Math.PI);
  if (highlightAlpha > 0.01) {
    const highlightGrad = ctx.createLinearGradient(foldX - 8 * dpr, 0, foldX + 8 * dpr, 0);
    highlightGrad.addColorStop(0, 'transparent');
    highlightGrad.addColorStop(0.5, `rgba(255, 255, 255, ${highlightAlpha})`);
    highlightGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = highlightGrad;
    ctx.fillRect(foldX - 8 * dpr, 0, 16 * dpr, scaledH);
  }
}

/**
 * Draw corner dog-ear effect (optional premium touch)
 */
function drawCornerDogEar(
  ctx: CanvasRenderingContext2D,
  progress: number,
  dpr: number
): void {
  if (progress < 0.1 || progress > 0.9) return;

  const ease = easeInOutCubic(progress);
  const scaledW = W * dpr;
  const xOffset = -ease * scaledW * 0.95;

  // Dog-ear size grows then shrinks
  const earSize = 15 * dpr * Math.sin(ease * Math.PI);
  const cornerX = scaledW + xOffset;
  const cornerY = 0;

  if (cornerX > scaledW || earSize < 2) return;

  // Draw folded corner triangle
  ctx.fillStyle = '#f5f5dc'; // Paper color
  ctx.beginPath();
  ctx.moveTo(cornerX, cornerY);
  ctx.lineTo(cornerX - earSize, cornerY);
  ctx.lineTo(cornerX, cornerY + earSize);
  ctx.closePath();
  ctx.fill();

  // Shadow under the fold
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  ctx.moveTo(cornerX - earSize, cornerY);
  ctx.lineTo(cornerX - earSize * 0.7, cornerY + earSize * 0.3);
  ctx.lineTo(cornerX, cornerY + earSize);
  ctx.lineTo(cornerX, cornerY);
  ctx.closePath();
  ctx.fill();
}

/**
 * Main render function for page flip transition
 *
 * @returns true if transition consumed the frame (skip normal render)
 */
export function renderPageFlip(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  theme: Theme,
  nowMs: number,
  dpr: number,
  onComplete?: () => void
): boolean {
  // Not active - don't render
  if (!state.pageFlip.active) {
    return false;
  }

  const progress = getPageFlipProgress(state, nowMs);

  // Transition complete
  if (progress >= 1) {
    completePageFlip(state);
    onComplete?.();
    return false;
  }

  // Snapshot not ready yet - wait (show frozen frame)
  if (!isSnapshotReady(state)) {
    // Early in animation, give snapshot time to load
    if (progress < 0.1) {
      return true; // Hold frame, don't render normal game
    }
    // Taking too long - abort and complete
    completePageFlip(state);
    onComplete?.();
    return false;
  }

  const snapshot = getSnapshotImage();
  if (!snapshot) {
    completePageFlip(state);
    onComplete?.();
    return false;
  }

  // Clear canvas
  ctx.clearRect(0, 0, W * dpr, H * dpr);

  // 1. Draw next page background (revealed underneath)
  drawNextPageBackground(ctx, theme, dpr);

  // 2. Draw warped snapshot slices (the curling page)
  drawWarpedSlices(ctx, snapshot, progress, dpr);

  // 3. Draw fold shadow and highlight
  drawFoldEffects(ctx, progress, dpr);

  // 4. Draw corner dog-ear (subtle premium touch)
  drawCornerDogEar(ctx, progress, dpr);

  return true; // Consumed the frame
}
