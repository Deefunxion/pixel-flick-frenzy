import type { Theme } from '@/game/themes';
import { CLIFF_EDGE, H, MAX_ANGLE, MIN_ANGLE, OPTIMAL_ANGLE, W } from '@/game/constants';
import type { GameState } from './types';

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

  const horizonY = H * 0.55;
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, W, Math.floor(horizonY * 0.5));
  ctx.fillStyle = COLORS.horizon;
  ctx.fillRect(0, Math.floor(horizonY * 0.5), W, Math.floor(horizonY * 0.5));
  ctx.fillStyle = COLORS.backgroundGradientEnd;
  ctx.fillRect(0, Math.floor(horizonY), W, H - Math.floor(horizonY));

  for (const star of state.stars) {
    const twinkle = Math.floor(nowMs / 300 + star.x * 10) % 3;
    if (twinkle > 0) {
      ctx.fillStyle = COLORS.star;
      ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
    }
  }

  ctx.fillStyle = COLORS.gridSecondary;

  for (let i = 0; i < 8; i++) {
    const progress = i / 8;
    const yPos = horizonY + (H - horizonY) * Math.pow(progress, 0.7) + Math.floor(state.gridOffset * progress);
    if (yPos < H - 3) {
      ctx.fillRect(0, Math.floor(yPos), W, 1);
    }
  }

  const vanishX = Math.floor(W / 2);
  for (let i = -6; i <= 6; i++) {
    const topX = vanishX + i * 4;
    const bottomX = vanishX + i * 20;
    for (let y = Math.floor(horizonY); y < H - 3; y += 2) {
      const t = (y - horizonY) / (H - 3 - horizonY);
      const x = Math.floor(topX + (bottomX - topX) * t);
      ctx.fillRect(x, y, 1, 1);
    }
  }

  ctx.fillStyle = COLORS.gridPrimary;
  ctx.fillRect(0, Math.floor(horizonY), W, 1);

  ctx.fillStyle = COLORS.accent1;
  ctx.fillRect(0, H - 3, CLIFF_EDGE + 1, 3);

  ctx.fillStyle = COLORS.accent2;
  ctx.fillRect(10 - 4, H - 5, 9, 2);
  ctx.fillStyle = COLORS.accent4;
  ctx.fillRect(10 - 2, H - 5, 1, 2);
  ctx.fillRect(10 + 2, H - 5, 1, 2);

  const t = nowMs / 200;
  ctx.fillStyle = COLORS.danger;
  for (let i = 0; i < 6; i++) {
    if ((Math.floor(t) + i) % 2 === 0) {
      ctx.fillRect(CLIFF_EDGE - 1, H - 6 - i, 1, 1);
    }
  }

  if (state.best > 0 && state.best <= CLIFF_EDGE) {
    ctx.fillStyle = COLORS.accent3;
    ctx.fillRect(Math.floor(state.best), H - 9, 1, 6);
    ctx.fillRect(Math.floor(state.best) - 1, H - 9, 3, 1);
  }

  if (state.zenoTarget > 0 && state.zenoTarget <= CLIFF_EDGE) {
    const zenoPulse = Math.floor(nowMs / 300) % 2;
    ctx.fillStyle = zenoPulse ? COLORS.accent2 : COLORS.highlight;
    ctx.fillRect(Math.floor(state.zenoTarget), H - 12, 1, 9);
    ctx.fillRect(Math.floor(state.zenoTarget) - 1, H - 13, 3, 1);
    ctx.fillRect(Math.floor(state.zenoTarget), H - 14, 1, 1);
  }

  // Wind indicator
  const windDir = state.wind > 0 ? 1 : -1;
  const windStrength = Math.abs(state.wind);
  const windAnim = Math.sin(nowMs / 150) * 0.5;

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(W - 46, 1, 44, 14);
  ctx.strokeStyle = COLORS.accent3;
  ctx.lineWidth = 1;
  ctx.strokeRect(W - 46, 1, 44, 14);

  const arrowX = W - 24;
  ctx.fillStyle = COLORS.accent2;
  ctx.fillRect(arrowX - 8, 7, 16, 1);

  ctx.fillStyle = COLORS.accent2;
  if (windDir > 0) {
    ctx.fillRect(arrowX + 6, 6, 2, 1);
    ctx.fillRect(arrowX + 6, 8, 2, 1);
    ctx.fillRect(arrowX + 8, 7, 1, 1);
  } else {
    ctx.fillRect(arrowX - 8, 6, 2, 1);
    ctx.fillRect(arrowX - 8, 8, 2, 1);
    ctx.fillRect(arrowX - 9, 7, 1, 1);
  }

  const numDots = Math.max(1, Math.ceil(windStrength * 60));
  for (let i = 0; i < Math.min(numDots, 5); i++) {
    const wobble = Math.sin(nowMs / 80 + i * 0.5) * 0.5;
    ctx.fillStyle = COLORS.accent1;
    ctx.fillRect(arrowX + windDir * (10 + i * 3) + windAnim, 7 + wobble, 1, 1);
  }

  // Ghost trail
  if (state.bestTrail.length > 1) {
    ctx.fillStyle = COLORS.accent3;
    for (let i = 0; i < state.bestTrail.length; i += 2) {
      const g = state.bestTrail[i];
      if (g.x >= 0 && g.x < W && g.y >= 0 && g.y < H) {
        ctx.fillRect(Math.floor(g.x), Math.floor(g.y), 1, 1);
      }
    }
  }

  for (const tr of state.trail) {
    if (tr.age > 30) continue;
    ctx.fillStyle = tr.pastTarget ? COLORS.trailPastTarget : COLORS.trailNormal;
    if (tr.x >= 0 && tr.x < W && tr.y >= 0 && tr.y < H) {
      ctx.fillRect(Math.floor(tr.x), Math.floor(tr.y), 1, 1);
    }
  }

  for (const p of state.particles) {
    if (p.life < 3) continue;
    ctx.fillStyle = p.color || COLORS.accent1;
    ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 1);
  }

  let pxW = 1, pxH = 1;
  if (state.flying) {
    if (state.vy < -1 || state.vy > 1) {
      pxW = 1; pxH = 2;
    }
  }
  if (state.landingFrame > 4) {
    pxW = 2; pxH = 1;
  }

  const drawX = Math.max(0, Math.min(W - pxW, Math.floor(state.px)));
  const drawY = Math.max(0, Math.min(H - pxH, Math.floor(state.py) - (pxH - 1)));

  if (state.fellOff) {
    ctx.fillStyle = COLORS.danger;
  } else if (state.charging) {
    const pulse = Math.floor(nowMs / 100) % 2;
    ctx.fillStyle = pulse ? COLORS.highlight : COLORS.player;
  } else {
    ctx.fillStyle = COLORS.player;
  }
  ctx.fillRect(drawX, drawY, pxW, pxH);

  if (state.charging) {
    const angleRad = (state.angle * Math.PI) / 180;
    const lineLen = Math.floor(8 + state.chargePower * 15);
    const startX = Math.floor(state.px);
    const startY = Math.floor(state.py);

    ctx.fillStyle = COLORS.accent3;
    for (let a = MIN_ANGLE; a <= MAX_ANGLE; a += 10) {
      const rad = (a * Math.PI) / 180;
      ctx.fillRect(
        Math.floor(startX + Math.cos(rad) * 14),
        Math.floor(startY - Math.sin(rad) * 14),
        1, 1,
      );
    }

    ctx.fillStyle = COLORS.highlight;
    for (let i = 0; i < lineLen; i += 2) {
      const px = startX + Math.cos(angleRad) * i;
      const py = startY - Math.sin(angleRad) * i;
      ctx.fillRect(Math.floor(px), Math.floor(py), 1, 1);
    }

    const endX = startX + Math.cos(angleRad) * lineLen;
    const endY = startY - Math.sin(angleRad) * lineLen;
    ctx.fillStyle = COLORS.accent1;
    ctx.fillRect(Math.floor(endX), Math.floor(endY), 2, 2);

    const optRad = (OPTIMAL_ANGLE * Math.PI) / 180;
    const optBlink = Math.floor(nowMs / 200) % 2;
    if (optBlink) {
      ctx.fillStyle = COLORS.highlight;
      ctx.fillRect(
        Math.floor(startX + Math.cos(optRad) * 18),
        Math.floor(startY - Math.sin(optRad) * 18),
        2, 2,
      );
    }

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(3, 3, 42, 8);
    ctx.fillStyle = COLORS.accent3;
    ctx.fillRect(3, 3, 42, 1);
    ctx.fillRect(3, 10, 42, 1);
    ctx.fillRect(3, 3, 1, 8);
    ctx.fillRect(44, 3, 1, 8);

    const powerColor = state.chargePower > 0.8 ? COLORS.accent1
      : state.chargePower > 0.5 ? COLORS.highlight
      : COLORS.accent2;
    ctx.fillStyle = powerColor;
    ctx.fillRect(5, 5, Math.floor(state.chargePower * 38), 4);

    ctx.fillStyle = COLORS.accent4;
    const tens = Math.floor(Math.round(state.angle) / 10);
    for (let i = 0; i < tens; i++) {
      ctx.fillRect(5 + i * 3, 13, 2, 2);
    }
  }

  if (state.flying && !state.nudgeUsed) {
    const nudgeBlink = Math.floor(nowMs / 150) % 2;
    ctx.fillStyle = nudgeBlink ? COLORS.highlight : COLORS.accent2;
    ctx.fillRect(4, H - 13, 12, 8);
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(6, H - 11, 8, 4);
    ctx.fillStyle = COLORS.highlight;
    ctx.fillRect(7, H - 10, 6, 2);
  }

  if ((state.flying || state.sliding) && state.px > 120) {
    const dangerBlink = Math.floor(nowMs / 200) % 2;
    if (dangerBlink) {
      ctx.fillStyle = COLORS.danger;
      ctx.fillRect(0, 0, W, 1);
      ctx.fillRect(0, H - 1, W, 1);
      ctx.fillRect(0, 0, 1, H);
      ctx.fillRect(W - 1, 0, 1, H);
    }
  }

  if ((state.flying || state.sliding) && state.currentMultiplier > 1.01) {
    const mult = state.currentMultiplier;

    let multColor = COLORS.accent2;
    if (mult > 3) multColor = COLORS.accent1;
    else if (mult > 2) multColor = COLORS.highlight;

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(2, 18, 28, 10);
    ctx.fillStyle = multColor;
    ctx.fillRect(2, 18, 28, 1);
    ctx.fillRect(2, 27, 28, 1);
    ctx.fillRect(2, 18, 1, 10);
    ctx.fillRect(29, 18, 1, 10);

    ctx.fillStyle = COLORS.uiText;
    ctx.fillRect(5, 21, 1, 1);
    ctx.fillRect(7, 21, 1, 1);
    ctx.fillRect(6, 22, 1, 1);
    ctx.fillRect(5, 23, 1, 1);
    ctx.fillRect(7, 23, 1, 1);

    ctx.fillStyle = multColor;
    const bars = Math.min(4, Math.floor(mult));
    for (let i = 0; i < bars; i++) {
      ctx.fillRect(10 + i * 5, 20, 3, 6);
    }
  }

  // Risk meter
  if (state.flying || state.sliding || state.charging) {
    const risk = Math.max(0, Math.min(1, (state.px - 50) / (CLIFF_EDGE - 50)));
    const barX = W - 6;
    const barY = 18;
    const barH = 40;

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(barX, barY, 4, barH);
    ctx.fillStyle = COLORS.accent3;
    ctx.fillRect(barX, barY, 4, 1);
    ctx.fillRect(barX, barY + barH - 1, 4, 1);
    ctx.fillRect(barX, barY, 1, barH);
    ctx.fillRect(barX + 3, barY, 1, barH);

    const fillH = Math.floor((barH - 2) * risk);
    const fillY = barY + (barH - 1) - fillH;
    const c = risk > 0.75 ? COLORS.danger : (risk > 0.5 ? COLORS.highlight : COLORS.accent2);
    ctx.fillStyle = c;
    ctx.fillRect(barX + 1, fillY, 2, fillH);
  }

  if (state.slowMo > 0.1) {
    ctx.fillStyle = COLORS.accent2;
    ctx.fillRect(0, 0, 4, 1);
    ctx.fillRect(0, 0, 1, 4);
    ctx.fillRect(W - 4, 0, 4, 1);
    ctx.fillRect(W - 1, 0, 1, 4);
    ctx.fillRect(0, H - 1, 4, 1);
    ctx.fillRect(0, H - 4, 1, 4);
    ctx.fillRect(W - 4, H - 1, 4, 1);
    ctx.fillRect(W - 1, H - 4, 1, 4);
  }

  if (!state.reduceFx && state.screenFlash > 0.5) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, 2);
    ctx.fillRect(0, H - 2, W, 2);
    ctx.fillRect(0, 0, 2, H);
    ctx.fillRect(W - 2, 0, 2, H);
  }

  if (state.touchFeedback > 0.3) {
    ctx.fillStyle = COLORS.accent2;
    ctx.fillRect(W / 2 - 3, H / 2, 7, 1);
    ctx.fillRect(W / 2, H / 2 - 3, 1, 7);
  }

  if (state.touchActive && !state.flying && !state.sliding && !state.charging) {
    ctx.fillStyle = COLORS.accent2;
    const px = Math.floor(state.px);
    const py = Math.floor(state.py);
    ctx.fillRect(px - 4, py - 4, 9, 1);
    ctx.fillRect(px - 4, py + 4, 9, 1);
    ctx.fillRect(px - 4, py - 4, 1, 9);
    ctx.fillRect(px + 4, py - 4, 1, 9);
  }

  if (state.newAchievement) {
    const achBlink = Math.floor(nowMs / 250) % 2;

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(W / 2 - 45, 2, 90, 18);

    ctx.fillStyle = COLORS.highlight;
    ctx.fillRect(W / 2 - 45, 2, 90, 1);
    ctx.fillRect(W / 2 - 45, 19, 90, 1);
    ctx.fillRect(W / 2 - 45, 2, 1, 18);
    ctx.fillRect(W / 2 + 44, 2, 1, 18);

    if (achBlink) {
      ctx.fillStyle = COLORS.highlight;
      ctx.fillRect(W / 2 - 40, 9, 1, 1);
      ctx.fillRect(W / 2 - 41, 10, 3, 1);
      ctx.fillRect(W / 2 - 42, 11, 5, 1);
      ctx.fillRect(W / 2 - 41, 12, 1, 1);
      ctx.fillRect(W / 2 - 39, 12, 1, 1);
    }

    ctx.fillStyle = COLORS.accent2;
    ctx.fillRect(W / 2 - 34, 7, 3, 1);
    ctx.fillRect(W / 2 - 34, 10, 3, 1);
    ctx.fillRect(W / 2 - 34, 13, 3, 1);
  }

  ctx.restore();
}
