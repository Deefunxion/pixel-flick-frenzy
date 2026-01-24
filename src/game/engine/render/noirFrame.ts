import type { Theme } from '@/game/themes';
import type { GameState } from '../types';
import { CLIFF_EDGE, H, W } from '@/game/constants';
import { noirBackgroundRenderer } from '../noirBackgroundRenderer';
import {
  drawStickFigure,
  drawFailingStickFigure,
  drawFilmGrain,
  drawVignette,
  drawZenoCoil,
  drawZenoBolt,
  drawZenoImpact,
} from '../sketchy';
import { drawPrecisionBar } from '../precisionRender';
import { drawRings } from '../ringsRender';
import { updateRingPosition } from '../rings';
import { renderBounce } from '../bounceRender';
import { renderContractHUD, renderRouteNodeHighlight } from '../contractRender';
import { renderRingPopups, renderRoutePopups, renderEdgeGlow } from './effects/ringJuice';
import { renderNearMissSpotlight } from './effects/nearMiss';
import { renderOnFireMode } from './effects/onFire';
import { renderChargeGlow, renderChargeVignette } from './effects/recordZone';
import { drawStaminaBar } from './hud/staminaHud';
import { drawChargeHud } from './hud/chargeHud';
import { drawZenoSprite } from './sprites/zenoSprite';

// Visual offset to raise Zeno higher on screen (doesn't affect physics)
const ZENO_Y_OFFSET = -24;

export function renderNoirFrame(ctx: CanvasRenderingContext2D, state: GameState, COLORS: Theme, nowMs: number) {
  // Ground level reference
  const groundY = H - 20;

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

  // Rings - update positions and draw
  for (const ring of state.rings) {
    updateRingPosition(ring, nowMs);
  }
  drawRings(ctx, state.rings, COLORS, nowMs, state.ringsPassedThisThrow);

  // Render bounce surface
  renderBounce(ctx, state.bounce, nowMs);

  // Ring juice effects
  renderEdgeGlow(ctx, state.edgeGlowIntensity, W, H);
  renderRingPopups(ctx, state.ringJuicePopups);
  // Route juice effects
  renderRoutePopups(ctx, state.routeJuicePopups);

  // Contract and route UI
  renderContractHUD(ctx, state.activeContract, state.activeRoute, state.lastContractResult, nowMs);
  renderRouteNodeHighlight(ctx, state.activeRoute, nowMs);

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

  // Player rendering - prefer sprites, fallback to procedural
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

  // Action denied red pulse on Zeno
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

  // Charging UI
  if (state.charging) {
    drawChargeHud(ctx, state.px, zenoY, groundY, ZENO_Y_OFFSET, state.chargePower, state.angle, COLORS, nowMs, 'noir');
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

  // Apply film grain and vignette (always on for Noir, intensity varies with reduceFx)
  const grainIntensity = state.reduceFx ? 0.3 : 0.6;
  const vignetteIntensity = state.reduceFx ? 0.4 : 0.7;

  drawFilmGrain(ctx, W, H, nowMs, grainIntensity);
  drawVignette(ctx, W, H, vignetteIntensity);
}
