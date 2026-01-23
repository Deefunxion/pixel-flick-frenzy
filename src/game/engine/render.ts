import type { Theme } from '@/game/themes';
import { CLIFF_EDGE, H, MAX_ANGLE, MIN_ANGLE, OPTIMAL_ANGLE, W, BASE_GRAV, MIN_POWER, MAX_POWER } from '@/game/constants';
import type { GameState } from './types';
import { backgroundRenderer } from './backgroundRenderer';
import { noirBackgroundRenderer } from './noirBackgroundRenderer';
import {
  drawStickFigure,
  drawFailingStickFigure,
  drawHandLine,
  drawHandCircle,
  drawBird,
  drawDashedCurve,
  drawFilmGrain,
  drawVignette,
  drawZenoCoil,
  drawZenoBolt,
  drawZenoImpact,
  drawDecorativeCurl,
  drawStyledTrajectory,
  LINE_WEIGHTS,
} from './sketchy';
import { drawPrecisionBar } from './precisionRender';
import { drawRings } from './ringsRender';
import { updateRingPosition } from './rings';
import type { RingJuicePopup } from './ringJuice';
// TODO: Import sprite-based effects when assets are ready
// import { renderParticles } from './particles';

/**
 * Render ring juice text popups ("Nice!", "Great!", "PERFECT!")
 * Popups rise and fade out over time
 */
function renderRingPopups(
  ctx: CanvasRenderingContext2D,
  popups: RingJuicePopup[]
): void {
  for (const popup of popups) {
    ctx.save();
    ctx.globalAlpha = popup.opacity;
    ctx.translate(popup.x, popup.y);
    ctx.scale(popup.scale, popup.scale);

    // Draw text with outline for visibility
    ctx.font = 'bold 14px "Comic Sans MS", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(popup.text, 0, 0);

    // Fill
    ctx.fillStyle = popup.color;
    ctx.fillText(popup.text, 0, 0);

    ctx.restore();
  }
}

/**
 * Render screen edge glow effect when collecting multiple rings
 */
function renderEdgeGlow(
  ctx: CanvasRenderingContext2D,
  intensity: number,
  width: number,
  height: number
): void {
  if (intensity <= 0) return;

  // Left edge glow
  const leftGradient = ctx.createLinearGradient(0, 0, 30, 0);
  leftGradient.addColorStop(0, `rgba(255, 215, 0, ${intensity * 0.4})`);
  leftGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = leftGradient;
  ctx.fillRect(0, 0, 30, height);

  // Right edge glow (mirror)
  const rightGradient = ctx.createLinearGradient(width - 30, 0, width, 0);
  rightGradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
  rightGradient.addColorStop(1, `rgba(255, 215, 0, ${intensity * 0.4})`);
  ctx.fillStyle = rightGradient;
  ctx.fillRect(width - 30, 0, 30, height);
}

/**
 * Render near-miss spotlight effect
 * Vignette that focuses on target zone
 */
function renderNearMissSpotlight(
  ctx: CanvasRenderingContext2D,
  targetX: number,
  intensity: 'extreme' | 'close' | 'near',
  width: number,
  height: number
): void {
  // Dimming intensity based on near-miss level
  const dimAmount = intensity === 'extreme' ? 0.5
                  : intensity === 'close' ? 0.4
                  : 0.3;

  // Create radial gradient centered on target
  const gradient = ctx.createRadialGradient(
    targetX, height - 30,  // Target position
    30,  // Inner radius (bright)
    targetX, height - 30,
    150  // Outer radius (dim)
  );

  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');  // Clear center
  gradient.addColorStop(0.5, `rgba(0, 0, 0, ${dimAmount * 0.5})`);
  gradient.addColorStop(1, `rgba(0, 0, 0, ${dimAmount})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Glow on target zone
  const glowGradient = ctx.createRadialGradient(
    targetX, height - 30, 0,
    targetX, height - 30, 40
  );
  glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
  glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

  ctx.fillStyle = glowGradient;
  ctx.fillRect(targetX - 50, height - 80, 100, 100);
}

/**
 * Render ON FIRE mode visual effects
 * - Warm background tint
 * - Flame border effect at bottom of screen
 */
function renderOnFireMode(
  ctx: CanvasRenderingContext2D,
  intensity: number,  // sessionHeat / 100
  width: number,
  height: number
): void {
  // Warm background tint
  ctx.fillStyle = `rgba(255, 100, 0, ${intensity * 0.1})`;
  ctx.fillRect(0, 0, width, height);

  // Flame border effect at bottom
  const gradient = ctx.createLinearGradient(0, height, 0, height - 40);
  gradient.addColorStop(0, `rgba(255, 100, 0, ${intensity * 0.3})`);
  gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, height - 40, width, 40);
}

/**
 * Render charge glow around Zeno during charge
 */
function renderChargeGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  intensity: number  // 0-1
): void {
  if (intensity <= 0) return;

  const radius = 30 + intensity * 20;  // 30-50px
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

  gradient.addColorStop(0, `rgba(255, 215, 0, ${intensity * 0.4})`);
  gradient.addColorStop(0.5, `rgba(255, 165, 0, ${intensity * 0.2})`);
  gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

/**
 * Render charge vignette (subtle edge darkening)
 */
function renderChargeVignette(
  ctx: CanvasRenderingContext2D,
  intensity: number,
  width: number,
  height: number
): void {
  if (intensity <= 0) return;

  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, height * 0.3,
    width / 2, height / 2, height * 0.8
  );

  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity * 0.3})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw stamina bar above Zeno.
 * - Hidden when stamina = 100
 * - Green > 50, Yellow 25-50, Red < 25
 * - Flashes when < 25
 */
function drawStaminaBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  stamina: number,
  nowMs: number,
  COLORS: Theme,
  shakeAmount: number = 0
) {
  // Hidden when full
  if (stamina >= 100) return;

  const barWidth = 40;
  const barHeight = 6;

  // Apply shake offset for denied action feedback
  const shakeX = shakeAmount > 0 ? (Math.random() - 0.5) * shakeAmount : 0;
  const shakeY = shakeAmount > 0 ? (Math.random() - 0.5) * shakeAmount : 0;

  const barX = x - barWidth / 2 + shakeX;
  const barY = y - 12 + shakeY;

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Fill color based on stamina level
  let fillColor: string;
  if (stamina > 50) {
    fillColor = '#22c55e'; // Green
  } else if (stamina > 25) {
    fillColor = '#eab308'; // Yellow
  } else {
    fillColor = '#ef4444'; // Red
    // Pulsing glow effect when low (Task 8.2)
    const pulseAlpha = 0.3 + Math.sin(nowMs * 0.01) * 0.2;
    ctx.save();
    ctx.shadowColor = 'red';
    ctx.shadowBlur = 8;
    ctx.fillStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
    ctx.fillRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);
    ctx.restore();
  }

  // Fill bar
  const fillWidth = (stamina / 100) * (barWidth - 2);
  ctx.fillStyle = fillColor;
  ctx.fillRect(barX + 1, barY + 1, fillWidth, barHeight - 2);

  // Border
  ctx.strokeStyle = COLORS.accent3;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Stamina number (small)
  ctx.fillStyle = COLORS.uiText;
  ctx.font = '7px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(Math.floor(stamina).toString(), barX + barWidth + 12, barY + 5);
}

/**
 * Draw Zeno using sprite animation if available, otherwise fall back to procedural.
 * Returns true if sprite was drawn, false if fallback is needed.
 */
function drawZenoSprite(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  x: number,
  y: number
): boolean {
  if (!state.zenoAnimator || !state.zenoAnimator.isReady()) {
    return false;
  }

  // Safety check for invalid positions (NaN, Infinity) - fallback to procedural
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    console.warn('[Render] Invalid sprite position:', x, y);
    return false;
  }

  // Determine if we need to flip based on velocity
  const flipH = state.vx < -0.5;

  state.zenoAnimator.draw(ctx, x, y, flipH);
  return true;
}

// Detail zoom window constants
const DETAIL_WINDOW = {
  width: 140,      // Window width
  height: 100,     // Window height
  margin: 10,      // Margin from edge
  zoom: 2,         // Zoom multiplier (2x - shows full Zeno)
  threshold: 415,  // px threshold to show window
  focusX: 405,     // Center of zoom focus (near cliff edge)
  focusY: 210,     // Y focus (lower to show feet)
};

// Zeno Ruler constants
const ZENO_RULER = {
  height: 24,      // Ruler height in pixels
  tickCount: 10,   // Number of tick marks per level
  threshold: 419,  // Position threshold to show ruler
};

/**
 * Calculate the current decimal level and bounds for Zeno's position
 * Level 0: 419.0 - 420.0 (tenths)
 * Level 1: 419.9 - 420.0 (hundredths)
 * Level 2: 419.99 - 420.0 (thousandths)
 * etc.
 */
function getZenoRulerLevel(px: number): { level: number; lowerBound: number; progress: number } {
  if (px < 419) {
    return { level: 0, lowerBound: 419, progress: 0 };
  }

  const upperBound = 420;
  let level = 0;
  let lowerBound = 419;

  // Find the deepest level where px has passed the 90% mark
  while (level < 6) { // Max 6 levels (419.999999)
    const nextThreshold = upperBound - (upperBound - lowerBound) * 0.1;
    if (px >= nextThreshold) {
      lowerBound = nextThreshold;
      level++;
    } else {
      break;
    }
  }

  const range = upperBound - lowerBound;
  const progress = range > 0 ? (px - lowerBound) / range : 0;

  return { level, lowerBound, progress };
}

/**
 * Format a number for the Zeno ruler display
 */
function formatRulerLabel(value: number, level: number): string {
  const decimals = Math.max(1, level + 1);
  return value.toFixed(decimals);
}

/**
 * Render the Zeno Paradox ruler - a fractal ruler that "grows" as you approach 420
 * The ruler zooms in as Zeno passes each decimal threshold
 */
function renderZenoRuler(
  ctx: CanvasRenderingContext2D,
  px: number,
  isSliding: boolean,
  windowX: number,
  windowY: number,
  windowWidth: number,
  windowHeight: number,
  theme: Theme,
  nowMs: number
): void {
  // Only show during sliding, not flying
  if (px < ZENO_RULER.threshold || !isSliding) {
    return;
  }

  const { height: rulerHeight, tickCount } = ZENO_RULER;
  const { level, lowerBound, progress } = getZenoRulerLevel(px);
  const upperBound = 420;

  // Ruler position (at bottom of detail window)
  const rulerY = windowY + windowHeight - rulerHeight - 4;
  const rulerX = windowX + 8;
  const rulerWidth = windowWidth - 16;

  // Background for ruler
  ctx.fillStyle = theme.renderStyle.kind === 'noir'
    ? 'rgba(0, 0, 0, 0.8)'
    : 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(rulerX - 2, rulerY - 2, rulerWidth + 4, rulerHeight + 4);

  // Ruler base line
  ctx.strokeStyle = theme.foreground;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rulerX, rulerY + rulerHeight - 8);
  ctx.lineTo(rulerX + rulerWidth, rulerY + rulerHeight - 8);
  ctx.stroke();

  // Tick marks
  const tickSpacing = rulerWidth / tickCount;
  for (let i = 0; i <= tickCount; i++) {
    const tickX = rulerX + i * tickSpacing;
    const isMajor = i === 0 || i === tickCount || i === 5;
    const tickHeight = isMajor ? 8 : 4;

    ctx.strokeStyle = theme.foreground;
    ctx.lineWidth = isMajor ? 1.5 : 0.8;
    ctx.beginPath();
    ctx.moveTo(tickX, rulerY + rulerHeight - 8);
    ctx.lineTo(tickX, rulerY + rulerHeight - 8 - tickHeight);
    ctx.stroke();
  }

  // Zeno's toe marker (triangle pointing down)
  const toeX = rulerX + progress * rulerWidth;
  const toeY = rulerY + rulerHeight - 10;

  // Pulsing glow effect
  const pulse = Math.sin(nowMs / 150) * 0.3 + 0.7;
  ctx.shadowColor = theme.highlight;
  ctx.shadowBlur = 6 * pulse;

  // Toe marker triangle
  ctx.fillStyle = theme.highlight;
  ctx.beginPath();
  ctx.moveTo(toeX, toeY);
  ctx.lineTo(toeX - 4, toeY - 6);
  ctx.lineTo(toeX + 4, toeY - 6);
  ctx.closePath();
  ctx.fill();

  // Vertical line from toe
  ctx.strokeStyle = theme.highlight;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(toeX, toeY - 6);
  ctx.lineTo(toeX, rulerY + 2);
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Labels
  ctx.font = '7px monospace';
  ctx.textBaseline = 'top';

  // Left label (lower bound)
  ctx.textAlign = 'left';
  ctx.fillStyle = theme.foreground;
  ctx.fillText(formatRulerLabel(lowerBound, level), rulerX, rulerY);

  // Right label (420)
  ctx.textAlign = 'right';
  ctx.fillStyle = theme.danger || '#ff4444';
  ctx.fillText(formatRulerLabel(upperBound, level), rulerX + rulerWidth, rulerY);

  // Level indicator (∞ symbol gets bigger with level)
  if (level > 0) {
    ctx.textAlign = 'center';
    ctx.font = `${8 + level}px serif`;
    ctx.fillStyle = theme.highlight;
    const infinitySymbol = '∞'.repeat(Math.min(level, 3));
    ctx.fillText(infinitySymbol, rulerX + rulerWidth / 2, rulerY - 1);
  }

  // Current position label (above the toe)
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = theme.highlight;
  const posLabel = px.toFixed(Math.min(level + 2, 6));
  ctx.fillText(posLabel, toeX, rulerY + 2);
}

/**
 * Render a zoomed detail window showing the cliff edge area
 * Appears when approaching high scores (px > 415)
 */
function renderDetailZoomWindow(
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
  }

  // High Score & Last Score display (top-right)
  ctx.save();
  ctx.font = '8px "Comic Sans MS", cursive';
  ctx.textAlign = 'right';

  // HIGH label
  ctx.fillStyle = theme.accent3;
  ctx.fillText('HIGH', W - 8, 12);
  // HIGH value
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = theme.highlight;
  ctx.fillText(state.best.toFixed(2), W - 8, 23);

  // LAST label
  ctx.font = '8px "Comic Sans MS", cursive';
  ctx.fillStyle = theme.accent3;
  ctx.fillText('LAST', W - 8, 36);
  // LAST value
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = theme.accent1;
  ctx.fillText(state.lastDist !== null ? state.lastDist.toFixed(2) : '-', W - 8, 47);

  ctx.restore();

  ctx.restore();

  // Render detail zoom window (after main render, as overlay)
  renderDetailZoomWindow(ctx, state, theme, nowMs, dpr);
}

function renderFlipbookFrame(ctx: CanvasRenderingContext2D, state: GameState, COLORS: Theme, nowMs: number) {
  // Ground level reference (for positioning)
  const groundY = H - 20;

  // Visual offset to position Zeno better on screen (doesn't affect physics)
  const ZENO_X_OFFSET = 2;
  const ZENO_Y_OFFSET = -20;
  const zenoX = state.px + ZENO_X_OFFSET;
  const zenoY = state.py + ZENO_Y_OFFSET;

  // Update and render background layers using asset-based renderer
  backgroundRenderer.update(state.wind, nowMs);
  backgroundRenderer.render(ctx);

  // Practice mode badge
  if (state.practiceMode) {
    ctx.save();
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
    ctx.fillText('PRACTICE MODE', W / 2, 12);
    ctx.restore();
  }

  // Best marker - animated flag using background assets
  if (state.best > 0 && state.best <= CLIFF_EDGE) {
    const flagX = Math.floor(state.best);
    backgroundRenderer.drawFlag(ctx, flagX, groundY);
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

    // Star shape with layered effect (smaller size)
    const starY = groundY - 32 + pulse;
    const starRadius = 7;
    // Layer 2: faint offset
    ctx.strokeStyle = COLORS.highlight;
    ctx.lineWidth = LINE_WEIGHTS.shadow;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 144 - 90) * Math.PI / 180;
      const px = targetX + Math.cos(angle) * starRadius + 0.5;
      const py = starY + Math.sin(angle) * starRadius + 0.5;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Layer 1: primary stroke
    ctx.lineWidth = LINE_WEIGHTS.primary;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 144 - 90) * Math.PI / 180;
      const px = targetX + Math.cos(angle) * starRadius;
      const py = starY + Math.sin(angle) * starRadius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // Wind is now indicated by flag animation speed (see backgroundRenderer.ts)

  // Decorative birds
  drawBird(ctx, 150 + Math.sin(nowMs / 2000) * 30, 90, 6, COLORS.accent3, 1.5, nowMs);
  drawBird(ctx, 320 + Math.cos(nowMs / 2500) * 25, 85, 5, COLORS.accent3, 1.5, nowMs + 500);

  // Ghost trail (best attempt) - prominent dashed arc
  if (state.bestTrail.length > 4) {
    const ghostPoints = state.bestTrail.filter((_, i) => i % 2 === 0);
    // Draw thicker, more visible arc
    drawDashedCurve(ctx, ghostPoints, COLORS.accent3, 3, 8, 6);
    // Add glow effect
    ctx.globalAlpha = 0.3;
    drawDashedCurve(ctx, ghostPoints, COLORS.player, 5, 8, 6);
    ctx.globalAlpha = 1;
  }

  // Rings - update positions and draw (visible during idle for planning, during flight for collection)
  for (const ring of state.rings) {
    updateRingPosition(ring, nowMs);
  }
  drawRings(ctx, state.rings, COLORS, nowMs, state.ringsPassedThisThrow);

  // Ring multiplier indicator removed - now shown in React ThrowScore HUD

  // Ring juice effects
  renderEdgeGlow(ctx, state.edgeGlowIntensity, W, H);
  renderRingPopups(ctx, state.ringJuicePopups);

  // ON FIRE mode visual effects
  if (state.onFireMode && !state.reduceFx) {
    renderOnFireMode(ctx, state.sessionHeat / 100, W, H);
  }

  // Near-miss spotlight effect
  if (state.nearMissActive && state.nearMissIntensity) {
    renderNearMissSpotlight(ctx, state.zenoTarget, state.nearMissIntensity, W, H);
  }

  // Charge visual tension effects (before Zeno for glow effect behind character)
  if (state.charging && !state.reduceFx) {
    renderChargeGlow(ctx, zenoX, zenoY, state.chargeGlowIntensity);
    if (state.chargeVignetteActive) {
      renderChargeVignette(ctx, state.chargeGlowIntensity - 0.5, W, H);
    }
  }

  // Player rendering - prefer sprites, fallback to procedural (using zenoX/zenoY for visual offset)
  const spriteDrawn = drawZenoSprite(ctx, state, zenoX, zenoY);

  if (!spriteDrawn) {
    // Fallback to procedural rendering
    let playerState: 'idle' | 'charging' | 'flying' | 'landing' = 'idle';
    if (state.charging) playerState = 'charging';
    else if (state.flying || state.sliding) playerState = 'flying';
    else if (state.landingFrame > 0) playerState = 'landing';

    const playerColor = state.fellOff ? COLORS.danger : COLORS.player;

    // Check for failure animation
    if (state.failureAnimating && state.failureType && (state.failureType === 'tumble' || state.failureType === 'dive')) {
      drawFailingStickFigure(
        ctx,
        zenoX,
        zenoY,
        playerColor,
        nowMs,
        state.failureType,
        state.failureFrame,
      );
    } else if (state.charging) {
      drawZenoCoil(ctx, zenoX, zenoY, playerColor, nowMs, state.chargePower, 'flipbook');
    } else if (state.flying && !state.failureAnimating) {
      drawZenoBolt(ctx, zenoX, zenoY, playerColor, nowMs, { vx: state.vx, vy: state.vy }, 'flipbook');
    } else if (state.landingFrame > 0 && state.landingFrame < 15 && !state.fellOff) {
      drawZenoImpact(ctx, zenoX, zenoY, playerColor, nowMs, state.landingFrame, 'flipbook');
    } else {
      // Idle or other states
      drawStickFigure(ctx, zenoX, zenoY, playerColor, nowMs, playerState, state.angle, { vx: state.vx, vy: state.vy }, state.chargePower);
    }
  }

  // Action denied red pulse on Zeno (Task 8.3)
  if (state.staminaDeniedShake && state.staminaDeniedShake > 0) {
    ctx.fillStyle = `rgba(255, 0, 0, ${state.staminaDeniedShake * 0.04})`;
    ctx.beginPath();
    ctx.arc(zenoX, zenoY, 25, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stamina bar (only during flight/slide when stamina used)
  if ((state.flying || state.sliding) && state.stamina < 100) {
    drawStaminaBar(ctx, zenoX, zenoY - 25, state.stamina, nowMs, COLORS, state.staminaDeniedShake || 0);
  }

  // Precision bar (above stamina bar when active)
  if (state.precisionBarActive || (state.fellOff && state.lastValidPx >= 410)) {
    drawPrecisionBar(ctx, state, zenoX, zenoY, COLORS, nowMs);
  }

  // Funny failure text
  if (state.failureAnimating && state.failureFrame < 30) {
    const texts = ['NOOO!', 'AHHH!', 'OOF!', 'YIKES!'];
    const text = texts[Math.floor(state.seed % texts.length)];

    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 14px "Comic Sans MS", cursive, sans-serif';
    ctx.textAlign = 'center';

    const bounce = Math.sin(state.failureFrame * 0.3) * 3;
    ctx.fillText(text, zenoX, zenoY - 30 + bounce);
  }

  // Charging UI - hand-drawn power bar
  if (state.charging) {
    const barX = 50;
    const barY = 15;
    const barW = 80;
    const barH = 12;

    // Bar outline (hand-drawn rectangle)
    ctx.strokeStyle = COLORS.accent3;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(barX, barY, barW, barH);
    ctx.stroke();

    // Decorative curls at bar ends
    drawDecorativeCurl(ctx, barX - 3, barY + barH / 2, 5, COLORS.accent3, 1, nowMs, -1);
    drawDecorativeCurl(ctx, barX + barW + 3, barY + barH / 2, 5, COLORS.accent3, 1, nowMs, 1);

    // Fill based on power
    const fillW = state.chargePower * (barW - 4);
    const powerColor = state.chargePower > 0.8 ? COLORS.danger
      : state.chargePower > 0.5 ? COLORS.highlight
        : COLORS.accent1;
    ctx.fillStyle = powerColor;
    ctx.fillRect(barX + 2, barY + 2, fillW, barH - 4);

    // Angle indicator arc (using zenoX/zenoY for visual offset)
    const arcX = zenoX;
    const arcY = zenoY;
    const arcRadius = 25;

    // Draw arc
    ctx.strokeStyle = COLORS.accent3;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(arcX, arcY, arcRadius, -MAX_ANGLE * Math.PI / 180, -MIN_ANGLE * Math.PI / 180);
    ctx.stroke();

    // Current angle line
    const angleRad = (state.angle * Math.PI) / 180;
    const lineLen = 20 + state.chargePower * 25;
    drawHandLine(
      ctx,
      arcX,
      arcY,
      arcX + Math.cos(angleRad) * lineLen,
      arcY - Math.sin(angleRad) * lineLen,
      COLORS.accent1,
      2.5,
      nowMs,
    );

    // Arrowhead
    const endX = arcX + Math.cos(angleRad) * lineLen;
    const endY = arcY - Math.sin(angleRad) * lineLen;
    drawHandCircle(ctx, endX, endY, 4, COLORS.accent1, 2, nowMs, true);

    // Optimal angle marker
    const optRad = (OPTIMAL_ANGLE * Math.PI) / 180;
    const optBlink = Math.floor(nowMs / 300) % 2;
    if (optBlink) {
      const optX = arcX + Math.cos(optRad) * (arcRadius + 8);
      const optY = arcY - Math.sin(optRad) * (arcRadius + 8);
      drawHandCircle(ctx, optX, optY, 5, COLORS.highlight, 2, nowMs, false);
    }

    // Trajectory preview arc (dashed curve showing predicted path)
    if (state.chargePower > 0.2) {
      const power = MIN_POWER + state.chargePower * (MAX_POWER - MIN_POWER);
      const vx = Math.cos(angleRad) * power;
      const vy = -Math.sin(angleRad) * power;

      // Generate preview points (using zenoX/zenoY for visual offset)
      const previewPoints: { x: number; y: number }[] = [];
      let px = zenoX;
      let py = zenoY;
      const pvx = vx;
      let pvy = vy;

      for (let i = 0; i < 40; i++) {
        previewPoints.push({ x: px, y: py });
        px += pvx;
        pvy += BASE_GRAV;
        py += pvy;
        if (py > groundY + ZENO_Y_OFFSET || px > W) break;
      }

      // Draw styled preview arc
      ctx.globalAlpha = 0.5 + state.chargePower * 0.3;
      drawStyledTrajectory(ctx, previewPoints, COLORS.accent3, nowMs, 'flipbook');
      ctx.globalAlpha = 1;
    }
  }

  // Danger border when near edge
  if ((state.flying || state.sliding) && state.px > 300) {
    const blink = Math.floor(nowMs / 200) % 2;
    if (blink) {
      ctx.strokeStyle = COLORS.danger;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(2, 2, W - 4, H - 4);
      ctx.setLineDash([]);
    }
  }

  // Risk multiplier display removed - rings shown via React HUD

  // Slow-mo corners
  if (state.slowMo > 0.1) {
    const cornerSize = 15;
    ctx.strokeStyle = COLORS.accent1;
    ctx.lineWidth = 2.5;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(0, cornerSize);
    ctx.lineTo(0, 0);
    ctx.lineTo(cornerSize, 0);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(W - cornerSize, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, cornerSize);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(0, H - cornerSize);
    ctx.lineTo(0, H);
    ctx.lineTo(cornerSize, H);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(W - cornerSize, H);
    ctx.lineTo(W, H);
    ctx.lineTo(W, H - cornerSize);
    ctx.stroke();
  }

  // Record zone vignette and visual effects
  if ((state.recordZoneActive || state.epicMomentTriggered) && !state.reduceFx) {
    const intensity = state.recordZoneIntensity || 1;
    const isFailing = state.fellOff || state.failureAnimating;

    // Vignette effect (darker edges)
    const gradient = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.7, `rgba(0,0,0,${intensity * 0.15})`);
    gradient.addColorStop(1, `rgba(0,0,0,${intensity * 0.4})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Pulsing border glow - intense orange
    const pulse = Math.sin(nowMs / 100) * 0.5 + 0.5;
    ctx.strokeStyle = `rgba(255, 107, 53, ${intensity * pulse * 0.9})`; // Intense orange
    ctx.lineWidth = 4 + intensity * 4;
    ctx.strokeRect(2, 2, W - 4, H - 4);

    // Text display - supportive messages
    ctx.font = 'bold 14px "Comic Sans MS", cursive, sans-serif';
    ctx.textAlign = 'center';
    const textPulse = Math.sin(nowMs / 150) * 2;

    if (isFailing) {
      // Encouraging fail messages
      const failMessages = ["Don't Worry...", "SO CLOSE...", "next time maybe..."];
      const msgIndex = Math.floor(nowMs / 2000) % failMessages.length;
      ctx.fillStyle = 'rgba(255, 107, 53, 0.95)'; // Intense orange
      ctx.fillText(failMessages[msgIndex], W / 2, 22 + textPulse);
    } else if (intensity > 0.8) {
      // About to beat record - chill success
      const successMessages = ["nice.", "there you go...", "smooth..."];
      const msgIndex = Math.floor(nowMs / 1500) % successMessages.length;
      ctx.fillStyle = 'rgba(255, 107, 53, 0.95)'; // Intense orange
      ctx.fillText(successMessages[msgIndex], W / 2, 22 + textPulse);
    }
  }

  // Touch feedback crosshair
  if (state.touchFeedback > 0.3) {
    const cx = W / 2;
    const cy = H / 2;
    ctx.strokeStyle = COLORS.accent1;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy);
    ctx.lineTo(cx + 12, cy);
    ctx.moveTo(cx, cy - 12);
    ctx.lineTo(cx, cy + 12);
    ctx.stroke();
  }

  // Achievement popup removed - now handled by React component in Game.tsx
  // "Almost!" overlay removed - feedback now handled by React LandingGrade component
}

// Noir Ink theme renderer - high contrast, minimal, film noir aesthetic
function renderNoirFrame(ctx: CanvasRenderingContext2D, state: GameState, COLORS: Theme, nowMs: number) {
  // Ground level reference
  const groundY = H - 20;

  // Visual offset to raise Zeno higher on screen (doesn't affect physics)
  const ZENO_Y_OFFSET = -24;
  const zenoY = state.py + ZENO_Y_OFFSET;

  // Update and render noir background layers using asset-based renderer
  noirBackgroundRenderer.update(state.wind, nowMs);
  noirBackgroundRenderer.render(ctx);

  // Practice mode badge
  if (state.practiceMode) {
    ctx.save();
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
    ctx.fillText('PRACTICE MODE', W / 2, 12);
    ctx.restore();
  }

  // Best marker - animated flag using noir assets
  if (state.best > 0 && state.best <= CLIFF_EDGE) {
    const flagX = Math.floor(state.best);
    noirBackgroundRenderer.drawFlag(ctx, flagX, groundY);
  }

  // Zeno target marker - glowing line
  if (state.zenoTarget > 0 && state.zenoTarget <= CLIFF_EDGE) {
    const targetX = Math.floor(state.zenoTarget);
    const pulse = Math.sin(nowMs / 200) * 0.3 + 0.7;

    ctx.strokeStyle = COLORS.highlight;
    ctx.lineWidth = 2;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.moveTo(targetX, groundY);
    ctx.lineTo(targetX, groundY - 35);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Target circle
    ctx.strokeStyle = COLORS.highlight;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(targetX, groundY - 40, 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Wind is now indicated by flag animation speed (see noirBackgroundRenderer.ts)

  // Ghost trail (best attempt) - prominent dashes for noir
  if (state.bestTrail.length > 4) {
    const ghostPoints = state.bestTrail.filter((_, i) => i % 2 === 0);
    // Primary trail
    ctx.strokeStyle = COLORS.star;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    for (let i = 0; i < ghostPoints.length; i++) {
      if (i === 0) ctx.moveTo(ghostPoints[i].x, ghostPoints[i].y);
      else ctx.lineTo(ghostPoints[i].x, ghostPoints[i].y);
    }
    ctx.stroke();
    // Glow effect
    ctx.strokeStyle = COLORS.player;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    for (let i = 0; i < ghostPoints.length; i++) {
      if (i === 0) ctx.moveTo(ghostPoints[i].x, ghostPoints[i].y);
      else ctx.lineTo(ghostPoints[i].x, ghostPoints[i].y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
  }

  // Rings - update positions and draw (visible during idle for planning, during flight for collection)
  for (const ring of state.rings) {
    updateRingPosition(ring, nowMs);
  }
  drawRings(ctx, state.rings, COLORS, nowMs, state.ringsPassedThisThrow);

  // Ring multiplier indicator removed - now shown in React ThrowScore HUD

  // Ring juice effects
  renderEdgeGlow(ctx, state.edgeGlowIntensity, W, H);
  renderRingPopups(ctx, state.ringJuicePopups);

  // ON FIRE mode visual effects
  if (state.onFireMode && !state.reduceFx) {
    renderOnFireMode(ctx, state.sessionHeat / 100, W, H);
  }

  // Near-miss spotlight effect
  if (state.nearMissActive && state.nearMissIntensity) {
    renderNearMissSpotlight(ctx, state.zenoTarget, state.nearMissIntensity, W, H);
  }

  // Charge visual tension effects (before Zeno for glow effect behind character)
  if (state.charging && !state.reduceFx) {
    renderChargeGlow(ctx, state.px, zenoY, state.chargeGlowIntensity);
    if (state.chargeVignetteActive) {
      renderChargeVignette(ctx, state.chargeGlowIntensity - 0.5, W, H);
    }
  }

  // Player rendering - prefer sprites, fallback to procedural (using zenoY for visual offset)
  const spriteDrawnNoir = drawZenoSprite(ctx, state, state.px, zenoY);

  if (!spriteDrawnNoir) {
    // Fallback to procedural rendering
    let playerState: 'idle' | 'charging' | 'flying' | 'landing' = 'idle';
    if (state.charging) playerState = 'charging';
    else if (state.flying || state.sliding) playerState = 'flying';
    else if (state.landingFrame > 0) playerState = 'landing';

    const playerColor = state.fellOff ? COLORS.danger : COLORS.player;

    if (state.failureAnimating && state.failureType && (state.failureType === 'tumble' || state.failureType === 'dive')) {
      drawFailingStickFigure(ctx, state.px, zenoY, playerColor, nowMs, state.failureType, state.failureFrame);
    } else if (state.charging) {
      drawZenoCoil(ctx, state.px, zenoY, playerColor, nowMs, state.chargePower, 'noir');
    } else if (state.flying && !state.failureAnimating) {
      drawZenoBolt(ctx, state.px, zenoY, playerColor, nowMs, { vx: state.vx, vy: state.vy }, 'noir');
    } else if (state.landingFrame > 0 && state.landingFrame < 15 && !state.fellOff) {
      drawZenoImpact(ctx, state.px, zenoY, playerColor, nowMs, state.landingFrame, 'noir');
    } else {
      // Idle or other states
      drawStickFigure(ctx, state.px, zenoY, playerColor, nowMs, playerState, state.angle, { vx: state.vx, vy: state.vy }, state.chargePower);
    }
  }

  // Action denied red pulse on Zeno (Task 8.3)
  if (state.staminaDeniedShake && state.staminaDeniedShake > 0) {
    ctx.fillStyle = `rgba(255, 0, 0, ${state.staminaDeniedShake * 0.04})`;
    ctx.beginPath();
    ctx.arc(state.px, zenoY, 25, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stamina bar (only during flight/slide when stamina used)
  if ((state.flying || state.sliding) && state.stamina < 100) {
    drawStaminaBar(ctx, state.px, zenoY - 25, state.stamina, nowMs, COLORS, state.staminaDeniedShake || 0);
  }

  // Precision bar (above stamina bar when active)
  if (state.precisionBarActive || (state.fellOff && state.lastValidPx >= 410)) {
    drawPrecisionBar(ctx, state, state.px, zenoY, COLORS, nowMs);
  }

  // Failure text
  if (state.failureAnimating && state.failureFrame < 30) {
    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', state.px, zenoY - 25);
  }

  // Charging UI - minimal power bar
  if (state.charging) {
    const barX = 50;
    const barY = 15;
    const barW = 70;
    const barH = 8;

    ctx.strokeStyle = COLORS.accent3;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    const fillW = state.chargePower * (barW - 2);
    const powerColor = state.chargePower > 0.8 ? COLORS.danger : COLORS.accent1;
    ctx.fillStyle = powerColor;
    ctx.fillRect(barX + 1, barY + 1, fillW, barH - 2);

    // Angle line (using zenoY for visual offset)
    const arcX = state.px;
    const arcY = zenoY;
    const angleRad = (state.angle * Math.PI) / 180;
    const lineLen = 15 + state.chargePower * 20;

    ctx.strokeStyle = COLORS.accent1;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(arcX, arcY);
    ctx.lineTo(arcX + Math.cos(angleRad) * lineLen, arcY - Math.sin(angleRad) * lineLen);
    ctx.stroke();

    // Endpoint dot
    ctx.fillStyle = COLORS.accent1;
    ctx.beginPath();
    ctx.arc(arcX + Math.cos(angleRad) * lineLen, arcY - Math.sin(angleRad) * lineLen, 3, 0, Math.PI * 2);
    ctx.fill();

    // Trajectory preview arc (noir style, using zenoY for visual offset)
    if (state.chargePower > 0.2) {
      const power = MIN_POWER + state.chargePower * (MAX_POWER - MIN_POWER);
      const vx = Math.cos(angleRad) * power;
      const vy = -Math.sin(angleRad) * power;

      // Generate preview points
      const previewPoints: { x: number; y: number }[] = [];
      let px = state.px;
      let py = zenoY;
      const pvx = vx;
      let pvy = vy;

      for (let i = 0; i < 40; i++) {
        previewPoints.push({ x: px, y: py });
        px += pvx;
        pvy += BASE_GRAV;
        py += pvy;
        if (py > groundY + ZENO_Y_OFFSET || px > W) break;
      }

      // Draw styled preview arc (noir style)
      ctx.globalAlpha = 0.6 + state.chargePower * 0.3;
      drawStyledTrajectory(ctx, previewPoints, COLORS.player, nowMs, 'noir');
      ctx.globalAlpha = 1;
    }
  }

  // Danger border
  if ((state.flying || state.sliding) && state.px > 300) {
    const blink = Math.floor(nowMs / 250) % 2;
    if (blink) {
      ctx.strokeStyle = COLORS.danger;
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, W - 2, H - 2);
    }
  }

  // Risk multiplier display removed - rings shown via React HUD

  // Slow-mo indicator
  if (state.slowMo > 0.1) {
    ctx.strokeStyle = COLORS.accent1;
    ctx.lineWidth = 1;

    // Corner brackets
    const cs = 10;
    ctx.beginPath();
    ctx.moveTo(0, cs); ctx.lineTo(0, 0); ctx.lineTo(cs, 0);
    ctx.moveTo(W - cs, 0); ctx.lineTo(W, 0); ctx.lineTo(W, cs);
    ctx.moveTo(0, H - cs); ctx.lineTo(0, H); ctx.lineTo(cs, H);
    ctx.moveTo(W - cs, H); ctx.lineTo(W, H); ctx.lineTo(W, H - cs);
    ctx.stroke();
  }

  // Record zone effects
  if ((state.recordZoneActive || state.epicMomentTriggered) && !state.reduceFx) {
    const intensity = state.recordZoneIntensity || 1;
    const isFailing = state.fellOff || state.failureAnimating;

    // Subtle orange border glow
    const pulse = Math.sin(nowMs / 100) * 0.3 + 0.7;
    ctx.strokeStyle = `rgba(255, 107, 53, ${intensity * pulse * 0.6})`; // Orange
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    // Supportive messages (minimal for noir)
    if (intensity > 0.7 || isFailing) {
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 107, 53, 0.8)'; // Orange
      if (isFailing) {
        const failMessages = ["...", "so close", "next time"];
        const msgIndex = Math.floor(nowMs / 2000) % failMessages.length;
        ctx.fillText(failMessages[msgIndex], W / 2, 18);
      } else {
        ctx.fillText("!", W / 2, 18);
      }
    }
  }

  // Touch feedback
  if (state.touchFeedback > 0.3) {
    const cx = W / 2;
    const cy = H / 2;
    ctx.strokeStyle = COLORS.accent1;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
    ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8);
    ctx.stroke();
  }

  // Achievement popup removed - now handled by React component in Game.tsx
  // "Almost!" overlay removed - feedback now handled by React LandingGrade component

  // Apply film grain and vignette (always on for Noir, intensity varies with reduceFx)
  const grainIntensity = state.reduceFx ? 0.3 : 0.6;
  const vignetteIntensity = state.reduceFx ? 0.4 : 0.7;

  drawFilmGrain(ctx, W, H, nowMs, grainIntensity);
  drawVignette(ctx, W, H, vignetteIntensity);
}
