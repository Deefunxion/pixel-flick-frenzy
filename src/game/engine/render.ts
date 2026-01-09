import type { Theme } from '@/game/themes';
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
  drawGhostFigure,
  drawScribbleEnergy,
  drawLaunchBurst,
  drawSpeedLines,
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
      const px = targetX + Math.cos(angle) * r + 0.5;
      const py = starY + Math.sin(angle) * r + 0.5;
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
      const r = 8;
      const px = targetX + Math.cos(angle) * r;
      const py = starY + Math.sin(angle) * r;
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

  // Wind strength dots (1-3 based on strength)
  const dots = Math.max(1, Math.min(3, Math.ceil(windStrength * 30)));
  for (let i = 0; i < dots; i++) {
    ctx.beginPath();
    ctx.arc(windBoxX + 8 + i * 8, windBoxY + 22, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Animated wind lines in the sky showing direction
  ctx.strokeStyle = COLORS.accent3;
  ctx.lineWidth = 1;
  const lineCount = Math.max(2, Math.ceil(windStrength * 25));
  for (let i = 0; i < lineCount; i++) {
    const lineX = (100 + i * 80 + (nowMs / 20) * windDir) % (W + 100) - 50;
    const lineY = 50 + (i % 3) * 25 + Math.sin(i * 2) * 10;
    const lineLen = 15 + windStrength * 80;

    ctx.beginPath();
    ctx.moveTo(lineX, lineY);
    ctx.lineTo(lineX + lineLen * windDir, lineY);
    ctx.stroke();
  }

  // Decorative clouds (moving with wind)
  const cloudOffset = (nowMs / 50) * windDir * windStrength;
  drawCloud(ctx, 80 + (cloudOffset % 60), 70, 10, COLORS.accent3, 1.5, nowMs);
  drawCloud(ctx, 200 + (cloudOffset % 80), 60, 8, COLORS.accent3, 1.5, nowMs);
  drawCloud(ctx, 340 + (cloudOffset % 70), 75, 12, COLORS.accent3, 1.5, nowMs);

  // Decorative birds
  drawBird(ctx, 150 + Math.sin(nowMs / 2000) * 30, 90, 6, COLORS.accent3, 1.5, nowMs);
  drawBird(ctx, 320 + Math.cos(nowMs / 2500) * 25, 85, 5, COLORS.accent3, 1.5, nowMs + 500);

  // Ghost trail (best attempt) - dashed curve
  if (state.bestTrail.length > 4) {
    const ghostPoints = state.bestTrail.filter((_, i) => i % 3 === 0);
    drawDashedCurve(ctx, ghostPoints, COLORS.accent3, 1.5, 6, 8);
  }

  // Ghost trail - fading echo figures during flight
  if (state.flying && state.ghostTrail.length > 0) {
    const trailLen = state.ghostTrail.length;
    for (let i = 0; i < trailLen; i++) {
      const ghost = state.ghostTrail[i];
      // Progressive fade: older = fainter
      const opacity = (0.6 - (trailLen - i - 1) * 0.15) * (1 - i / trailLen);
      if (opacity > 0.05) {
        drawGhostFigure(
          ctx,
          ghost.x,
          ghost.y,
          COLORS.pencilGray,
          opacity,
          nowMs,
          ghost.angle,
          'flipbook',
        );
      }
    }
  }

  // Current trail - graphite/chalk dots with variation
  for (let i = 0; i < state.trail.length; i++) {
    const tr = state.trail[i];
    if (tr.age > 30) continue;

    // Varied alpha - older dots fade more
    const baseAlpha = Math.max(0.15, 1 - tr.age / 30);
    // Add slight variation based on position
    const alphaJitter = (Math.sin(tr.x * 0.5 + tr.y * 0.3) * 0.1);
    ctx.globalAlpha = Math.max(0.1, baseAlpha + alphaJitter);

    ctx.fillStyle = tr.pastTarget ? COLORS.trailPastTarget : COLORS.trailNormal;

    if (tr.x >= 0 && tr.x < W && tr.y >= 0 && tr.y < H) {
      // Varied radius - slight irregularity like chalk/graphite
      const baseRadius = 2;
      const radiusJitter = Math.sin(i * 1.7 + tr.x * 0.2) * 0.6;
      const radius = baseRadius + radiusJitter;

      // Slight position jitter for hand-drawn feel
      const posJitter = 0.5;
      const jitterX = Math.sin(i * 2.3) * posJitter;
      const jitterY = Math.cos(i * 3.1) * posJitter;

      ctx.beginPath();
      ctx.arc(tr.x + jitterX, tr.y + jitterY, Math.max(1, radius), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Particles as small circles
  for (const p of state.particles) {
    if (p.life < 3) continue;
    ctx.fillStyle = p.color || COLORS.accent1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player as stick figure
  let playerState: 'idle' | 'charging' | 'flying' | 'landing' = 'idle';
  if (state.charging) playerState = 'charging';
  else if (state.flying || state.sliding) playerState = 'flying';
  else if (state.landingFrame > 0) playerState = 'landing';

  const playerColor = state.fellOff ? COLORS.danger : COLORS.player;

  // Check for failure animation
  if (state.failureAnimating && state.failureType && (state.failureType === 'tumble' || state.failureType === 'dive')) {
    drawFailingStickFigure(
      ctx,
      state.px,
      state.py,
      playerColor,
      nowMs,
      state.failureType,
      state.failureFrame,
    );
  } else {
    drawStickFigure(
      ctx,
      state.px,
      state.py,
      playerColor,
      nowMs,
      playerState,
      state.angle,
      { vx: state.vx, vy: state.vy },
      state.chargePower,
    );
  }

  // Scribble energy during charging
  if (state.charging && state.chargePower > 0.1) {
    drawScribbleEnergy(
      ctx,
      state.px,
      state.py,
      state.chargePower,
      COLORS.accent1,
      nowMs,
      'flipbook',
    );
  }

  // Launch burst effect
  if (state.flying && state.launchFrame < 12) {
    drawLaunchBurst(ctx, state.px - 20, state.py, state.launchFrame, COLORS.accent3, 'flipbook');
  }

  // Speed lines during high-velocity flight
  if (state.flying && !state.reduceFx) {
    drawSpeedLines(ctx, state.px, state.py, { vx: state.vx, vy: state.vy }, COLORS.accent3, nowMs, 'flipbook');
  }

  // Impact burst on landing (flipbook style)
  if (state.landingFrame > 0 && state.landingFrame < 10 && !state.reduceFx) {
    drawImpactBurst(ctx, state.px, state.py, COLORS.accent3, state.landingFrame, 'flipbook');
  }

  // Funny failure text
  if (state.failureAnimating && state.failureFrame < 30) {
    const texts = ['NOOO!', 'AHHH!', 'OOF!', 'YIKES!'];
    const text = texts[Math.floor(state.seed % texts.length)];

    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 14px "Comic Sans MS", cursive, sans-serif';
    ctx.textAlign = 'center';

    const bounce = Math.sin(state.failureFrame * 0.3) * 3;
    ctx.fillText(text, state.px, state.py - 30 + bounce);
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

    // Fill based on power
    const fillW = state.chargePower * (barW - 4);
    const powerColor = state.chargePower > 0.8 ? COLORS.danger
      : state.chargePower > 0.5 ? COLORS.highlight
        : COLORS.accent1;
    ctx.fillStyle = powerColor;
    ctx.fillRect(barX + 2, barY + 2, fillW, barH - 4);

    // Angle indicator arc
    const arcX = state.px;
    const arcY = state.py;
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
    const gradient = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.7);
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

  // Achievement popup
  if (state.newAchievement) {
    const achBlink = Math.floor(nowMs / 250) % 2;
    const achX = W / 2 - 60;
    const achY = 10;

    // Banner background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(achX, achY, 120, 28);

    // Banner border
    ctx.strokeStyle = COLORS.highlight;
    ctx.lineWidth = 2;
    ctx.strokeRect(achX, achY, 120, 28);

    // Star
    if (achBlink) {
      const starX = achX + 18;
      const starY = achY + 14;
      ctx.strokeStyle = COLORS.highlight;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 144 - 90) * Math.PI / 180;
        const px = starX + Math.cos(angle) * 6;
        const py = starY + Math.sin(angle) * 6;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Achievement text
    ctx.fillStyle = COLORS.uiText;
    ctx.font = '10px "Comic Sans MS", cursive, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('NEW!', achX + 32, achY + 18);
  }
}

// Noir Ink theme renderer - high contrast, minimal, film noir aesthetic
function renderNoirFrame(ctx: CanvasRenderingContext2D, state: GameState, COLORS: Theme, nowMs: number) {
  // Dark background with subtle gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
  bgGradient.addColorStop(0, COLORS.background);
  bgGradient.addColorStop(1, COLORS.backgroundGradientEnd);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, W, H);

  // Minimal horizon line
  ctx.strokeStyle = COLORS.gridPrimary;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, H - 60);
  ctx.lineTo(W, H - 60);
  ctx.stroke();

  // Ground line - clean, sharp
  const groundY = H - 20;
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, groundY);
  ctx.lineTo(CLIFF_EDGE + 5, groundY);
  ctx.stroke();

  // Subtle ground shadow
  ctx.strokeStyle = COLORS.gridPrimary;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, groundY + 3);
  ctx.lineTo(CLIFF_EDGE - 20, groundY + 3);
  ctx.stroke();

  // Cliff edge - sharp vertical drop
  const edgeX = CLIFF_EDGE;
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(edgeX, groundY);
  ctx.lineTo(edgeX, H);
  ctx.stroke();

  // Danger zone - subtle pulsing glow
  const dangerPulse = Math.sin(nowMs / 300) * 0.3 + 0.7;
  ctx.strokeStyle = `rgba(220, 53, 69, ${dangerPulse * 0.6})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(edgeX - 15, groundY - 5);
  ctx.lineTo(edgeX - 15, groundY - 25);
  ctx.stroke();

  // Best marker - simple vertical line with dot
  if (state.best > 0 && state.best <= CLIFF_EDGE) {
    const flagX = Math.floor(state.best);
    ctx.strokeStyle = COLORS.accent2;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(flagX, groundY);
    ctx.lineTo(flagX, groundY - 25);
    ctx.stroke();

    // Small diamond at top
    ctx.fillStyle = COLORS.accent2;
    ctx.beginPath();
    ctx.moveTo(flagX, groundY - 30);
    ctx.lineTo(flagX + 4, groundY - 25);
    ctx.lineTo(flagX, groundY - 20);
    ctx.lineTo(flagX - 4, groundY - 25);
    ctx.closePath();
    ctx.fill();
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

  // Wind indicator - minimal box
  const windDir = state.wind > 0 ? 1 : -1;
  const windStrength = Math.abs(state.wind);

  const windBoxX = W - 70;
  const windBoxY = 10;
  const windBoxW = 60;
  const windBoxH = 24;

  ctx.strokeStyle = COLORS.accent3;
  ctx.lineWidth = 1;
  ctx.strokeRect(windBoxX, windBoxY, windBoxW, windBoxH);

  // Arrow
  const arrowY = windBoxY + 14;
  const arrowLen = 10 + windStrength * 100;
  ctx.strokeStyle = COLORS.accent1;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(windBoxX + windBoxW/2 - arrowLen/2 * windDir, arrowY);
  ctx.lineTo(windBoxX + windBoxW/2 + arrowLen/2 * windDir, arrowY);
  ctx.stroke();

  // Arrowhead
  ctx.fillStyle = COLORS.accent1;
  ctx.beginPath();
  ctx.moveTo(windBoxX + windBoxW/2 + arrowLen/2 * windDir, arrowY);
  ctx.lineTo(windBoxX + windBoxW/2 + (arrowLen/2 - 6) * windDir, arrowY - 4);
  ctx.lineTo(windBoxX + windBoxW/2 + (arrowLen/2 - 6) * windDir, arrowY + 4);
  ctx.closePath();
  ctx.fill();

  // Ghost trail (best attempt) - faint dashes
  if (state.bestTrail.length > 4) {
    ctx.strokeStyle = COLORS.star;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    const ghostPoints = state.bestTrail.filter((_, i) => i % 4 === 0);
    for (let i = 0; i < ghostPoints.length; i++) {
      if (i === 0) ctx.moveTo(ghostPoints[i].x, ghostPoints[i].y);
      else ctx.lineTo(ghostPoints[i].x, ghostPoints[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Ghost trail - sharper, fewer figures
  if (state.flying && state.ghostTrail.length > 0) {
    const trailLen = state.ghostTrail.length;
    for (let i = Math.max(0, trailLen - 6); i < trailLen; i++) {
      const ghost = state.ghostTrail[i];
      const opacity = 0.5 - (trailLen - i - 1) * 0.15;
      if (opacity > 0.1) {
        drawGhostFigure(
          ctx,
          ghost.x,
          ghost.y,
          COLORS.accent3,
          opacity,
          nowMs,
          ghost.angle,
          'noir',
        );
      }
    }
  }

  // Current trail - ink droplets with occasional splatter
  for (let i = 0; i < state.trail.length; i++) {
    const tr = state.trail[i];
    if (tr.age > 25) continue;

    const alpha = Math.max(0.35, 1 - tr.age / 25);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = tr.pastTarget ? COLORS.trailPastTarget : COLORS.trailNormal;

    if (tr.x >= 0 && tr.x < W && tr.y >= 0 && tr.y < H) {
      // Main droplet
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Occasional ink splatter (every ~5th point, when fresh)
      if (i % 5 === 0 && tr.age < 10) {
        drawInkSplatter(ctx, tr.x, tr.y, ctx.fillStyle as string, 1.5, nowMs + i);
      }

      // Elongated smear in velocity direction (for faster points)
      if (i > 0 && i < state.trail.length - 1 && tr.age < 5) {
        const prev = state.trail[i - 1];
        const dx = tr.x - prev.x;
        const dy = tr.y - prev.y;
        const speed = Math.sqrt(dx * dx + dy * dy);

        if (speed > 3) {
          ctx.globalAlpha = alpha * 0.4;
          ctx.beginPath();
          ctx.moveTo(tr.x, tr.y);
          ctx.lineTo(tr.x - dx * 0.3, tr.y - dy * 0.3);
          ctx.lineWidth = 1;
          ctx.strokeStyle = ctx.fillStyle as string;
          ctx.stroke();
        }
      }
    }
  }
  ctx.globalAlpha = 1;

  // Particles
  for (const p of state.particles) {
    if (p.life < 3) continue;
    ctx.fillStyle = p.color || COLORS.accent1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player stick figure
  let playerState: 'idle' | 'charging' | 'flying' | 'landing' = 'idle';
  if (state.charging) playerState = 'charging';
  else if (state.flying || state.sliding) playerState = 'flying';
  else if (state.landingFrame > 0) playerState = 'landing';

  const playerColor = state.fellOff ? COLORS.danger : COLORS.player;

  if (state.failureAnimating && state.failureType && (state.failureType === 'tumble' || state.failureType === 'dive')) {
    drawFailingStickFigure(ctx, state.px, state.py, playerColor, nowMs, state.failureType, state.failureFrame);
  } else {
    drawStickFigure(ctx, state.px, state.py, playerColor, nowMs, playerState, state.angle, { vx: state.vx, vy: state.vy }, state.chargePower);
  }

  // Scribble energy during charging
  if (state.charging && state.chargePower > 0.2) {
    drawScribbleEnergy(ctx, state.px, state.py, state.chargePower * 0.7, COLORS.accent1, nowMs, 'noir');
  }

  // Launch burst (more subtle for noir)
  if (state.flying && state.launchFrame < 8) {
    drawLaunchBurst(ctx, state.px - 15, state.py, state.launchFrame, COLORS.accent3, 'noir');
  }

  // Speed lines (sharper for noir)
  if (state.flying && !state.reduceFx) {
    drawSpeedLines(ctx, state.px, state.py, { vx: state.vx, vy: state.vy }, COLORS.accent3, nowMs, 'noir');
  }

  // Impact burst on landing (noir style)
  if (state.landingFrame > 0 && state.landingFrame < 10 && !state.reduceFx) {
    drawImpactBurst(ctx, state.px, state.py, COLORS.accent3, state.landingFrame, 'noir');
  }

  // Failure text
  if (state.failureAnimating && state.failureFrame < 30) {
    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', state.px, state.py - 25);
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

    // Angle line
    const arcX = state.px;
    const arcY = state.py;
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

  // Achievement popup
  if (state.newAchievement) {
    const achX = W / 2 - 50;
    const achY = 8;

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(achX, achY, 100, 22);
    ctx.strokeStyle = COLORS.highlight;
    ctx.lineWidth = 1;
    ctx.strokeRect(achX, achY, 100, 22);

    ctx.fillStyle = COLORS.highlight;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ NEW', achX + 50, achY + 15);
  }

  // Apply film grain and vignette (always on for Noir, intensity varies with reduceFx)
  const grainIntensity = state.reduceFx ? 0.3 : 0.6;
  const vignetteIntensity = state.reduceFx ? 0.4 : 0.7;

  drawFilmGrain(ctx, W, H, nowMs, grainIntensity);
  drawVignette(ctx, W, H, vignetteIntensity);
}
