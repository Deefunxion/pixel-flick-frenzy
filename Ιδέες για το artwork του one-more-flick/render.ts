import { CLIFF_EDGE, H, MAX_ANGLE, MIN_ANGLE, OPTIMAL_ANGLE, W } from '@/game/constants';
import type { GameState } from './types';
import {
  drawStickFigure,
  drawFailingStickFigure,
  drawRuledLines,
  drawPaperTexture,
  drawSpiralHoles,
  drawHandLine,
  drawHandCircle,
  drawCheckeredFlag,
  drawCloud,
  drawBird,
  drawDashedCurve,
  drawFilmGrain,
  drawVignette,
  drawLayeredHandLine,
  drawLayeredHandCircle,
  drawImpactBurst,
  drawInkSplatter,
  LINE_WEIGHTS,
} from './sketchy';

export function renderFrame(ctx: CanvasRenderingContext2D, state: GameState, theme: Theme, nowMs: number) {
  const COLORS = theme;

  const shakeX = state.reduceFx ? 0 : (state.screenShake > 0.1 ? (Math.random() - 0.5) * state.screenShake : 0);
  const shakeY = state.reduceFx ? 0 : (state.screenShake > 0.1 ? (Math.random() - 0.5) * state.screenShake : 0);

  ctx.save();

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

  ctx.restore();
}

function renderFlipbookFrame(ctx: CanvasRenderingContext2D, state: GameState, COLORS: Theme, nowMs: number) {
  // Paper background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, W, H);

  // Paper texture with smudge/eraser marks
  drawPaperTexture(ctx, W, H, nowMs, state.reduceFx);

  // Ruled lines (notebook paper)
  drawRuledLines(ctx, W, H, COLORS.gridSecondary, COLORS.accent4, nowMs);

  // Spiral holes on left margin
  drawSpiralHoles(ctx, H, COLORS.accent3, nowMs);

  // Ground line - hand-drawn style with layered pencil effect
  const groundY = H - 20;
  drawLayeredHandLine(ctx, 40, groundY, CLIFF_EDGE + 5, groundY, COLORS.player, nowMs, 2);

  // Hatching under the ground for depth
  ctx.strokeStyle = COLORS.accent3;
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const hatchY = groundY + 4 + i * 3;
    const endX = CLIFF_EDGE - i * 15;
    if (endX > 50) {
      ctx.beginPath();
      ctx.moveTo(45, hatchY);
      ctx.lineTo(endX, hatchY);
      ctx.stroke();
    }
  }


  // Cliff edge - jagged hand-drawn line going down (layered for consistency)
  const edgeX = CLIFF_EDGE;
  // Layer 2: faint graphite shadow
  ctx.strokeStyle = COLORS.accent3;
  ctx.lineWidth = LINE_WEIGHTS.secondary;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.moveTo(edgeX + 1, groundY + 1);
  ctx.lineTo(edgeX + 4, groundY + 9);
  ctx.lineTo(edgeX - 1, groundY + 17);
  ctx.lineTo(edgeX + 5, groundY + 25);
  ctx.lineTo(edgeX + 1, H);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // Layer 1: primary ink
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = LINE_WEIGHTS.primary;
  ctx.beginPath();
  ctx.moveTo(edgeX, groundY);
  ctx.lineTo(edgeX + 3, groundY + 8);
  ctx.lineTo(edgeX - 2, groundY + 16);
  ctx.lineTo(edgeX + 4, groundY + 24);
  ctx.lineTo(edgeX, H);
  ctx.stroke();

  // Danger zone warning - hand-drawn exclamation (layered)
  const blink = Math.floor(nowMs / 400) % 2;
  if (blink) {
    // Exclamation line with layered effect
    drawLayeredHandLine(ctx, edgeX - 8, groundY - 30, edgeX - 8, groundY - 15, COLORS.danger, nowMs, 2);
    // Dot at bottom
    drawLayeredHandCircle(ctx, edgeX - 8, groundY - 8, 2, COLORS.danger, nowMs, 2, true);
  }

  // Best marker - checkered flag
  if (state.best > 0 && state.best <= CLIFF_EDGE) {
    const flagX = Math.floor(state.best);
    drawCheckeredFlag(ctx, flagX, groundY, 18, 14, COLORS.accent2, 1.5, nowMs);
  }

  // Zeno target marker - hand-drawn star with line (consistent LINE_WEIGHTS)
  if (state.zenoTarget > 0 && state.zenoTarget <= CLIFF_EDGE) {
    const targetX = Math.floor(state.zenoTarget);
    const pulse = Math.sin(nowMs / 300) * 2;

    // Vertical dashed line to ground (secondary weight)
    ctx.strokeStyle = COLORS.highlight;
    ctx.lineWidth = LINE_WEIGHTS.secondary;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(targetX, groundY);
    ctx.lineTo(targetX, groundY - 35);
    ctx.stroke();
    ctx.setLineDash([]);

    // Star shape with layered effect
    const starY = groundY - 42 + pulse;
    // Layer 2: faint offset
    ctx.strokeStyle = COLORS.highlight;
    ctx.lineWidth = LINE_WEIGHTS.shadow;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 144 - 90) * Math.PI / 180;
      const r = 8;