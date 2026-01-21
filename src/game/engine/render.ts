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
  drawWindStrengthMeter,
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
import { drawPrecisionBar, drawPrecisionFallOverlay } from './precisionRender';
import { drawRings, drawRingMultiplierIndicator } from './ringsRender';
import { updateRingPosition } from './rings';
// TODO: Import sprite-based effects when assets are ready
// import { renderParticles } from './particles';

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
    // Flash effect when low
    if (Math.floor(nowMs / 200) % 2 === 0) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
    }
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

  ctx.restore();
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

  // Wind indicator - clear arrow showing direction and strength
  const windDir = state.wind > 0 ? 1 : -1;
  const windStrength = Math.abs(state.wind);

  // Wind indicator box in top-right
  const windBoxX = W - 90;
  const windBoxY = 12;
  const windBoxW = 75;
  const windBoxH = 32;

  // Box background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(windBoxX, windBoxY, windBoxW, windBoxH);

  // Box outline
  ctx.strokeStyle = COLORS.accent3;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(windBoxX, windBoxY, windBoxW, windBoxH);

  // Decorative corner curls
  drawDecorativeCurl(ctx, windBoxX - 2, windBoxY - 2, 6, COLORS.accent3, 1, nowMs, -1);
  drawDecorativeCurl(ctx, windBoxX + windBoxW + 2, windBoxY - 2, 6, COLORS.accent3, 1, nowMs, 1);

  // "WIND" label
  ctx.fillStyle = COLORS.accent3;
  ctx.font = '9px "Comic Sans MS", cursive, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WIND', windBoxX + windBoxW / 2, windBoxY + 10);

  // Arrow showing direction
  const arrowCenterX = windBoxX + windBoxW / 2;
  const arrowY = windBoxY + 22;
  const arrowLength = 15 + windStrength * 150; // Length based on strength

  ctx.strokeStyle = COLORS.accent1;
  ctx.fillStyle = COLORS.accent1;
  ctx.lineWidth = 2.5;

  // Arrow line
  const arrowStartX = arrowCenterX - (arrowLength / 2) * windDir;
  const arrowEndX = arrowCenterX + (arrowLength / 2) * windDir;

  ctx.beginPath();
  ctx.moveTo(arrowStartX, arrowY);
  ctx.lineTo(arrowEndX, arrowY);
  ctx.stroke();

  // Arrow head
  ctx.beginPath();
  ctx.moveTo(arrowEndX, arrowY);
  ctx.lineTo(arrowEndX - 8 * windDir, arrowY - 5);
  ctx.lineTo(arrowEndX - 8 * windDir, arrowY + 5);
  ctx.closePath();
  ctx.fill();

  // Wind strength meter (bars)
  drawWindStrengthMeter(ctx, windBoxX + 5, windBoxY + 14, windStrength, windDir, COLORS.accent3, COLORS.accent1);

  // Animated wind lines in the sky showing direction
  ctx.strokeStyle = COLORS.accent3;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  const lineCount = Math.max(2, Math.min(5, Math.ceil(windStrength * 10)));
  for (let i = 0; i < lineCount; i++) {
    const lineX = (100 + i * 100 + (nowMs / 25) * windDir) % (W + 100) - 50;
    const lineY = 40 + (i % 3) * 30;  // Fixed Y positions, no wobble
    const lineLen = 20 + windStrength * 40;

    ctx.beginPath();
    ctx.moveTo(lineX, lineY);
    ctx.lineTo(lineX + lineLen * windDir, lineY);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

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
  drawRings(ctx, state.rings, COLORS, nowMs);

  // Ring multiplier indicator (shows during flight when rings collected)
  if (state.flying && state.ringsPassedThisThrow > 0) {
    drawRingMultiplierIndicator(ctx, state.ringMultiplier, state.ringsPassedThisThrow, COLORS);
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

  // Nudge indicator (mid-air boost available)
  if (state.flying && !state.nudgeUsed) {
    const nudgeX = 50;
    const nudgeY = H - 35;
    const blink = Math.floor(nowMs / 200) % 2;

    // Hand-drawn button
    ctx.strokeStyle = blink ? COLORS.highlight : COLORS.accent1;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(nudgeX, nudgeY, 45, 20, 3);
    ctx.stroke();

    // "TAP" text
    ctx.fillStyle = COLORS.highlight;
    ctx.font = '12px "Comic Sans MS", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAP', nudgeX + 22, nudgeY + 14);
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

  // Multiplier display when flying
  if ((state.flying || state.sliding) && state.currentMultiplier > 1.01) {
    const mult = state.currentMultiplier;
    const multX = 50;
    const multY = 35;

    let multColor = COLORS.accent1;
    if (mult > 3) multColor = COLORS.danger;
    else if (mult > 2) multColor = COLORS.highlight;

    // Hand-drawn box
    ctx.strokeStyle = multColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(multX, multY, 55, 22, 3);
    ctx.stroke();

    // Multiplier text
    ctx.fillStyle = multColor;
    ctx.font = 'bold 14px "Comic Sans MS", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`x${mult.toFixed(1)}`, multX + 27, multY + 16);
  }

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
    gradient.addColorStop(0.7, `rgba(0,0,0,${intensity * 0.2})`);
    gradient.addColorStop(1, `rgba(0,0,0,${intensity * 0.5})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Pulsing border glow - gold for success, red for failure
    const pulse = Math.sin(nowMs / 100) * 0.5 + 0.5;
    if (isFailing) {
      ctx.strokeStyle = `rgba(220, 20, 60, ${pulse * 0.9})`;
    } else {
      ctx.strokeStyle = `rgba(255, 215, 0, ${intensity * pulse * 0.8})`;
    }
    ctx.lineWidth = 4 + intensity * 4;
    ctx.strokeRect(2, 2, W - 4, H - 4);

    // Text display - "RECORD ZONE" or "FAIL!"
    ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
    ctx.textAlign = 'center';
    const textPulse = Math.sin(nowMs / 150) * 2;

    if (isFailing) {
      // FAIL! text in bloody red
      ctx.fillStyle = 'rgba(220, 20, 60, 1)';
      ctx.fillText('FAIL!', W / 2, 25 + textPulse);
    } else if (intensity > 0.5) {
      // RECORD ZONE text in celebratory gold
      ctx.fillStyle = `rgba(255, 215, 0, ${(intensity - 0.5) * 2})`;
      ctx.fillText('RECORD ZONE', W / 2, 25 + textPulse);
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

  // "Almost!" overlay - stays visible until next throw starts
  if (state.almostOverlayActive) {
    drawPrecisionFallOverlay(ctx, state, W, H, COLORS, nowMs);
  }
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

  // Wind indicator with strength meter
  const windDir = state.wind > 0 ? 1 : -1;
  const windStrength = Math.abs(state.wind);
  const windBoxX = 15;
  const windBoxY = 10;

  // Direction arrow
  ctx.strokeStyle = COLORS.accent1;
  ctx.lineWidth = 2;
  const arrowLen = 20;
  const arrowY = windBoxY + 8;
  const arrowStartX = windBoxX + (windDir > 0 ? 0 : arrowLen);
  const arrowEndX = windBoxX + (windDir > 0 ? arrowLen : 0);

  ctx.beginPath();
  ctx.moveTo(arrowStartX, arrowY);
  ctx.lineTo(arrowEndX, arrowY);
  ctx.stroke();

  // Arrowhead
  ctx.fillStyle = COLORS.accent1;
  ctx.beginPath();
  ctx.moveTo(arrowEndX, arrowY);
  ctx.lineTo(arrowEndX - 6 * windDir, arrowY - 4);
  ctx.lineTo(arrowEndX - 6 * windDir, arrowY + 4);
  ctx.closePath();
  ctx.fill();

  // Wind strength meter (bars)
  drawWindStrengthMeter(ctx, windBoxX + 30, windBoxY, windStrength, windDir, COLORS.accent3, COLORS.accent1);

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
  drawRings(ctx, state.rings, COLORS, nowMs);

  // Ring multiplier indicator (shows during flight when rings collected)
  if (state.flying && state.ringsPassedThisThrow > 0) {
    drawRingMultiplierIndicator(ctx, state.ringMultiplier, state.ringsPassedThisThrow, COLORS);
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

  // Nudge indicator
  if (state.flying && !state.nudgeUsed) {
    const nudgeX = 50;
    const nudgeY = H - 30;
    const blink = Math.floor(nowMs / 300) % 2;

    ctx.strokeStyle = blink ? COLORS.highlight : COLORS.accent3;
    ctx.lineWidth = 1;
    ctx.strokeRect(nudgeX, nudgeY, 35, 16);

    ctx.fillStyle = COLORS.highlight;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAP', nudgeX + 17, nudgeY + 12);
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

  // Multiplier display
  if ((state.flying || state.sliding) && state.currentMultiplier > 1.01) {
    const mult = state.currentMultiplier;
    const multX = 50;
    const multY = 28;

    let multColor = COLORS.accent1;
    if (mult > 3) multColor = COLORS.danger;
    else if (mult > 2) multColor = COLORS.highlight;

    ctx.fillStyle = multColor;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`x${mult.toFixed(1)}`, multX, multY);
  }

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

    // Subtle golden/red border glow
    const pulse = Math.sin(nowMs / 100) * 0.3 + 0.7;
    if (isFailing) {
      ctx.strokeStyle = `rgba(220, 20, 60, ${pulse * 0.7})`;
    } else {
      ctx.strokeStyle = `rgba(240, 230, 140, ${intensity * pulse * 0.6})`;
    }
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    // Text
    if (intensity > 0.5 || isFailing) {
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = isFailing ? COLORS.danger : COLORS.highlight;
      ctx.fillText(isFailing ? '!' : 'RECORD', W / 2, 20);
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

  // "Almost!" overlay - stays visible until next throw starts
  if (state.almostOverlayActive) {
    drawPrecisionFallOverlay(ctx, state, W, H, COLORS, nowMs);
  }

  // Apply film grain and vignette (always on for Noir, intensity varies with reduceFx)
  const grainIntensity = state.reduceFx ? 0.3 : 0.6;
  const vignetteIntensity = state.reduceFx ? 0.4 : 0.7;

  drawFilmGrain(ctx, W, H, nowMs, grainIntensity);
  drawVignette(ctx, W, H, vignetteIntensity);
}
