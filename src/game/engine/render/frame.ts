import type { Theme } from '@/game/themes';
import type { GameState } from '../types';
import { H, W, FREE_THROWS_CAP } from '@/game/constants';
import { formatZenoScore } from '@/game/leaderboard';
import { getMsUntilNextThrow, formatRegenTime } from '../throws';
import { renderFlipbookFrame } from './flipbookFrame';
import { renderNoirFrame } from './noirFrame';
import { renderDetailZoomWindow } from './overlays/detailZoom';

export function renderFrame(ctx: CanvasRenderingContext2D, state: GameState, theme: Theme, nowMs: number, dpr: number = 1) {
  const COLORS = theme;

  const shakeX = state.reduceFx ? 0 : (state.screenShake > 0.1 ? (Math.random() - 0.5) * state.screenShake : 0);
  const shakeY = state.reduceFx ? 0 : (state.screenShake > 0.1 ? (Math.random() - 0.5) * state.screenShake : 0);

  ctx.save();
  // Scale logical coordinates (480x240) to physical pixels
  ctx.scale(dpr, dpr);

  if (state.zoom > 1.01) {
    const zoomCenterX = state.zoomTargetX;
    const zoomCenterY = state.zoomTargetY;
    ctx.translate(zoomCenterX, zoomCenterY);
    ctx.scale(state.zoom, state.zoom);
    ctx.translate(-zoomCenterX, -zoomCenterY);
  }

  ctx.translate(shakeX, shakeY);

  // Switch renderer based on theme style
  if (theme.renderStyle.kind === 'noir') {
    renderNoirFrame(ctx, state, COLORS, nowMs);
  } else {
    renderFlipbookFrame(ctx, state, COLORS, nowMs);
  }

  // Hamburger menu icon - circle badge with drop shadow
  // Always show in horizontal-only mode (no landscape check needed)
  if (!state.flying && !state.sliding) {
    const menuX = 18;
    const menuY = 18;
    const radius = 14;

    ctx.save();

    // Drop shadow
    ctx.beginPath();
    ctx.arc(menuX + 2, menuY + 2, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fill();

    // Circle background
    ctx.beginPath();
    ctx.arc(menuX, menuY, radius, 0, Math.PI * 2);
    ctx.fillStyle = state.menuOpen ? theme.highlight : theme.uiBg;
    ctx.fill();
    ctx.strokeStyle = theme.accent3;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Three horizontal lines (hamburger)
    ctx.fillStyle = state.menuOpen ? theme.background : theme.accent3;
    const lineWidth = 12;
    const lineHeight = 2;
    const gap = 4;
    const startX = menuX - lineWidth / 2;
    const startY = menuY - gap - lineHeight / 2;

    for (let i = 0; i < 3; i++) {
      ctx.fillRect(startX, startY + i * gap, lineWidth, lineHeight);
    }

    ctx.restore();

    // Fullscreen toggle icon (top-right corner, below scores)
    const fsX = W - 18;
    const fsY = 58;

    ctx.save();
    ctx.fillStyle = theme.accent3;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⛶', fsX, fsY);
    ctx.restore();
  }

  // High Score & Last Score display (top-right)
  ctx.save();
  ctx.font = '8px "Comic Sans MS", cursive';
  ctx.textAlign = 'right';

  // HIGH label
  ctx.fillStyle = theme.accent3;
  ctx.fillText('HIGH', W - 8, 12);
  // HIGH value - uses Zeno precision (up to 6 decimals near edge)
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = '#0e0f69';  // Dark indigo for readability
  ctx.fillText(formatZenoScore(state.best), W - 8, 23);

  // LAST label
  ctx.font = '8px "Comic Sans MS", cursive';
  ctx.fillStyle = theme.accent3;
  ctx.fillText('LAST', W - 8, 36);
  // LAST value - uses Zeno precision (up to 6 decimals near edge)
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = '#0e0f69';  // Dark indigo for readability
  ctx.fillText(state.lastDist !== null ? formatZenoScore(state.lastDist) : '-', W - 8, 47);

  ctx.restore();

  // Throw counter & timer display (centered, below notifications) - only when not flying/sliding
  if (!state.flying && !state.sliding && !state.throwState.isPremium) {
    ctx.save();
    ctx.textAlign = 'center';

    const centerX = W / 2;  // Centered horizontally
    const topY = 32;  // Below the MiniGoalHUD notification

    // Timer for next throw (if not at cap)
    const msUntil = getMsUntilNextThrow(state.throwState);
    if (msUntil > 0 && state.throwState.freeThrows < FREE_THROWS_CAP) {
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`FREE: ${state.throwState.freeThrows}  ·  NEXT: ${formatRegenTime(msUntil)}`, centerX, topY);
    } else {
      // No timer needed - just show throws
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`FREE: ${state.throwState.freeThrows}  ·  EARNED: ${state.throwState.permanentThrows}`, centerX, topY);
    }

    // Practice mode indicator
    if (state.practiceMode) {
      ctx.fillStyle = '#fb923c';  // orange-400
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('PRACTICE MODE', centerX, topY + 12);
    }

    ctx.restore();
  }

  ctx.restore();

  // Render detail zoom window (after main render, as overlay)
  renderDetailZoomWindow(ctx, state, theme, nowMs, dpr);
}
