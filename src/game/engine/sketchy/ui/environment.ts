// Environment drawings for sketchy/hand-drawn style

import { LINE_WEIGHTS } from '../constants';
import { getWobble } from '../wobble';
import { drawHandCircle } from '../primitives/circle';
import { drawSketchyLine } from '../primitives/line';
import { drawDecorativeCurl } from './widgets';

// Draw cross-hatching texture within a rectangular area
export function drawCrossHatch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  nowMs: number,
  density: number = 5,
  angle1: number = 45,
  angle2: number = -45,
) {
  const lineSpacing = Math.max(3, 20 / density);

  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.3;

  // First set of parallel lines at angle1
  const rad1 = (angle1 * Math.PI) / 180;
  const cos1 = Math.cos(rad1);
  const sin1 = Math.sin(rad1);

  // Calculate number of lines needed to cover the area
  const diagonal = Math.sqrt(width * width + height * height);
  const lineCount = Math.ceil(diagonal / lineSpacing);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();

  // Draw first set of lines
  for (let i = -lineCount; i <= lineCount; i++) {
    const offset = i * lineSpacing;
    const startX = x + width / 2 + offset * cos1 - diagonal * sin1;
    const startY = y + height / 2 + offset * sin1 + diagonal * cos1;
    const endX = x + width / 2 + offset * cos1 + diagonal * sin1;
    const endY = y + height / 2 + offset * sin1 - diagonal * cos1;

    // Add wobble for hand-drawn feel
    const wobble1 = getWobble(startX, startY, nowMs, 0.5);
    const wobble2 = getWobble(endX, endY, nowMs, 0.5);

    ctx.moveTo(startX + wobble1.dx, startY + wobble1.dy);
    ctx.lineTo(endX + wobble2.dx, endY + wobble2.dy);
  }
  ctx.stroke();

  // Draw second set of lines at angle2
  ctx.beginPath();
  const rad2 = (angle2 * Math.PI) / 180;
  const cos2 = Math.cos(rad2);
  const sin2 = Math.sin(rad2);

  for (let i = -lineCount; i <= lineCount; i++) {
    const offset = i * lineSpacing;
    const startX = x + width / 2 + offset * cos2 - diagonal * sin2;
    const startY = y + height / 2 + offset * sin2 + diagonal * cos2;
    const endX = x + width / 2 + offset * cos2 + diagonal * sin2;
    const endY = y + height / 2 + offset * sin2 - diagonal * cos2;

    const wobble1 = getWobble(startX + 50, startY + 50, nowMs, 0.5);
    const wobble2 = getWobble(endX + 50, endY + 50, nowMs, 0.5);

    ctx.moveTo(startX + wobble1.dx, startY + wobble1.dy);
    ctx.lineTo(endX + wobble2.dx, endY + wobble2.dy);
  }
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
}

// Draw the ground and cliff edge with a hand-drawn aesthetic
export function drawGround(
  ctx: CanvasRenderingContext2D,
  groundY: number,
  cliffEdgeX: number,
  color: string,
  nowMs: number,
) {
  const wobble = getWobble(0, groundY, nowMs, 0.3);

  // Ground line from left to cliff edge - multi-pass for hero element
  drawSketchyLine(ctx, 0, groundY + wobble.dy, cliffEdgeX, groundY + wobble.dy, color, LINE_WEIGHTS.primary, nowMs);

  // Cliff drop-off line (vertical) - multi-pass for hero element
  drawSketchyLine(ctx, cliffEdgeX, groundY + wobble.dy, cliffEdgeX, groundY + 40, color, LINE_WEIGHTS.primary, nowMs);

  // Cross-hatching underneath the ground (earth texture)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, groundY, cliffEdgeX, 40);
  ctx.clip();

  drawCrossHatch(
    ctx,
    0, groundY,
    cliffEdgeX, 40,
    color,
    nowMs,
    2.5,  // density
    45,   // angle1
    -45,  // angle2
  );
  ctx.restore();

  // Sparse grass scribbles on top
  ctx.strokeStyle = color;
  ctx.lineWidth = LINE_WEIGHTS.secondary;
  ctx.lineCap = 'round';

  for (let x = 15; x < cliffEdgeX - 10; x += 35) {
    const grassWobble = getWobble(x, groundY, nowMs, 0.5);
    const grassHeight = 4 + Math.sin(x * 0.3) * 2;

    ctx.beginPath();
    ctx.moveTo(x + grassWobble.dx, groundY + wobble.dy);
    ctx.lineTo(x + grassWobble.dx - 2, groundY + wobble.dy - grassHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + grassWobble.dx + 3, groundY + wobble.dy);
    ctx.lineTo(x + grassWobble.dx + 5, groundY + wobble.dy - grassHeight * 0.8);
    ctx.stroke();
  }
}

// Draw a clean decorative sky cloud with fixed, pleasing proportions
export function drawSkyCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  nowMs: number,
) {
  // Fixed circle proportions for consistent, pleasing shape
  const puffs = [
    { dx: -0.35, dy: 0, r: 0.3 },  // left
    { dx: -0.1, dy: -0.2, r: 0.35 },  // top-left
    { dx: 0.2, dy: -0.15, r: 0.32 },  // top-right
    { dx: 0.4, dy: 0.05, r: 0.28 },  // right
    { dx: 0.05, dy: 0.15, r: 0.25 },  // bottom-center
  ];

  // Minimal wobble to keep it clean
  const wobble = getWobble(x, y, nowMs, 0.3);

  // Draw each puff as outline only
  for (const puff of puffs) {
    const cx = x + puff.dx * size + wobble.dx;
    const cy = y + puff.dy * size + wobble.dy;
    const radius = puff.r * size;
    drawHandCircle(ctx, cx, cy, radius, color, LINE_WEIGHTS.primary, nowMs, false);
  }

  // Small decorative curl on left edge
  drawDecorativeCurl(
    ctx,
    x - size * 0.5,
    y + size * 0.1,
    size * 0.2,
    color,
    LINE_WEIGHTS.secondary,
    nowMs,
    -1,
  );

  // Small decorative curl on right edge
  drawDecorativeCurl(
    ctx,
    x + size * 0.55,
    y + size * 0.15,
    size * 0.18,
    color,
    LINE_WEIGHTS.secondary,
    nowMs,
    1,
  );
}

// Draw a crescent moon for noir theme
export function drawMoon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  glowColor: string,
  _nowMs: number,
) {
  // Subtle glow behind moon
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = glowColor;
  ctx.beginPath();
  ctx.arc(x, y, size * 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.08;
  ctx.beginPath();
  ctx.arc(x, y, size * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Main moon circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();

  // Cut out crescent shape (darker circle offset to create crescent)
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Subtle outline
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Draw a night cloud (simpler, more ethereal than day clouds)
export function drawNightCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  _nowMs: number,
) {
  // Fewer, more spread out puffs for wispy night clouds
  const puffs = [
    { dx: -0.3, dy: 0, r: 0.28 },
    { dx: 0.1, dy: -0.1, r: 0.32 },
    { dx: 0.35, dy: 0.05, r: 0.25 },
  ];

  ctx.globalAlpha = 0.6;

  for (const puff of puffs) {
    const cx = x + puff.dx * size;
    const cy = y + puff.dy * size;
    const radius = puff.r * size;

    // Soft filled circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}
