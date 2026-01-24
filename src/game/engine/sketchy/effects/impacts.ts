// Impact effects for sketchy/hand-drawn style

import { SCALED_LINE_WEIGHTS } from '../constants';
import { seededRandom } from '../wobble';
import { drawHandCircle } from '../primitives/circle';

// Draw impact burst for landing (styled per theme)
export function drawImpactBurst(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  frame: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  // Only draw for first few frames of landing
  if (frame > 8) return;

  const progress = frame / 8; // 0 to 1
  const baseAlpha = 1 - progress;

  if (themeKind === 'flipbook') {
    // Flipbook: graphite dust puffs - small circular bursts
    const puffCount = 8;
    for (let i = 0; i < puffCount; i++) {
      const angle = (i / puffCount) * Math.PI + Math.PI; // Bottom half arc
      const dist = 8 + progress * 15;
      const puffX = x + Math.cos(angle) * dist;
      const puffY = y + Math.sin(angle) * dist * 0.5; // Flattened

      ctx.globalAlpha = baseAlpha * 0.4;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(puffX, puffY, 4 + progress * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Small radial lines
    ctx.globalAlpha = baseAlpha * 0.5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI + Math.PI * 0.1;
      const innerR = 5;
      const outerR = 18 + progress * 12;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * innerR, y + Math.sin(angle) * innerR * 0.5);
      ctx.lineTo(x + Math.cos(angle) * outerR, y + Math.sin(angle) * outerR * 0.5);
      ctx.stroke();
    }
  } else {
    // Noir: ink blot burst - higher contrast, fewer drops
    const dropCount = 6;
    for (let i = 0; i < dropCount; i++) {
      const angle = (i / dropCount) * Math.PI + Math.PI;
      const dist = 6 + progress * 12;
      const dropX = x + Math.cos(angle) * dist;
      const dropY = y + Math.sin(angle) * dist * 0.4;

      ctx.globalAlpha = baseAlpha * 0.7;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(dropX, dropY, 1.5 + (1 - progress) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Single sharp line
    ctx.globalAlpha = baseAlpha * 0.6;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 8 - progress * 5, y);
    ctx.lineTo(x + 8 + progress * 5, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

// Draw ink splatter for Noir trajectory
export function drawInkSplatter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  size: number = 3,
  nowMs: number = 0,
) {
  const splatCount = 3 + Math.floor(seededRandom(x + y + nowMs * 0.001) * 3);

  for (let i = 0; i < splatCount; i++) {
    const offsetX = (seededRandom(i + x * 10) - 0.5) * size * 2;
    const offsetY = (seededRandom(i + y * 10) - 0.5) * size * 2;
    const splatSize = size * (0.3 + seededRandom(i * 3) * 0.7);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + offsetX, y + offsetY, splatSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw radiating crack lines for superhero landing impact
export function drawGroundCracks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  color: string,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  if (frame > 15) return;

  const progress = frame / 15;
  const alpha = 1 - progress * 0.8;
  const crackCount = 12;
  const maxLen = 55 + (1 - progress) * 35;

  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? SCALED_LINE_WEIGHTS.effects : SCALED_LINE_WEIGHTS.details;
  ctx.lineCap = 'round';
  ctx.globalAlpha = alpha * 0.9;

  for (let i = 0; i < crackCount; i++) {
    const baseAngle = (i / crackCount) * Math.PI + Math.PI * 0.1;
    const angleVariation = (seededRandom(i * 17) - 0.5) * 0.3;
    const angle = baseAngle + angleVariation;
    const len = maxLen * (0.6 + seededRandom(i * 23) * 0.4);

    ctx.beginPath();
    ctx.moveTo(x, y);

    // Main crack line with slight wobble
    const midX = x + Math.cos(angle) * len * 0.5;
    const midY = y + Math.sin(angle) * len * 0.5;
    const wobble = (seededRandom(i * 31) - 0.5) * 4;

    ctx.lineTo(midX + wobble, midY + wobble * 0.5);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();

    // Branch cracks
    if (seededRandom(i * 41) > 0.5) {
      const branchAngle = angle + (seededRandom(i * 47) - 0.5) * 0.8;
      const branchLen = len * 0.4;
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(midX + Math.cos(branchAngle) * branchLen, midY + Math.sin(branchAngle) * branchLen);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
}

// Draw scribble dust clouds for landing impact
export function drawDustPuffs(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  color: string,
  nowMs: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  if (frame > 12) return;

  const progress = frame / 12;
  const alpha = 1 - progress;
  const puffCount = 14;
  const spread = 25 + progress * 45;
  const rise = progress * 20;

  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? SCALED_LINE_WEIGHTS.effects : SCALED_LINE_WEIGHTS.details;
  ctx.globalAlpha = alpha * 0.7;

  for (let i = 0; i < puffCount; i++) {
    const angle = (i / puffCount) * Math.PI + Math.PI * 0.2;
    const dist = spread * (0.7 + seededRandom(i * 13) * 0.3);
    const puffX = x + Math.cos(angle) * dist;
    const puffY = y - rise + Math.sin(angle) * dist * 0.3;
    const puffSize = 8 + (1 - progress) * 8 + seededRandom(i * 19) * 6;

    // Draw wobbly cloud shape
    drawHandCircle(ctx, puffX, puffY, puffSize, color, 1, nowMs + i * 50, false);

    // Add smaller satellite puffs
    if (seededRandom(i * 29) > 0.4) {
      const satAngle = angle + (seededRandom(i * 37) - 0.5) * 1;
      const satDist = puffSize * 1.2;
      drawHandCircle(
        ctx,
        puffX + Math.cos(satAngle) * satDist,
        puffY + Math.sin(satAngle) * satDist,
        puffSize * 0.5,
        color,
        1,
        nowMs + i * 70,
        false
      );
    }
  }

  ctx.globalAlpha = 1;
}
