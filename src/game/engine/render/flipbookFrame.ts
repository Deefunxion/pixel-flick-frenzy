import type { Theme } from '@/game/themes';
import type { GameState } from '../types';
import { CLIFF_EDGE, H, MAX_ANGLE, MIN_ANGLE, W } from '@/game/constants';
import { backgroundRenderer } from '../backgroundRenderer';
import { parallaxRenderer } from '../parallax';
import { getGalaxyForLevel } from '../arcade/progression';
import {
  drawStickFigure,
  drawFailingStickFigure,
  drawBird,
  drawDashedCurve,
  drawZenoCoil,
  drawZenoBolt,
  drawZenoImpact,
  LINE_WEIGHTS,
} from '../sketchy';
import { drawPrecisionBar } from '../precisionRender';
import { renderBounce } from '../bounceRender';
import { renderContractHUD } from '../contractRender';
import { renderDoodles } from '../arcade/doodlesRender';
import { renderSprings } from '../arcade/springsRender';
import { renderPortal } from '../arcade/portalRender';
import { renderHazards } from '../arcade/hazardsRender';
import { renderWindZones, updateWindZoneParticles } from '../arcade/windZonesRender';
import { renderGravityWells } from '../arcade/gravityWellsRender';
import { renderFrictionZones } from '../arcade/frictionZonesRender';
import { renderRingPopups } from './effects/ringJuice';
import { renderNearMissSpotlight } from './effects/nearMiss';
import { renderOnFireMode } from './effects/onFire';
import { renderChargeGlow, renderChargeVignette } from './effects/recordZone';
import { drawStaminaBar } from './hud/staminaHud';
import { drawChargeHud } from './hud/chargeHud';
import { drawZenoSprite } from './sprites/zenoSprite';

// Visual offset to position Zeno better on screen (doesn't affect physics)
const ZENO_X_OFFSET = 2;
const ZENO_Y_OFFSET = -16;

export function renderFlipbookFrame(ctx: CanvasRenderingContext2D, state: GameState, COLORS: Theme, nowMs: number) {
  // Ground level reference (for positioning)
  const groundY = H - 20;

  const zenoX = state.px + ZENO_X_OFFSET;
  const zenoY = state.py + ZENO_Y_OFFSET;

  // Update and render background layers
  // Galaxy 1 (Grasslands) uses the original ballpoint pen style background
  // Galaxies 2-5 use the new parallax system
  const galaxy = state.arcadeMode ? getGalaxyForLevel(state.arcadeState?.currentLevelId ?? 1) : null;

  if (galaxy && galaxy.id > 1) {
    // Galaxies 2-5: use parallax backgrounds
    parallaxRenderer.update(state.px);
    parallaxRenderer.render(ctx, galaxy.colorPalette);
  } else {
    // Classic mode OR Galaxy 1 (Grasslands): use original ballpoint pen background
    backgroundRenderer.update(state.wind, nowMs);
    backgroundRenderer.render(ctx);
  }

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

  // Rings - update positions and draw
  // Render bounce surface
  renderBounce(ctx, state.bounce, nowMs);

  // Arcade mode objects (render order: zones behind, then objects, then collectibles on top)
  if (state.arcadeMode) {
    // Background zones first (behind everything)
    if (state.arcadeFrictionZones?.length) renderFrictionZones(ctx, state.arcadeFrictionZones, nowMs);
    if (state.arcadeWindZones?.length) renderWindZones(ctx, state.arcadeWindZones, false, nowMs);
    if (state.arcadeGravityWells?.length) renderGravityWells(ctx, state.arcadeGravityWells, nowMs);
    // Objects
    renderPortal(ctx, state.arcadePortal, nowMs, state.portalJuiceTimer);
    renderSprings(ctx, state.arcadeSprings, nowMs);
    if (state.arcadeHazards?.length) renderHazards(ctx, state.arcadeHazards, nowMs);
    // Collectibles on top - pass level and next sequence for Bomb Jack style glow
    const levelId = state.arcadeState?.currentLevelId ?? 1;
    const nextSequence = state.arcadeState?.expectedNextSequence ?? 1;
    renderDoodles(ctx, state.arcadeDoodles, nowMs, levelId, nextSequence);
  }

  // Ring juice effects (disabled with rings off)
  renderRingPopups(ctx, state.ringJuicePopups);

  // Contract and route UI
  renderContractHUD(ctx, state.activeContract, state.activeRoute, state.lastContractResult, nowMs);

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

  // Hero glow - subtle radial glow behind Zeno
  const glowPulse = 0.4 + Math.sin(nowMs / 400) * 0.1; // Gentle pulse 0.3-0.5
  const glowRadius = 28;
  const heroGlow = ctx.createRadialGradient(zenoX, zenoY, 0, zenoX, zenoY, glowRadius);
  heroGlow.addColorStop(0, `rgba(255, 255, 220, ${glowPulse})`); // Warm white center
  heroGlow.addColorStop(0.4, `rgba(255, 230, 150, ${glowPulse * 0.6})`); // Golden mid
  heroGlow.addColorStop(1, 'rgba(255, 200, 100, 0)'); // Fade to transparent
  ctx.fillStyle = heroGlow;
  ctx.beginPath();
  ctx.arc(zenoX, zenoY, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  // Player rendering - prefer sprites, fallback to procedural
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

  // Action denied red pulse on Zeno
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

  // Charging UI
  if (state.charging) {
    drawChargeHud(ctx, zenoX, zenoY, groundY, ZENO_Y_OFFSET, state.chargePower, state.angle, COLORS, nowMs, 'flipbook');
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
}
