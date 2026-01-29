// Line drawing primitives for sketchy/hand-drawn style

import { WOBBLE_INTENSITY, LINE_WEIGHTS, PENCIL_GRAY } from '../constants';
import { getWobble, adjustAlpha } from '../wobble';

// Draw a layered hand-drawn line with primary ink + faint graphite + shadow offset
export function drawLayeredHandLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  nowMs: number = 0,
  layers: number = 2, // 1 = ink only, 2 = ink + graphite, 3 = ink + graphite + shadow
) {
  // Layer 3: Shadow offset (faint, offset down-right)
  if (layers >= 3) {
    const shadowColor = adjustAlpha(color, 0.15);
    drawHandLine(ctx, x1 + 1.5, y1 + 1.5, x2 + 1.5, y2 + 1.5, shadowColor, LINE_WEIGHTS.shadow, nowMs);
  }

  // Layer 2: Graphite underlay (slightly offset, faint)
  if (layers >= 2) {
    const graphiteColor = adjustAlpha(color, 0.25);
    drawHandLine(ctx, x1 + 0.5, y1 + 0.5, x2 + 0.5, y2 + 0.5, graphiteColor, LINE_WEIGHTS.secondary, nowMs);
  }

  // Layer 1: Primary ink
  drawHandLine(ctx, x1, y1, x2, y2, color, LINE_WEIGHTS.primary, nowMs);
}

// Multi-pass sketchy line - pencil guideline + main ink stroke
// Use for hero elements (player, ground, flag) for authentic "sketched then inked" look
export function drawSketchyLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth: number = LINE_WEIGHTS.primary,
  nowMs: number = 0,
) {
  // Pass 1: Pencil guideline (faint, offset up-left)
  const guideColor = adjustAlpha(PENCIL_GRAY, 0.3);
  drawHandLine(ctx, x1 - 0.5, y1 - 0.5, x2 - 0.5, y2 - 0.5, guideColor, LINE_WEIGHTS.shadow, nowMs);

  // Pass 2: Main ink stroke
  drawHandLine(ctx, x1, y1, x2, y2, color, lineWidth, nowMs);
}

// Draw a hand-drawn line with enhanced wobble
// For longer lines, breaks into segments with independent wobble per segment
export function drawHandLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth: number = 2,
  nowMs: number = 0,
  intensity: number = WOBBLE_INTENSITY.standard,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Calculate line length
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  // For longer lines (>30px), break into segments for more natural wobble
  if (length > 30) {
    const numSegments = Math.min(4, Math.ceil(length / 25));
    ctx.beginPath();

    const w1 = getWobble(x1, y1, nowMs, intensity);
    ctx.moveTo(x1 + w1.dx, y1 + w1.dy);

    for (let i = 1; i <= numSegments; i++) {
      const t = i / numSegments;
      const px = x1 + dx * t;
      const py = y1 + dy * t;
      const w = getWobble(px + i * 17, py + i * 13, nowMs, intensity);

      // Control point for curve with its own wobble
      const ct = (i - 0.5) / numSegments;
      const cpx = x1 + dx * ct;
      const cpy = y1 + dy * ct;
      const cw = getWobble(cpx * 1.3 + i * 23, cpy * 1.7 + i * 19, nowMs, intensity * 1.2);

      ctx.quadraticCurveTo(cpx + cw.dx, cpy + cw.dy, px + w.dx, py + w.dy);
    }

    ctx.stroke();
  } else {
    // Short lines: single curve with enhanced wobble
    const w1 = getWobble(x1, y1, nowMs, intensity);
    const w2 = getWobble(x2, y2, nowMs, intensity);

    ctx.beginPath();
    ctx.moveTo(x1 + w1.dx, y1 + w1.dy);

    // Add slight curve in the middle for hand-drawn feel
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const midW = getWobble(midX, midY, nowMs, intensity * 1.3);

    ctx.quadraticCurveTo(midX + midW.dx, midY + midW.dy, x2 + w2.dx, y2 + w2.dy);
    ctx.stroke();
  }
}

// Draw a dashed hand-drawn line (for trajectories)
export function drawDashedLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth: number = 2,
  dashLength: number = 8,
  gapLength: number = 6,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.setLineDash([dashLength, gapLength]);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.setLineDash([]);
}

/**
 * Draw an animated aim arrow with dashed segments that taper toward the end
 * Similar to classic arcade games like Angry Birds, golf games, etc.
 */
export function drawAimArrow(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  angle: number,        // Degrees
  power: number,        // 0-1, affects length
  color: string,
  nowMs: number,
) {
  const angleRad = (angle * Math.PI) / 180;

  // Arrow length based on power (grows as you charge)
  const minLength = 25;
  const maxLength = 55;
  const length = minLength + power * (maxLength - minLength);

  // Direction vector
  const dx = Math.cos(angleRad);
  const dy = -Math.sin(angleRad);

  // End point
  const endX = startX + dx * length;
  const endY = startY + dy * length;

  // Draw dashed segments that get smaller toward the end
  const numSegments = 5;

  for (let i = 0; i < numSegments; i++) {
    const t1 = i / numSegments;
    const t2 = (i + 0.6) / numSegments; // Gap between dashes

    // Segment start and end
    const sx = startX + dx * length * t1;
    const sy = startY + dy * length * t1;
    const ex = startX + dx * length * Math.min(t2, 1);
    const ey = startY + dy * length * Math.min(t2, 1);

    // Taper: segments get thinner toward the end
    const widthMultiplier = 1 - (i / numSegments) * 0.6;
    const baseWidth = 2.5 + power * 1.5;
    const segmentWidth = baseWidth * widthMultiplier;

    // Fade: segments get more transparent toward the end
    const alpha = 1 - (i / numSegments) * 0.5;

    // Pulsing animation for each segment
    const pulsePhase = ((nowMs / 150) + i * 0.4) % (Math.PI * 2);
    const pulse = 0.7 + Math.sin(pulsePhase) * 0.3;

    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha * pulse;
    ctx.lineWidth = segmentWidth;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  // Arrowhead (chevron style)
  const arrowSize = 6 + power * 4;
  const arrowAngle = 25 * Math.PI / 180; // 25 degree angle for chevron

  // Left wing of arrowhead
  const leftX = endX - Math.cos(angleRad - arrowAngle) * arrowSize;
  const leftY = endY + Math.sin(angleRad - arrowAngle) * arrowSize;

  // Right wing of arrowhead
  const rightX = endX - Math.cos(angleRad + arrowAngle) * arrowSize;
  const rightY = endY + Math.sin(angleRad + arrowAngle) * arrowSize;

  // Arrowhead pulses with power
  const arrowPulse = 0.8 + Math.sin(nowMs / 100) * 0.2;
  ctx.globalAlpha = arrowPulse;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 + power * 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(leftX, leftY);
  ctx.lineTo(endX, endY);
  ctx.lineTo(rightX, rightY);
  ctx.stroke();

  // Reset alpha
  ctx.globalAlpha = 1;
}
