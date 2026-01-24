// Zeno character form drawings for sketchy/hand-drawn style

import { CHARACTER_SCALE, SCALED_LINE_WEIGHTS } from '../constants';
import { seededRandom } from '../wobble';
import { drawHandCircle } from '../primitives/circle';
import { drawInkStroke } from '../primitives/inkStroke';
import { drawSpeedLines, drawSpringLines, drawEnergySpirals } from '../effects/motion';
import { drawGroundCracks, drawDustPuffs, drawImpactBurst } from '../effects/impacts';

// Draw Zeno in "The Coil" charging pose - compressed spring ready to explode
export function drawZenoCoil(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  nowMs: number,
  chargePower: number, // 0-1
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  const scale = CHARACTER_SCALE.normal;
  const lineWidth = themeKind === 'flipbook' ? SCALED_LINE_WEIGHTS.body : SCALED_LINE_WEIGHTS.body * 1.5;

  // Squash effect - compress vertically, expand horizontally
  const squashAmount = chargePower * 0.3;
  const scaleX = 1 + squashAmount * 0.43;
  const scaleY = 1 - squashAmount;

  // Lower center of gravity as charge builds
  const yOffset = 3 + chargePower * 10;
  const baseY = y + yOffset;

  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scaleX, scaleY);
  ctx.translate(-x, -baseY);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Body geometry - deep crouch
  const headRadius = 8 * scale;
  const crouchDepth = 8 + chargePower * 12;

  // Head position - lower and more forward
  const headX = x - chargePower * 3;
  const headY = baseY - 30 * scale + crouchDepth * 0.3;

  // Helper to generate points for ink strokes
  const getLinePoints = (x1: number, y1: number, x2: number, y2: number, steps = 10) => {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      pts.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
    }
    return pts;
  };

  const getQuadPoints = (x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, steps = 12) => {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const invT = 1 - t;
      const px = invT * invT * x1 + 2 * invT * t * cx + t * t * x2;
      const py = invT * invT * y1 + 2 * invT * t * cy + t * t * y2;
      pts.push({ x: px, y: py });
    }
    return pts;
  };

  if (themeKind === 'noir') {
    // === NOIR INK RENDERING ===
    const headPoints = [];
    for (let i = 0; i <= 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const deform = (seededRandom(i) - 0.5) * 0.15 + (seededRandom(i + 100) - 0.5) * 0.05;
      const r = headRadius * (1 + deform);
      headPoints.push({
        x: headX + Math.cos(angle) * r,
        y: headY + Math.sin(angle) * r
      });
    }
    drawInkStroke(ctx, headPoints, color, lineWidth * 1.2, nowMs);

    ctx.beginPath();
    ctx.arc(headX - headRadius * 0.35, headY - 1, 2.5, 0, Math.PI * 2);
    ctx.arc(headX + headRadius * 0.35, headY - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    const mouthPoints = getQuadPoints(headX - 3, headY + 3, headX, headY + 4, headX + 2, headY + 3, 5);
    drawInkStroke(ctx, mouthPoints, color, lineWidth * 0.5, nowMs);

    const torsoTopY = headY + headRadius + 2;
    const torsoBottomY = baseY - 5 * scale;
    const torsoTwist = chargePower * 4;
    const torsoPoints = getQuadPoints(headX, torsoTopY, x - torsoTwist, (torsoTopY + torsoBottomY) / 2, x, torsoBottomY, 12);
    drawInkStroke(ctx, torsoPoints, color, lineWidth * 1.2, nowMs);

    const shoulderY = torsoTopY + 6 * scale;
    const armLen = 16 * scale;

    const backArmAngle = -0.8 - chargePower * 0.7;
    const backArmX = x + Math.cos(backArmAngle + Math.PI) * armLen;
    const backArmY = shoulderY + Math.sin(backArmAngle + Math.PI) * armLen;
    const backArmPts = getLinePoints(x - 2, shoulderY, backArmX, backArmY, 10);
    drawInkStroke(ctx, backArmPts, color, lineWidth, nowMs);

    ctx.beginPath(); ctx.arc(backArmX, backArmY, 4, 0, Math.PI * 2); ctx.fill();

    const frontArmAngle = -0.3 + chargePower * 0.2;
    const frontArmX = x + Math.cos(frontArmAngle) * armLen * 0.8;
    const frontArmY = shoulderY + Math.sin(frontArmAngle) * armLen * 0.8;
    const frontArmPts = getLinePoints(x + 2, shoulderY, frontArmX, frontArmY, 10);
    drawInkStroke(ctx, frontArmPts, color, lineWidth, nowMs);

    const hipY = torsoBottomY;

    const frontKneeX = x + 5; const frontKneeY = hipY + 8;
    const frontFootX = x + 3; const frontFootY = baseY;
    const frontLegPts = [
      ...getLinePoints(x, hipY, frontKneeX, frontKneeY, 6),
      ...getLinePoints(frontKneeX, frontKneeY, frontFootX, frontFootY, 6)
    ];
    drawInkStroke(ctx, frontLegPts, color, lineWidth, nowMs);

    const backLegExtensionNoir = 15 + chargePower * 20;
    const backFootXNoir = x - backLegExtensionNoir; const backFootYNoir = baseY + 2;
    const backKneeXNoir = x - backLegExtensionNoir * 0.5; const backKneeYNoir = hipY + 4;
    const backLegPts = [
      ...getLinePoints(x, hipY, backKneeXNoir, backKneeYNoir, 6),
      ...getLinePoints(backKneeXNoir, backKneeYNoir, backFootXNoir, backFootYNoir, 6)
    ];
    drawInkStroke(ctx, backLegPts, color, lineWidth, nowMs);

  } else {
    // === FLIPBOOK ORIGINAL RENDERING ===
    drawHandCircle(ctx, headX, headY, headRadius, color, lineWidth, nowMs, false);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(headX - headRadius * 0.35, headY - 1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headX + headRadius * 0.35, headY - 1, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(headX - 3, headY + 3);
    ctx.lineTo(headX + 2, headY + 3);
    ctx.stroke();

    const torsoTopY = headY + headRadius + 2;
    const torsoBottomY = baseY - 5 * scale;
    const torsoTwist = chargePower * 4;

    ctx.beginPath();
    ctx.moveTo(headX, torsoTopY);
    ctx.quadraticCurveTo(x - torsoTwist, (torsoTopY + torsoBottomY) / 2, x, torsoBottomY);
    ctx.stroke();

    const shoulderY = torsoTopY + 6 * scale;
    const armLen = 16 * scale;

    const backArmAngle = -0.8 - chargePower * 0.7;
    const backArmX = x + Math.cos(backArmAngle + Math.PI) * armLen;
    const backArmY = shoulderY + Math.sin(backArmAngle + Math.PI) * armLen;

    ctx.beginPath();
    ctx.moveTo(x - 2, shoulderY);
    ctx.lineTo(backArmX, backArmY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(backArmX, backArmY, 3, 0, Math.PI * 2);
    ctx.fill();

    const frontArmAngle = -0.3 + chargePower * 0.2;
    const frontArmX = x + Math.cos(frontArmAngle) * armLen * 0.8;
    const frontArmY = shoulderY + Math.sin(frontArmAngle) * armLen * 0.8;

    ctx.beginPath();
    ctx.moveTo(x + 2, shoulderY);
    ctx.lineTo(frontArmX, frontArmY);
    ctx.stroke();

    const hipY = torsoBottomY;

    const frontKneeX = x + 5;
    const frontKneeY = hipY + 8;
    const frontFootX = x + 3;
    const frontFootY = baseY;

    ctx.beginPath();
    ctx.moveTo(x, hipY);
    ctx.lineTo(frontKneeX, frontKneeY);
    ctx.lineTo(frontFootX, frontFootY);
    ctx.stroke();

    const backLegExtensionFlip = 15 + chargePower * 20;
    const backFootXFlip = x - backLegExtensionFlip;
    const backFootYFlip = baseY + 2;
    const backKneeXFlip = x - backLegExtensionFlip * 0.5;
    const backKneeYFlip = hipY + 4;

    ctx.beginPath();
    ctx.moveTo(x, hipY);
    ctx.lineTo(backKneeXFlip, backKneeYFlip);
    ctx.lineTo(backFootXFlip, backFootYFlip);
    ctx.stroke();
  }

  ctx.restore();

  // Energy effects (drawn without transform)
  const effectIntensity = themeKind === 'noir' ? chargePower * 1.5 : chargePower;
  const backLegExtension = 15 + chargePower * 20;
  const backFootX = x - backLegExtension;

  const safePower = Math.min(Math.max(chargePower, 0), 1.0);
  const safeIntensity = Math.min(Math.max(effectIntensity, 0), 1.5);

  drawSpringLines(ctx, x - 5, baseY - 5, backFootX + 5, baseY + 2, safeIntensity, color, nowMs, themeKind);
  drawEnergySpirals(ctx, x, baseY - 15, safePower, color, nowMs, themeKind);

  if (chargePower > 0.3) {
    const dustIntensity = (chargePower - 0.3) / 0.7;
    ctx.globalAlpha = dustIntensity * 0.4;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    for (let i = 0; i < 3; i++) {
      const dustX = backFootX - 5 + i * 4;
      const dustY = baseY + 2;
      const dustSize = 2 + dustIntensity * 2;
      drawHandCircle(ctx, dustX, dustY, dustSize, color, 1, nowMs + i * 100, false);
    }
    ctx.globalAlpha = 1;
  }
}

// Draw Zeno in "The Bolt" flight pose - dynamic mid-air motion
export function drawZenoBolt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  nowMs: number,
  velocity: { vx: number; vy: number },
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  const scale = CHARACTER_SCALE.normal;
  const lineWidth = themeKind === 'flipbook' ? SCALED_LINE_WEIGHTS.body : SCALED_LINE_WEIGHTS.limbs;
  const speed = Math.sqrt(velocity.vx ** 2 + velocity.vy ** 2);

  const rising = velocity.vy < -2;
  const falling = velocity.vy > 2;

  const stretchAmount = Math.min(0.3, speed * 0.02);
  const scaleX = 1 - stretchAmount * 0.3;
  const scaleY = 1 + stretchAmount;

  const bodyAngle = Math.atan2(velocity.vy, velocity.vx) * 0.3;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(bodyAngle);
  ctx.scale(scaleX, scaleY);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const headRadius = 7 * scale;

  if (rising) {
    drawHandCircle(ctx, 0, -8, headRadius, color, lineWidth, nowMs, false);

    ctx.beginPath();
    ctx.arc(-headRadius * 0.3, -9, 1.5, 0, Math.PI * 2);
    ctx.arc(headRadius * 0.3, -9, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(0, 12);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(18 * scale, -5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-12 * scale, 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(-3, 25 * scale);
    ctx.moveTo(0, 12);
    ctx.lineTo(3, 25 * scale);
    ctx.stroke();

  } else if (falling) {
    drawHandCircle(ctx, 0, -10, headRadius, color, lineWidth, nowMs, false);

    ctx.beginPath();
    ctx.arc(-headRadius * 0.3, -8, 1.5, 0, Math.PI * 2);
    ctx.arc(headRadius * 0.3, -8, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 8);
    ctx.stroke();

    const armWobble = Math.sin(nowMs * 0.015) * 0.2;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(-15 * scale, 2 + armWobble * 5);
    ctx.moveTo(0, -2);
    ctx.lineTo(15 * scale, 2 - armWobble * 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(-8 * scale, 18 * scale);
    ctx.moveTo(0, 8);
    ctx.lineTo(8 * scale, 18 * scale);
    ctx.stroke();

  } else {
    const stride = Math.sin(nowMs * 0.02) * 0.5;

    drawHandCircle(ctx, 0, -10, headRadius, color, lineWidth, nowMs, false);

    ctx.beginPath();
    ctx.arc(-headRadius * 0.3, -10, 1.5, 0, Math.PI * 2);
    ctx.arc(headRadius * 0.3, -10, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -7, 3, 0.1, Math.PI - 0.1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(3, 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(2, -2);
    ctx.lineTo(12 * scale + stride * 8, -6 + stride * 5);
    ctx.moveTo(2, -2);
    ctx.lineTo(-8 * scale - stride * 8, 2 - stride * 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(3, 8);
    ctx.lineTo(8 * scale + stride * 10, 20 * scale);
    ctx.moveTo(3, 8);
    ctx.lineTo(-5 * scale - stride * 10, 18 * scale);
    ctx.stroke();
  }

  ctx.restore();

  drawSpeedLines(ctx, x, y, velocity, color, nowMs, themeKind);
}

// Draw Zeno in "The Impact" pose - three-point superhero landing
export function drawZenoImpact(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  nowMs: number,
  landingFrame: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  const scale = CHARACTER_SCALE.normal;
  const lineWidth = themeKind === 'flipbook' ? SCALED_LINE_WEIGHTS.body : SCALED_LINE_WEIGHTS.limbs;

  const impactProgress = Math.min(1, landingFrame / 10);
  const squashAmount = 0.3 * (1 - impactProgress);
  const scaleX = 1 + squashAmount * 0.5;
  const scaleY = 1 - squashAmount;

  const yOffset = squashAmount * 8;

  ctx.save();
  ctx.translate(x, y + yOffset);
  ctx.scale(scaleX, scaleY);
  ctx.translate(-x, -(y + yOffset));

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const headRadius = 7 * scale;
  const baseY = y + yOffset;

  const headX = x - 2;
  const headY = baseY - 22 * scale;

  drawHandCircle(ctx, headX, headY, headRadius, color, lineWidth, nowMs, false);

  ctx.beginPath();
  ctx.arc(headX - headRadius * 0.35, headY - 1, 1.5, 0, Math.PI * 2);
  ctx.arc(headX + headRadius * 0.35, headY - 1, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(headX + 1, headY + 2, 3, 0.2, Math.PI - 0.4);
  ctx.stroke();

  const torsoTopY = headY + headRadius + 2;
  const torsoBottomY = baseY - 8 * scale;

  ctx.beginPath();
  ctx.moveTo(headX, torsoTopY);
  ctx.lineTo(x + 3, torsoBottomY);
  ctx.stroke();

  const plantedHandX = x - 15 * scale;
  const plantedHandY = baseY;

  ctx.beginPath();
  ctx.moveTo(x, torsoTopY + 5);
  ctx.lineTo(plantedHandX, plantedHandY);
  ctx.stroke();

  for (let i = 0; i < 4; i++) {
    const fingerAngle = Math.PI * 0.8 + (i / 3) * Math.PI * 0.4;
    const fingerLen = 4;
    ctx.beginPath();
    ctx.moveTo(plantedHandX, plantedHandY);
    ctx.lineTo(
      plantedHandX + Math.cos(fingerAngle) * fingerLen,
      plantedHandY + Math.sin(fingerAngle) * fingerLen
    );
    ctx.stroke();
  }

  const upArmAngle = -Math.PI * 0.3;
  const upArmLen = 18 * scale;

  ctx.beginPath();
  ctx.moveTo(x + 5, torsoTopY + 5);
  ctx.lineTo(
    x + 5 + Math.cos(upArmAngle) * upArmLen,
    torsoTopY + 5 + Math.sin(upArmAngle) * upArmLen
  );
  ctx.stroke();

  const leftKneeX = x - 5;
  const leftKneeY = baseY - 4;

  ctx.beginPath();
  ctx.moveTo(x, torsoBottomY);
  ctx.lineTo(leftKneeX, leftKneeY);
  ctx.lineTo(leftKneeX - 3, baseY);
  ctx.stroke();

  const rightFootX = x + 18 * scale;
  const rightFootY = baseY;

  ctx.beginPath();
  ctx.moveTo(x + 5, torsoBottomY);
  ctx.lineTo(x + 10, baseY - 6);
  ctx.lineTo(rightFootX, rightFootY);
  ctx.stroke();

  ctx.restore();

  drawGroundCracks(ctx, plantedHandX + 3, baseY + 2, landingFrame, color, themeKind);
  drawGroundCracks(ctx, leftKneeX, baseY + 1, landingFrame, color, themeKind);

  drawDustPuffs(ctx, x, baseY, landingFrame, color, nowMs, themeKind);

  drawImpactBurst(ctx, x, baseY, color, landingFrame, themeKind);
}
