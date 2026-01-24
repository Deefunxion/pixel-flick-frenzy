// Ink stroke and curve primitives for sketchy/hand-drawn style

import { seededRandom } from '../wobble';

// Draw an ink stroke with variable width (calligraphy style)
export function drawInkStroke(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  color: string,
  baseWidth: number,
  nowMs: number = 0
) {
  if (!points || points.length < 2) return;
  // Safety: fallback if baseWidth is invalid
  if (!baseWidth || isNaN(baseWidth)) baseWidth = 2;

  const frame = Math.floor(nowMs / 100);

  ctx.fillStyle = color;
  ctx.beginPath();

  // Safety: check first point
  if (isNaN(points[0].x) || isNaN(points[0].y)) return;
  ctx.moveTo(points[0].x, points[0].y);

  const leftSide: { x: number, y: number }[] = [];
  const rightSide: { x: number, y: number }[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    // Direction vector
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    // Safety check for NaN
    if (isNaN(dx) || isNaN(dy)) continue;

    const len = Math.sqrt(dx * dx + dy * dy);
    // Skip tiny segments to avoid noise or div-by-zero issues
    if (len < 0.1 || isNaN(len)) continue;

    // Normal vector
    const nx = -dy / len;
    const ny = dx / len;

    // Profile: Dramatic Taper (Japanese Calligraphy Style)
    // t goes from 0 to 1 along the curve
    const t = i / (points.length - 1);

    // Aesthetic Tuning:
    // pressure: 0 -> 1 -> 0 (sine wave)
    // We want a more "blobby" center and very sharp tails.
    // Power of 0.8 makes the peak wider.
    const pressure = Math.pow(Math.sin(t * Math.PI), 0.8);

    // Noise: "Paper tooth" or dry brush effect.
    // Increased intensity (0.6) for rougher look.
    const noise = (seededRandom(i * 10 + frame) - 0.5) * 0.6;

    // Width Logic:
    // Min width: 10% (was 20%) -> sharper tails
    // Max width factor: 1.4 (was 0.8) -> much thicker strokes in middle
    // Formula: base * (0.1 + pressure * 1.4 + noise * 0.3)
    const currentWidth = baseWidth * (0.1 + pressure * 1.4 + noise * 0.3);

    if (isNaN(currentWidth)) continue;

    leftSide.push({ x: p1.x + nx * currentWidth, y: p1.y + ny * currentWidth });
    rightSide.push({ x: p1.x - nx * currentWidth, y: p1.y - ny * currentWidth });
  }

  // End point converges to sharp tip
  const last = points[points.length - 1];
  if (!isNaN(last.x) && !isNaN(last.y)) {
    leftSide.push({ x: last.x, y: last.y });
    rightSide.push({ x: last.x, y: last.y });
  }

  // Construct polygon
  if (leftSide.length > 0) {
    ctx.moveTo(points[0].x, points[0].y);
    for (const p of leftSide) ctx.lineTo(p.x, p.y);
    // Tip
    ctx.lineTo(last.x, last.y);
    // Walk back
    for (let i = rightSide.length - 1; i >= 0; i--) {
      ctx.lineTo(rightSide[i].x, rightSide[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }
}

// Draw a dashed curve (for trajectory arcs)
export function drawDashedCurve(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  color: string,
  lineWidth: number = 2,
  dashLength: number = 8,
  gapLength: number = 6,
) {
  if (points.length < 2) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.setLineDash([dashLength, gapLength]);

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();
  ctx.setLineDash([]);
}
