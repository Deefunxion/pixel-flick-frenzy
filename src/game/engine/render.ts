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

  renderFlipbookFrame(ctx, state, COLORS, nowMs);

  ctx.restore();
}

function renderFlipbookFrame(ctx: CanvasRenderingContext2D, state: GameState, COLORS: Theme, nowMs: number) {
  // Paper background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, W, H);

  // Paper texture
  if (!state.reduceFx) {
    drawPaperTexture(ctx, W, H, nowMs);
  }

  // Ruled lines (notebook paper)
  drawRuledLines(ctx, W, H, COLORS.gridSecondary, COLORS.accent4, nowMs);

  // Spiral holes on left margin
  drawSpiralHoles(ctx, H, COLORS.accent3, nowMs);

  // Ground line - hand-drawn style
  const groundY = H - 20;
  drawHandLine(ctx, 40, groundY, CLIFF_EDGE + 5, groundY, COLORS.player, 2.5, nowMs);

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


  // Cliff edge - jagged hand-drawn line going down
  const edgeX = CLIFF_EDGE;
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(edgeX, groundY);
  ctx.lineTo(edgeX + 3, groundY + 8);
  ctx.lineTo(edgeX - 2, groundY + 16);
  ctx.lineTo(edgeX + 4, groundY + 24);
  ctx.lineTo(edgeX, H);
  ctx.stroke();

  // Danger zone warning - hand-drawn exclamation
  const blink = Math.floor(nowMs / 400) % 2;
  if (blink) {
    ctx.strokeStyle = COLORS.danger;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(edgeX - 8, groundY - 30);
    ctx.lineTo(edgeX - 8, groundY - 15);
    ctx.stroke();
    drawHandCircle(ctx, edgeX - 8, groundY - 8, 2, COLORS.danger, 2, nowMs, true);
  }

  // Best marker - checkered flag
  if (state.best > 0 && state.best <= CLIFF_EDGE) {
    const flagX = Math.floor(state.best);
    drawCheckeredFlag(ctx, flagX, groundY, 18, 14, COLORS.accent2, 1.5, nowMs);
  }

  // Zeno target marker - hand-drawn star with line
  if (state.zenoTarget > 0 && state.zenoTarget <= CLIFF_EDGE) {
    const targetX = Math.floor(state.zenoTarget);
    const pulse = Math.sin(nowMs / 300) * 2;

    // Vertical dashed line to ground
    ctx.strokeStyle = COLORS.highlight;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(targetX, groundY);
    ctx.lineTo(targetX, groundY - 35);
    ctx.stroke();
    ctx.setLineDash([]);

    // Star shape
    const starY = groundY - 42 + pulse;
    ctx.strokeStyle = COLORS.highlight;
    ctx.lineWidth = 2;
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

  // Current trail - small dots
  ctx.fillStyle = COLORS.trailNormal;
  for (const tr of state.trail) {
    if (tr.age > 30) continue;
    const alpha = Math.max(0.2, 1 - tr.age / 30);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = tr.pastTarget ? COLORS.trailPastTarget : COLORS.trailNormal;
    if (tr.x >= 0 && tr.x < W && tr.y >= 0 && tr.y < H) {
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, 2, 0, Math.PI * 2);
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
    );
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
