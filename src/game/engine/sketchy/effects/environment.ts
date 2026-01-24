// Environment effects for sketchy/hand-drawn style

import { getWobble } from '../wobble';
import { drawHandLine } from '../primitives/line';

// Draw a wind spiral/swirl
export function drawWindSpiral(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
  lineWidth: number = 2,
  nowMs: number = 0,
  direction: number = 1, // 1 = right, -1 = left
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  const wobble = getWobble(cx, cy, nowMs, 2);
  const startX = cx + wobble.dx;
  const startY = cy + wobble.dy;

  ctx.beginPath();

  // Draw spiral
  const turns = 1.5;
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2 * direction;
    const r = size * (1 - t * 0.7);
    const px = startX + Math.cos(angle) * r;
    const py = startY + Math.sin(angle) * r * 0.6; // Flatten vertically

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.stroke();
}

// Draw a windsock
export function drawWindsock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  lineWidth: number = 2,
  nowMs: number = 0,
  windStrength: number = 0.5, // 0-1
  windDirection: number = 1, // 1 = right, -1 = left
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  // Pole
  drawHandLine(ctx, x, y, x, y - size * 2, color, lineWidth, nowMs);

  // Sock (cone shape bending with wind)
  const sockLen = size * 1.5;
  const bendAmount = windStrength * 0.8;
  const wobble = Math.sin(nowMs / 150) * windStrength * 5;

  ctx.beginPath();
  ctx.moveTo(x, y - size * 2);

  // Top edge of sock
  const endX = x + windDirection * sockLen * bendAmount + wobble;
  const endY = y - size * 2 + sockLen * (1 - bendAmount) * 0.5;

  ctx.lineTo(endX, endY - size * 0.3);
  ctx.lineTo(endX, endY + size * 0.3);
  ctx.lineTo(x, y - size * 1.5);
  ctx.closePath();
  ctx.stroke();

  // Stripes on sock
  const stripes = 3;
  for (let i = 1; i < stripes; i++) {
    const t = i / stripes;
    const sx = x + (endX - x) * t;
    const sy1 = (y - size * 2) + (endY - size * 0.3 - (y - size * 2)) * t;
    const sy2 = (y - size * 1.5) + (endY + size * 0.3 - (y - size * 1.5)) * t;

    ctx.beginPath();
    ctx.moveTo(sx, sy1);
    ctx.lineTo(sx, sy2);
    ctx.stroke();
  }
}

// Draw a bird (simple V shape)
export function drawBird(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  lineWidth: number = 2,
  nowMs: number = 0,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  // Wing flap animation
  const flapAngle = Math.sin(nowMs / 100) * 0.3;

  ctx.beginPath();
  ctx.moveTo(x - size, y + Math.sin(flapAngle) * size * 0.5);
  ctx.quadraticCurveTo(x, y - size * 0.3, x + size, y + Math.sin(-flapAngle) * size * 0.5);
  ctx.stroke();
}

// Draw a leaf
export function drawLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  rotation: number = 0,
  lineWidth: number = 1.5,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  // Leaf shape
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(size * 0.6, -size * 0.3, 0, size);
  ctx.quadraticCurveTo(-size * 0.6, -size * 0.3, 0, -size);
  ctx.stroke();

  // Stem
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, size * 1.5);
  ctx.stroke();

  ctx.restore();
}

// Draw wind strength indicator meter
export function drawWindStrengthMeter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  strength: number, // 0 to 1
  direction: number, // -1 or 1
  color: string,
  accentColor: string,
) {
  const barCount = 5;
  const barWidth = 4;
  const barSpacing = 6;
  const maxBarHeight = 16;
  const activeBars = Math.ceil(strength * barCount * 10); // 0-5 bars lit

  // Draw bars from left to right (or right to left based on direction)
  for (let i = 0; i < barCount; i++) {
    const barIndex = direction > 0 ? i : (barCount - 1 - i);
    const barX = x + barIndex * barSpacing;
    const barHeight = 4 + (i * 2.5); // Increasing height
    const barY = y + (maxBarHeight - barHeight);

    const isActive = i < activeBars;

    ctx.fillStyle = isActive ? accentColor : color;
    ctx.globalAlpha = isActive ? 1 : 0.3;
    ctx.fillRect(barX, barY, barWidth, barHeight);
  }

  ctx.globalAlpha = 1;
}
