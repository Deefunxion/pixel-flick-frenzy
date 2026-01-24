import type { Theme } from '@/game/themes';
import type { GameState } from '../../types';
import { CLIFF_EDGE, H, W } from '@/game/constants';
import { renderZenoRuler } from './zenoRuler';

// Detail zoom window constants
export const DETAIL_WINDOW = {
  width: 140,      // Window width
  height: 100,     // Window height
  margin: 10,      // Margin from edge
  zoom: 2,         // Zoom multiplier (2x - shows full Zeno)
  threshold: 415,  // px threshold to show window
  focusX: 405,     // Center of zoom focus (near cliff edge)
  focusY: 210,     // Y focus (lower to show feet)
};

/**
 * Render a zoomed detail window showing the cliff edge area
 * Appears when approaching high scores (px > 415)
 */
export function renderDetailZoomWindow(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  theme: Theme,
  nowMs: number,
  dpr: number
): void {
  // Only show when approaching cliff edge during flight/slide
  if (state.px < DETAIL_WINDOW.threshold || (!state.flying && !state.sliding)) {
    return;
  }

  // Don't show if reduceFx is enabled
  if (state.reduceFx) {
    return;
  }

  const { width, height, margin, zoom, focusX, focusY } = DETAIL_WINDOW;

  // Position: bottom-right corner
  const x = W - width - margin;
  const y = H - height - margin;

  // Calculate the source area to zoom into
  const sourceWidth = width / zoom;
  const sourceHeight = height / zoom;

  // Dynamic focus - follow Zeno horizontally, keep vertical centered on ground
  const dynamicFocusX = Math.max(focusX, Math.min(state.px, CLIFF_EDGE - 5));
  const sourceX = dynamicFocusX - sourceWidth / 2;
  const sourceY = focusY - sourceHeight / 2;

  ctx.save();
  ctx.scale(dpr, dpr);

  // Draw window border/frame (sketchy style)
  const borderWidth = 3;
  const pulse = Math.sin(nowMs / 200) * 0.3 + 0.7;

  // Outer glow for emphasis
  ctx.shadowColor = theme.highlight;
  ctx.shadowBlur = 8 * pulse;

  // Border background
  ctx.fillStyle = theme.background;
  ctx.strokeStyle = theme.foreground;
  ctx.lineWidth = borderWidth;

  // Draw rounded rectangle border
  const radius = 6;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Reset shadow
  ctx.shadowBlur = 0;

  // Clip to window area
  ctx.beginPath();
  ctx.rect(x + borderWidth, y + borderWidth, width - borderWidth * 2, height - borderWidth * 2);
  ctx.clip();

  // Translate and scale to create zoom effect
  ctx.translate(x + borderWidth, y + borderWidth);
  ctx.scale(zoom, zoom);
  ctx.translate(-sourceX, -sourceY);

  // Render the scene content (simplified - just key elements)
  const groundY = H - 20;
  const ZENO_Y_OFFSET = theme.renderStyle.kind === 'noir' ? -24 : -20;
  const zenoY = state.py + ZENO_Y_OFFSET;
  const zenoX = state.px + (theme.renderStyle.kind === 'noir' ? 0 : 2);

  // Draw background snippet (ground area only for performance)
  ctx.fillStyle = theme.background;
  ctx.fillRect(sourceX - 10, sourceY - 10, sourceWidth + 20, sourceHeight + 20);

  // Draw ground line
  ctx.strokeStyle = theme.foreground;
  ctx.lineWidth = 1.5 / zoom;
  ctx.beginPath();
  ctx.moveTo(sourceX - 10, groundY);
  ctx.lineTo(CLIFF_EDGE, groundY);
  ctx.stroke();

  // Draw cliff edge
  ctx.beginPath();
  ctx.moveTo(CLIFF_EDGE, groundY);
  ctx.lineTo(CLIFF_EDGE, groundY + 30);
  ctx.lineTo(CLIFF_EDGE - 15, groundY + 30);
  ctx.stroke();

  // Draw Zeno target marker (star)
  if (state.zenoTarget > 0 && state.zenoTarget <= CLIFF_EDGE) {
    const targetX = Math.floor(state.zenoTarget);
    ctx.fillStyle = theme.highlight;
    ctx.beginPath();
    const starSize = 4;
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = targetX + Math.cos(angle) * starSize;
      const py = groundY - 8 + Math.sin(angle) * starSize;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Draw best marker (flag)
  if (state.best > 0 && state.best <= CLIFF_EDGE) {
    const flagX = Math.floor(state.best);
    ctx.strokeStyle = theme.accent1;
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    ctx.moveTo(flagX, groundY);
    ctx.lineTo(flagX, groundY - 20);
    ctx.stroke();

    // Flag
    ctx.fillStyle = theme.accent1;
    ctx.beginPath();
    ctx.moveTo(flagX, groundY - 20);
    ctx.lineTo(flagX + 8, groundY - 16);
    ctx.lineTo(flagX, groundY - 12);
    ctx.closePath();
    ctx.fill();
  }

  // Draw Zeno character (simplified stick figure in detail view)
  if (state.zenoAnimator) {
    state.zenoAnimator.draw(ctx, zenoX, zenoY, state.vx < 0);
  } else {
    // Fallback simple circle for Zeno
    ctx.fillStyle = theme.foreground;
    ctx.beginPath();
    ctx.arc(zenoX, zenoY, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Restore from zoom transform
  ctx.restore();
  ctx.save();
  ctx.scale(dpr, dpr);

  // Render Zeno Ruler (fractal ruler showing decimal precision) - only during slide
  renderZenoRuler(ctx, state.px, state.sliding, x, y, width, height, theme, nowMs);

  // "DETAIL" label (top-left corner of window)
  ctx.font = '8px "Comic Sans MS", cursive';
  ctx.textAlign = 'left';
  ctx.fillStyle = theme.foreground;
  ctx.globalAlpha = 0.7;
  ctx.fillText('DETAIL', x + 5, y - 4);
  ctx.globalAlpha = 1;

  ctx.restore();
}
