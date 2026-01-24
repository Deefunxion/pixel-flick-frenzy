// UI widget drawings for sketchy/hand-drawn style

import { getWobble } from '../wobble';
import { drawHandLine } from '../primitives/line';

// Draw a finish arch
export function drawFinishArch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  lineWidth: number = 2,
  nowMs: number = 0,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  // Left pole
  drawHandLine(ctx, x, y, x, y - height, color, lineWidth, nowMs);

  // Right pole
  drawHandLine(ctx, x + width, y, x + width, y - height, color, lineWidth, nowMs);

  // Arch top
  ctx.beginPath();
  ctx.moveTo(x, y - height);
  ctx.quadraticCurveTo(x + width / 2, y - height - 15, x + width, y - height);
  ctx.stroke();

  // "FINISH" banner
  ctx.beginPath();
  ctx.moveTo(x + 5, y - height + 10);
  ctx.lineTo(x + width - 5, y - height + 10);
  ctx.lineTo(x + width - 5, y - height + 25);
  ctx.lineTo(x + 5, y - height + 25);
  ctx.closePath();
  ctx.stroke();
}

// Draw an arrow with label
export function drawArrowWithLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  direction: number, // 1 = right, -1 = left
  label: string,
  color: string,
  lineWidth: number = 2,
  nowMs: number = 0,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  const endX = x + length * direction;

  // Arrow line
  drawHandLine(ctx, x, y, endX, y, color, lineWidth, nowMs);

  // Arrow head
  const headSize = 8;
  ctx.beginPath();
  ctx.moveTo(endX, y);
  ctx.lineTo(endX - headSize * direction, y - headSize * 0.5);
  ctx.lineTo(endX - headSize * direction, y + headSize * 0.5);
  ctx.closePath();
  ctx.fill();

  // Label
  ctx.font = '14px "Comic Sans MS", cursive, sans-serif';
  ctx.textAlign = direction > 0 ? 'left' : 'right';
  ctx.fillText(label, endX + 5 * direction, y + 5);
}

// Draw a decorative spiral curl (for cloud edges, UI embellishments)
export function drawDecorativeCurl(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  lineWidth: number = 1.5,
  nowMs: number = 0,
  direction: 1 | -1 = 1, // 1 = clockwise, -1 = counter-clockwise
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  const wobble = getWobble(x, y, nowMs, 0.5);

  ctx.beginPath();

  // Draw spiral from outside in
  const turns = 1.2;
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2 * direction;
    const r = size * (1 - t * 0.8); // Spiral inward
    const px = x + Math.cos(angle) * r + wobble.dx * (1 - t);
    const py = y + Math.sin(angle) * r + wobble.dy * (1 - t);

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.stroke();
}

// Draw a styled trajectory arc with varying thickness and wobble
export function drawStyledTrajectory(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  color: string,
  nowMs: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  if (points.length < 2) return;

  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw with varying line width (thicker at start, thinner at end)
  for (let i = 0; i < points.length - 1; i++) {
    const t = i / points.length;
    const width = themeKind === 'flipbook'
      ? 3 - t * 2 // 3px to 1px
      : 2 - t * 1.5; // 2px to 0.5px

    // Skip every other segment for dashed effect
    if (i % 2 === 1) continue;

    const p1 = points[i];
    const p2 = points[i + 1];

    // Add wobble
    const w1 = getWobble(p1.x, p1.y, nowMs, 0.8);
    const w2 = getWobble(p2.x, p2.y, nowMs, 0.8);

    ctx.lineWidth = Math.max(0.5, width);
    ctx.beginPath();
    ctx.moveTo(p1.x + w1.dx, p1.y + w1.dy);
    ctx.lineTo(p2.x + w2.dx, p2.y + w2.dy);
    ctx.stroke();
  }

  // Add endpoint marker
  if (points.length > 0) {
    const lastPoint = points[points.length - 1];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, themeKind === 'flipbook' ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw a checkered flag
export function drawCheckeredFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  lineWidth: number = 2,
  nowMs: number = 0,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;

  // Flag pole
  drawHandLine(ctx, x, y, x, y - height * 2, color, lineWidth, nowMs);

  // Flag outline
  const flagW = width;
  const flagH = height;
  const flagX = x;
  const flagY = y - height * 2;

  // Wave animation
  const wave = Math.sin(nowMs / 200) * 3;

  ctx.beginPath();
  ctx.moveTo(flagX, flagY);
  ctx.lineTo(flagX + flagW + wave, flagY + flagH * 0.2);
  ctx.lineTo(flagX + flagW + wave * 0.5, flagY + flagH);
  ctx.lineTo(flagX, flagY + flagH * 0.8);
  ctx.closePath();
  ctx.stroke();

  // Checkered pattern (simplified)
  const gridSize = 3;
  const cellW = flagW / gridSize;
  const cellH = flagH / gridSize;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if ((row + col) % 2 === 0) {
        const cellX = flagX + col * cellW + (wave * col / gridSize);
        const cellY = flagY + row * cellH + flagH * 0.1;
        ctx.fillRect(cellX + 2, cellY + 2, cellW - 2, cellH - 2);
      }
    }
  }
}

// Draw enhanced checkered flag with star (matches mockup)
export function drawEnhancedFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  flagWidth: number,
  flagHeight: number,
  poleHeight: number,
  flagColor: string,
  starColor: string,
  lineWidth: number = 3,
  nowMs: number = 0,
) {
  const wobble = getWobble(x, y, nowMs, 0.3);

  // Flag pole
  ctx.strokeStyle = flagColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + wobble.dx, y);
  ctx.lineTo(x + wobble.dx, y - poleHeight);
  ctx.stroke();

  // Checkered flag
  const flagTop = y - poleHeight;
  const cellsX = 4;
  const cellsY = 3;
  const cellW = flagWidth / cellsX;
  const cellH = flagHeight / cellsY;

  // Wave effect
  const wave = Math.sin(nowMs / 200) * 3;

  for (let row = 0; row < cellsY; row++) {
    for (let col = 0; col < cellsX; col++) {
      const isBlack = (row + col) % 2 === 0;
      const cellX = x + col * cellW + wave * (col / cellsX);
      const cellY = flagTop + row * cellH;

      if (isBlack) {
        ctx.fillStyle = flagColor;
        ctx.fillRect(cellX, cellY, cellW + 1, cellH + 1);
      }
    }
  }

  // Flag outline
  ctx.strokeStyle = flagColor;
  ctx.lineWidth = lineWidth * 0.8;
  ctx.strokeRect(x + wave * 0.3, flagTop, flagWidth + wave, flagHeight);

  // Star above flag
  const starY = flagTop - 15;
  const starSize = 10;
  ctx.fillStyle = starColor;
  ctx.strokeStyle = starColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 144 - 90) * Math.PI / 180;
    const px = x + flagWidth / 2 + Math.cos(angle) * starSize + wave * 0.5;
    const py = starY + Math.sin(angle) * starSize;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
