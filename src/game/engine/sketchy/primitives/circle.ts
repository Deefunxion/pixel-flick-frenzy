// Circle drawing primitives for sketchy/hand-drawn style

import { WOBBLE_INTENSITY, LINE_WEIGHTS, PENCIL_GRAY } from '../constants';
import { getWobble, adjustAlpha } from '../wobble';

// Draw a layered hand-drawn circle with primary ink + faint graphite
export function drawLayeredHandCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  nowMs: number = 0,
  layers: number = 2,
  filled: boolean = false,
) {
  // Layer 2: Graphite underlay
  if (layers >= 2) {
    const graphiteColor = adjustAlpha(color, 0.2);
    drawHandCircle(ctx, cx + 0.5, cy + 0.5, radius, graphiteColor, LINE_WEIGHTS.secondary, nowMs, false);
  }

  // Layer 1: Primary ink
  drawHandCircle(ctx, cx, cy, radius, color, LINE_WEIGHTS.primary, nowMs, filled);
}

// Multi-pass sketchy circle - pencil guideline + main ink stroke
export function drawSketchyCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  lineWidth: number = LINE_WEIGHTS.primary,
  nowMs: number = 0,
  filled: boolean = false,
) {
  // Pass 1: Pencil guideline (faint, offset)
  const guideColor = adjustAlpha(PENCIL_GRAY, 0.25);
  drawHandCircle(ctx, cx - 0.5, cy - 0.5, radius, guideColor, LINE_WEIGHTS.shadow, nowMs, false);

  // Pass 2: Main ink stroke
  drawHandCircle(ctx, cx, cy, radius, color, lineWidth, nowMs, filled);
}

// Draw a hand-drawn circle
export function drawHandCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  lineWidth: number = 2,
  nowMs: number = 0,
  filled: boolean = false,
  intensity: number = WOBBLE_INTENSITY.standard,
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  // More segments for smoother wobble distribution
  const segments = 32;
  ctx.beginPath();

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    // Enhanced wobble with both dx and dy affecting radius
    const wobble = getWobble(cx + i * 10, cy + i * 10, nowMs, intensity);
    const radiusWobble = wobble.dx * 1.5 + wobble.dy * 0.5;
    const r = radius + radiusWobble;
    // Also wobble the center point slightly for more organic feel
    const centerWobble = getWobble(cx * 1.3 + i * 7, cy * 1.7 + i * 11, nowMs, intensity * 0.3);
    const px = cx + centerWobble.dx + Math.cos(angle) * r;
    const py = cy + centerWobble.dy + Math.sin(angle) * r;

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.closePath();

  if (filled) {
    ctx.fill();
  } else {
    ctx.stroke();
  }
}
