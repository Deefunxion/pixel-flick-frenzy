// Sketchy/hand-drawn rendering utilities for flipbook aesthetic
// ORGANIC VERSION - uses strokes for hand-drawn feel at 480x240 resolution

import { formatZenoScore } from '@/game/leaderboard';

// Blue ink color (like ballpoint pen)
export const INK_BLUE = '#1a4a7a';
export const INK_LIGHT = '#4a7ab0';
export const INK_DARK = '#0d2840';

// Wobble intensity tiers for different element types
// Higher values = more hand-drawn imperfection
export const WOBBLE_INTENSITY = {
  hero: 2.5,      // Player, ground, flag - most prominent wobble
  standard: 2.0,  // Clouds, UI boxes, trajectories
  fine: 1.0,      // Small details, eyes, dashes
};

// Frame timing for wobble updates (higher = more deliberate, less jittery)
const WOBBLE_FRAME_MS = 150;

// Pencil gray color for sketch underlays
const PENCIL_GRAY = '#9a9590';

// Seeded random for deterministic wobble
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Get wobble offset for hand-drawn effect
function getWobble(x: number, y: number, nowMs: number, intensity: number = WOBBLE_INTENSITY.standard): { dx: number; dy: number } {
  const frame = Math.floor(nowMs / WOBBLE_FRAME_MS);
  const dx = (seededRandom(x * 50 + y * 30 + frame) - 0.5) * intensity;
  const dy = (seededRandom(y * 50 + x * 30 + frame + 100) - 0.5) * intensity;
  return { dx, dy };
}

// Flipbook theme line weight constants
export const LINE_WEIGHTS = {
  primary: 2.5,      // Hero outlines, player, ground edge
  secondary: 1.5,    // Grid/labels/less important markers
  shadow: 1.0,       // Faint pencil shadow offset
};

// Character scale - controls overall character size
export const CHARACTER_SCALE = {
  normal: 1.2,    // Slightly larger than original 0.85
  ghost: 0.9,     // Ghost trail figures
  mini: 0.7,      // Small UI previews
};

// Line widths for scaled characters
export const SCALED_LINE_WEIGHTS = {
  body: 4.5,      // Main body strokes
  limbs: 4,       // Arms, legs
  details: 3,     // Fingers, face
  effects: 2.5,   // Energy spirals, etc.
};

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

// Helper to adjust alpha of a color
function adjustAlpha(color: string, alpha: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  // Handle rgba colors
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/, `${alpha})`);
  }
  // Handle rgb colors
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  }
  return color;
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

// Draw a stick figure with smile
export function drawStickFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  nowMs: number,
  state: 'idle' | 'charging' | 'flying' | 'landing' = 'idle',
  angle: number = 0,
  velocity: { vx: number; vy: number } = { vx: 0, vy: 0 },
  chargePower: number = 0,  // 0-1 charge amount for squash
) {
  // Squash & Stretch calculations
  let scaleX = 1;
  let scaleY = 1;

  if (state === 'charging') {
    // Charging SQUASH: compress vertically, expand horizontally
    const squashAmount = chargePower * 0.3; // Max 30% squash
    scaleX = 1 + squashAmount * 0.43; // ~130% width at full charge
    scaleY = 1 - squashAmount; // ~70% height at full charge
  } else if (state === 'flying') {
    // Flying STRETCH: elongate in velocity direction
    const speed = Math.sqrt(velocity.vx ** 2 + velocity.vy ** 2);
    const stretchAmount = Math.min(0.3, speed * 0.02);
    scaleX = 1 - stretchAmount * 0.3;
    scaleY = 1 + stretchAmount;
  } else if (state === 'landing') {
    // Landing SQUASH: impact compression
    scaleX = 1.3;
    scaleY = 0.7;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);
  ctx.translate(-x, -y);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = SCALED_LINE_WEIGHTS.body;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const scale = CHARACTER_SCALE.normal;
  const headRadius = 8 * scale;

  // Animation offsets based on state
  let bodyLean = 0;
  let armAngleL = 0;
  let armAngleR = 0;
  let legSpread = 8 * scale;

  if (state === 'idle') {
    // Slight idle animation
    const bounce = Math.sin(nowMs / 500) * 2;
    y += bounce;
    armAngleL = Math.sin(nowMs / 800) * 0.1;
    armAngleR = -Math.sin(nowMs / 800) * 0.1;
  } else if (state === 'charging') {
    // Charging wind-up with anticipation
    // Lean BACK first (opposite to launch direction)
    bodyLean = -8 - chargePower * 12; // Lean back more at higher charge

    // Arms pull behind body
    armAngleL = -0.6 - chargePower * 0.6;
    armAngleR = -0.4 - chargePower * 0.5;

    // One leg steps back to brace
    legSpread = 10 * scale + chargePower * 6;

    // Lower center of gravity
    y += 3 + chargePower * 8;
  } else if (state === 'flying') {
    // Check if just launched (first ~100ms of flight)
    const justLaunched = velocity.vy < -3 && Math.abs(velocity.vx) > 4;

    if (justLaunched && velocity.vy < -2) {
      // Release snap: everything whips forward
      armAngleL = -1.5; // Arms thrust forward
      armAngleR = -1.3;
      legSpread = 3 * scale; // Legs together, trailing
      bodyLean = velocity.vx * 1.5;
    } else {
      const rising = velocity.vy < 0;
      if (rising) {
        // Arms up, superman pose
        armAngleL = -1.2;
        armAngleR = -1.0;
        legSpread = 4 * scale;
      } else {
        // Falling, arms flailing
        const flail = Math.sin(nowMs / 80) * 0.5;
        armAngleL = 0.3 + flail;
        armAngleR = 0.3 - flail;
        legSpread = 10 * scale;
      }
      bodyLean = velocity.vx * 2;
    }
  } else if (state === 'landing') {
    // Impact squash with recovery sequence
    // Frame 0-3: Maximum squash
    // Frame 4-8: Recovery wobble
    // Frame 9+: Settle to proud stance

    // For now, enhanced single-frame squash
    y += 10;
    armAngleL = 1.0; // Arms out for balance
    armAngleR = 1.0;
    legSpread = 18 * scale; // Wide stance

    // Windmill effect (arms reaching out)
    const wobble = Math.sin(nowMs * 0.02) * 0.3;
    armAngleL += wobble;
    armAngleR -= wobble;
  }

  // Enhanced line width for landing emphasis (1-2 frame squash effect)
  const isLanding = state === 'landing';
  const landingEmphasis = isLanding ? 1.3 : 1.0;
  ctx.lineWidth = 4 * landingEmphasis;

  // Micro-offset for landing impact feel
  const impactOffset = isLanding ? Math.sin(nowMs * 0.5) * 0.5 : 0;
  x += impactOffset;

  // Head position
  const headX = x + bodyLean * 0.5;
  const headY = y - 35 * scale;

  // Draw head (circle) with multi-pass for hero element
  drawSketchyCircle(ctx, headX, headY, headRadius, color, 2.5 * landingEmphasis, nowMs, false);

  // Draw smile with slight wobble
  const smileWobble = getWobble(headX, headY + 2, nowMs, WOBBLE_INTENSITY.fine);
  ctx.beginPath();
  ctx.arc(headX + smileWobble.dx * 0.3, headY + 2 + smileWobble.dy * 0.3, headRadius * 0.5, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Draw eyes with wobble
  ctx.fillStyle = color;
  const eyeWobbleL = getWobble(headX - headRadius * 0.35, headY - 2, nowMs, WOBBLE_INTENSITY.fine);
  ctx.beginPath();
  ctx.arc(headX - headRadius * 0.35 + eyeWobbleL.dx * 0.3, headY - 2 + eyeWobbleL.dy * 0.3, 2, 0, Math.PI * 2);
  ctx.fill();
  const eyeWobbleR = getWobble(headX + headRadius * 0.35, headY - 2, nowMs, WOBBLE_INTENSITY.fine);
  ctx.beginPath();
  ctx.arc(headX + headRadius * 0.35 + eyeWobbleR.dx * 0.3, headY - 2 + eyeWobbleR.dy * 0.3, 2, 0, Math.PI * 2);
  ctx.fill();

  // Body - multi-pass for hero element
  const bodyTopY = headY + headRadius + 2;
  const bodyBottomY = y - 8 * scale;

  drawSketchyLine(ctx, headX, bodyTopY, x + bodyLean, bodyBottomY, color, SCALED_LINE_WEIGHTS.body, nowMs);

  // Arms - multi-pass for hero element
  const armY = bodyTopY + 8 * scale;
  const armLen = 18 * scale;

  // Left arm
  drawSketchyLine(
    ctx,
    x + bodyLean * 0.7, armY,
    x + bodyLean * 0.7 - Math.cos(armAngleL) * armLen,
    armY + Math.sin(armAngleL) * armLen,
    color, SCALED_LINE_WEIGHTS.limbs, nowMs
  );

  // Right arm
  drawSketchyLine(
    ctx,
    x + bodyLean * 0.7, armY,
    x + bodyLean * 0.7 + Math.cos(armAngleR) * armLen,
    armY + Math.sin(armAngleR) * armLen,
    color, SCALED_LINE_WEIGHTS.limbs, nowMs
  );

  // Legs - multi-pass for hero element
  // Left leg
  drawSketchyLine(
    ctx,
    x + bodyLean, bodyBottomY,
    x + bodyLean - legSpread, y,
    color, SCALED_LINE_WEIGHTS.limbs, nowMs
  );

  // Right leg
  drawSketchyLine(
    ctx,
    x + bodyLean, bodyBottomY,
    x + bodyLean + legSpread, y,
    color, SCALED_LINE_WEIGHTS.limbs, nowMs
  );

  ctx.restore();
}

// Draw a failing/falling stick figure
export function drawFailingStickFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  _nowMs: number,
  failureType: 'tumble' | 'dive',
  frame: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  const spin = (frame * 0.3) % (Math.PI * 2);

  ctx.save();
  ctx.translate(x, y);

  if (failureType === 'tumble') {
    // Spinning tumble
    ctx.rotate(spin);

    // Head
    ctx.beginPath();
    ctx.arc(0, -12, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Body
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(0, 5);
    ctx.stroke();

    // Arms (flailing)
    const armWave = Math.sin(frame * 0.5) * 0.5;
    ctx.beginPath();
    ctx.moveTo(-8, -2 + armWave * 5);
    ctx.lineTo(0, -3);
    ctx.lineTo(8, -2 - armWave * 5);
    ctx.stroke();

    // Legs (kicking)
    ctx.beginPath();
    ctx.moveTo(-6, 12 + armWave * 3);
    ctx.lineTo(0, 5);
    ctx.lineTo(6, 12 - armWave * 3);
    ctx.stroke();

  } else if (failureType === 'dive') {
    // Superman dive pose
    ctx.rotate(-Math.PI / 6);

    // Head looking down
    ctx.beginPath();
    ctx.arc(0, -10, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Panic eyes
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(-2, -11, 1.5, 0, Math.PI * 2);
    ctx.arc(2, -11, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Open mouth (O shape)
    ctx.beginPath();
    ctx.arc(0, -8, 2, 0, Math.PI * 2);
    ctx.stroke();

    // Body stretched
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(0, 10);
    ctx.stroke();

    // Arms reaching forward
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(0, -3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, -8);
    ctx.lineTo(0, -3);
    ctx.stroke();

    // Legs trailing
    ctx.beginPath();
    ctx.moveTo(-5, 18);
    ctx.lineTo(0, 10);
    ctx.lineTo(5, 18);
    ctx.stroke();
  }

  ctx.restore();

  // Sweat drops / panic lines
  if (frame % 4 < 2) {
    ctx.beginPath();
    ctx.moveTo(x + 10, y - 15);
    ctx.lineTo(x + 14, y - 20);
    ctx.moveTo(x - 10, y - 15);
    ctx.lineTo(x - 14, y - 20);
    ctx.stroke();
  }
}

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

// Draw notebook ruled lines
export function drawRuledLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lineColor: string,
  marginColor: string,
  nowMs: number,
) {
  const lineSpacing = 18; // Larger spacing for bigger canvas
  const marginX = 36;

  // Draw horizontal ruled lines
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1;

  for (let y = lineSpacing; y < height; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw red margin line
  ctx.strokeStyle = marginColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(marginX, 0);
  ctx.lineTo(marginX, height);
  ctx.stroke();
}

// Draw paper texture with smudge and eraser marks (subtle)
export function drawPaperTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  nowMs: number,
  reduceFx: boolean = false,
) {
  const frame = Math.floor(nowMs / 1000);

  // Very subtle noise for paper feel
  ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
  const noiseCount = reduceFx ? 25 : 50;
  for (let i = 0; i < noiseCount; i++) {
    const x = seededRandom(i + frame * 0.01) * width;
    const y = seededRandom(i * 2 + frame * 0.01) * height;
    ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
  }

  // Skip smudge/eraser marks in reduceFx mode
  if (reduceFx) return;

  // Smudge marks - soft gray strokes (graphite smears)
  const smudgeCount = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < smudgeCount; i++) {
    const smudgeX = seededRandom(i * 7 + 100) * width * 0.8 + width * 0.1;
    const smudgeY = seededRandom(i * 11 + 200) * height * 0.6 + height * 0.2;
    const smudgeLen = 15 + seededRandom(i * 13) * 25;
    const smudgeAngle = seededRandom(i * 17) * Math.PI;

    ctx.strokeStyle = 'rgba(100, 100, 100, 0.04)';
    ctx.lineWidth = 6 + seededRandom(i * 19) * 8;
    ctx.beginPath();
    ctx.moveTo(smudgeX, smudgeY);
    ctx.lineTo(
      smudgeX + Math.cos(smudgeAngle) * smudgeLen,
      smudgeY + Math.sin(smudgeAngle) * smudgeLen
    );
    ctx.stroke();
  }

  // Eraser marks - lighter streaks (where graphite was rubbed away)
  const eraserCount = 2;
  for (let i = 0; i < eraserCount; i++) {
    const eraseX = seededRandom(i * 23 + 300) * width * 0.7 + width * 0.15;
    const eraseY = seededRandom(i * 29 + 400) * height * 0.5 + height * 0.25;
    const eraseW = 12 + seededRandom(i * 31) * 20;
    const eraseH = 4 + seededRandom(i * 37) * 6;
    const eraseAngle = (seededRandom(i * 41) - 0.5) * 0.3;

    ctx.save();
    ctx.translate(eraseX, eraseY);
    ctx.rotate(eraseAngle);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(-eraseW / 2, -eraseH / 2, eraseW, eraseH);
    ctx.restore();
  }
}

// Draw spiral notebook holes
export function drawSpiralHoles(
  ctx: CanvasRenderingContext2D,
  height: number,
  color: string,
  nowMs: number,
) {
  const holeSpacing = 36;
  const holeX = 12;
  const holeRadius = 5;

  ctx.strokeStyle = color;
  ctx.lineWidth = LINE_WEIGHTS.secondary;

  for (let y = holeSpacing; y < height - holeSpacing; y += holeSpacing) {
    drawHandCircle(ctx, holeX, y, holeRadius, color, LINE_WEIGHTS.secondary, nowMs, false);
  }
}

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

// Draw handwritten number with Zeno-adaptive precision
export function drawHandwrittenNumber(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  number: number,
  color: string,
  fontSize: number = 16,
) {
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px "Comic Sans MS", cursive, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(formatZenoScore(number), x, y);
}

// Draw film grain effect (Noir theme)
export function drawFilmGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  nowMs: number,
  intensity: number = 0.6,
) {
  const frame = Math.floor(nowMs / 50); // Change grain pattern every 50ms
  const grainAlpha = intensity * 0.08;

  // Use a pattern of random dots for grain effect
  const dotCount = Math.floor(width * height * 0.015 * intensity);

  for (let i = 0; i < dotCount; i++) {
    const x = seededRandom(i + frame * 1.3) * width;
    const y = seededRandom(i * 2.7 + frame * 0.9) * height;
    const brightness = seededRandom(i * 3.1 + frame) > 0.5 ? 255 : 0;

    ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${grainAlpha})`;
    ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
  }
}

// Draw vignette effect (Noir theme - canvas edges darkening)
export function drawVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number = 0.7,
) {
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) * 0.7
  );

  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.5, `rgba(0, 0, 0, ${intensity * 0.1})`);
  gradient.addColorStop(0.8, `rgba(0, 0, 0, ${intensity * 0.3})`);
  gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity * 0.6})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

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

// Draw a ghost/echo stick figure (faded, thinner strokes)
export function drawGhostFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  opacity: number,
  nowMs: number,
  angle: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  ctx.save();
  ctx.globalAlpha = opacity;

  // Thinner strokes for ghosts
  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? SCALED_LINE_WEIGHTS.limbs : SCALED_LINE_WEIGHTS.details;
  ctx.lineCap = 'round';

  const scale = CHARACTER_SCALE.ghost;
  const headRadius = 6 * scale;

  // Simple tumbling pose based on angle
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Head
  ctx.beginPath();
  ctx.arc(0, -10, headRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(0, 5);
  ctx.stroke();

  // Arms (spread out)
  ctx.beginPath();
  ctx.moveTo(-8, -2);
  ctx.lineTo(0, -3);
  ctx.lineTo(8, -2);
  ctx.stroke();

  // Legs
  ctx.beginPath();
  ctx.moveTo(-5, 12);
  ctx.lineTo(0, 5);
  ctx.lineTo(5, 12);
  ctx.stroke();

  ctx.restore();
}

// Draw scribble energy lines radiating from a point
export function drawScribbleEnergy(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  intensity: number, // 0-1
  color: string,
  nowMs: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  if (intensity < 0.1) return;

  const lineCount = Math.floor(4 + intensity * 8);
  const maxLen = 8 + intensity * 15;

  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? 1.5 : 1;
  ctx.lineCap = 'round';

  for (let i = 0; i < lineCount; i++) {
    // Deterministic but animated positions
    const seed = i * 137.5 + nowMs * 0.01;
    const angle = (i / lineCount) * Math.PI * 2 + Math.sin(seed) * 0.5;
    const len = maxLen * (0.5 + seededRandom(seed) * 0.5);
    const startDist = 8 + seededRandom(seed + 1) * 5;

    const startX = x + Math.cos(angle) * startDist;
    const startY = y + Math.sin(angle) * startDist;
    const endX = x + Math.cos(angle) * (startDist + len);
    const endY = y + Math.sin(angle) * (startDist + len);

    // Wobbly line
    ctx.globalAlpha = 0.4 + intensity * 0.4;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Add mid-point wobble
    const midX = (startX + endX) / 2 + (seededRandom(seed + 2) - 0.5) * 4;
    const midY = (startY + endY) / 2 + (seededRandom(seed + 3) - 0.5) * 4;
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

// Draw horizontal speed lines during high-velocity flight
export function drawSpeedLines(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  velocity: { vx: number; vy: number },
  color: string,
  nowMs: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  const speed = Math.sqrt(velocity.vx ** 2 + velocity.vy ** 2);
  if (speed < 4) return;

  const lineCount = Math.min(14, Math.floor(speed / 1.0));
  const lineLen = 25 + speed * 4;

  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? SCALED_LINE_WEIGHTS.effects : SCALED_LINE_WEIGHTS.details;
  ctx.lineCap = 'round';

  // Main speed lines
  for (let i = 0; i < lineCount; i++) {
    const seed = i * 47 + nowMs * 0.02;
    const offsetY = (seededRandom(seed) - 0.5) * 65;
    const alpha = 0.25 + seededRandom(seed + 1) * 0.35;
    const len = lineLen * (0.5 + seededRandom(seed + 2) * 0.5);

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x - len, y + offsetY);
    ctx.lineTo(x - len * 0.2, y + offsetY + (seededRandom(seed + 3) - 0.5) * 3);
    ctx.stroke();
  }

  // Whoosh marks at high speed (curved streaks)
  if (speed > 6) {
    const whooshCount = Math.min(4, Math.floor((speed - 6) / 2));
    ctx.lineWidth = themeKind === 'flipbook' ? 2 : 1.5;

    for (let i = 0; i < whooshCount; i++) {
      const seed = i * 73 + nowMs * 0.015;
      const offsetY = (seededRandom(seed) - 0.5) * 40;
      const curveHeight = (seededRandom(seed + 1) - 0.5) * 8;

      ctx.globalAlpha = 0.2 + seededRandom(seed + 2) * 0.2;
      ctx.beginPath();
      ctx.moveTo(x - 25, y + offsetY);
      ctx.quadraticCurveTo(x - 15, y + offsetY + curveHeight, x - 5, y + offsetY);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
}

// Draw explosion of scribbles at launch
export function drawLaunchBurst(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number, // frames since launch
  color: string,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  if (frame > 12) return;

  const progress = frame / 12;
  const alpha = 1 - progress;
  const spread = 10 + progress * 25;

  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? 2 : 1.5;
  ctx.lineCap = 'round';
  ctx.globalAlpha = alpha * 0.7;

  // Radiating star pattern
  const rays = 8;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2 - Math.PI / 2;
    const innerR = 5 + progress * 8;
    const outerR = innerR + spread * (0.5 + seededRandom(i * 7) * 0.5);

    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * innerR, y + Math.sin(angle) * innerR);
    ctx.lineTo(x + Math.cos(angle) * outerR, y + Math.sin(angle) * outerR);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

// Draw orbiting energy spiral rings for charging pose
export function drawEnergySpirals(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  intensity: number, // 0-1 charge level
  color: string,
  nowMs: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  if (intensity < 0.1 || isNaN(intensity)) return;
  if (!isFinite(x) || !isFinite(y)) return;

  const spiralCount = 2 + Math.floor(intensity * 2); // 2-4 spirals
  const baseRadius = 18 + intensity * 10; // 18-28 pixels (fits character scale)
  const rotationSpeed = 0.003 + intensity * 0.004;

  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? SCALED_LINE_WEIGHTS.effects : SCALED_LINE_WEIGHTS.details;
  ctx.lineCap = 'round';

  for (let s = 0; s < spiralCount; s++) {
    const angleOffset = (s / spiralCount) * Math.PI * 2;
    const rotation = nowMs * rotationSpeed + angleOffset;
    const tiltAngle = (s * 0.4) + 0.3; // Different tilt for each spiral

    ctx.globalAlpha = 0.4 + intensity * 0.5;
    ctx.beginPath();

    // Draw elliptical orbit
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const orbX = Math.cos(t + rotation) * baseRadius;
      const orbY = Math.sin(t + rotation) * baseRadius * 0.4 * Math.cos(tiltAngle);

      const px = x + orbX;
      const py = y - 15 + orbY; // Center on figure

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

// Draw zig-zag spring tension lines along extended leg
export function drawSpringLines(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  intensity: number,
  color: string,
  nowMs: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  if (intensity < 0.2) return;

  const zigCount = 6 + Math.floor(intensity * 5);
  const amplitude = 5 + intensity * 7;

  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? 2.5 : 2;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.4 + intensity * 0.3;

  ctx.beginPath();

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len; // Normal vector
  const ny = dx / len;

  for (let i = 0; i <= zigCount; i++) {
    const t = i / zigCount;
    const baseX = x1 + dx * t;
    const baseY = y1 + dy * t;
    const side = (i % 2 === 0) ? 1 : -1;
    const wobble = Math.sin(nowMs * 0.01 + i) * 0.5;

    const px = baseX + nx * amplitude * side + wobble;
    const py = baseY + ny * amplitude * side + wobble;

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.stroke();
  ctx.globalAlpha = 1;
}

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
  const lineWidth = themeKind === 'flipbook' ? SCALED_LINE_WEIGHTS.body : SCALED_LINE_WEIGHTS.body * 1.5; // Thicker ink

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
  const crouchDepth = 8 + chargePower * 12; // How low the crouch goes

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
      // Quadratic bezier formula
      const px = invT * invT * x1 + 2 * invT * t * cx + t * t * x2;
      const py = invT * invT * y1 + 2 * invT * t * cy + t * t * y2;
      pts.push({ x: px, y: py });
    }
    return pts;
  };

  if (themeKind === 'noir') {
    // === NOIR INK RENDERING ===

    // Head (Circle approximation)
    const headPoints = [];
    for (let i = 0; i <= 24; i++) { // More points for smoother blob
      const angle = (i / 24) * Math.PI * 2;
      // Organic blob: 2-layer noise for "ink spread" feel
      // Layer 1: General oval shape
      // Layer 2: Surface roughness
      const deform = (seededRandom(i) - 0.5) * 0.15 + (seededRandom(i + 100) - 0.5) * 0.05;
      const r = headRadius * (1 + deform);
      headPoints.push({
        x: headX + Math.cos(angle) * r,
        y: headY + Math.sin(angle) * r
      });
    }
    // Boost width for head
    drawInkStroke(ctx, headPoints, color, lineWidth * 1.2, nowMs);

    // Determined expression
    ctx.beginPath();
    ctx.arc(headX - headRadius * 0.35, headY - 1, 2.5, 0, Math.PI * 2);
    ctx.arc(headX + headRadius * 0.35, headY - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    const mouthPoints = getQuadPoints(headX - 3, headY + 3, headX, headY + 4, headX + 2, headY + 3, 5);
    drawInkStroke(ctx, mouthPoints, color, lineWidth * 0.5, nowMs);

    // Torso - twisted, coiled
    const torsoTopY = headY + headRadius + 2;
    const torsoBottomY = baseY - 5 * scale;
    const torsoTwist = chargePower * 4;
    const torsoPoints = getQuadPoints(headX, torsoTopY, x - torsoTwist, (torsoTopY + torsoBottomY) / 2, x, torsoBottomY, 12);
    drawInkStroke(ctx, torsoPoints, color, lineWidth * 1.2, nowMs);

    // Arms
    const shoulderY = torsoTopY + 6 * scale;
    const armLen = 16 * scale;

    // Back arm
    const backArmAngle = -0.8 - chargePower * 0.7;
    const backArmX = x + Math.cos(backArmAngle + Math.PI) * armLen;
    const backArmY = shoulderY + Math.sin(backArmAngle + Math.PI) * armLen;
    const backArmPts = getLinePoints(x - 2, shoulderY, backArmX, backArmY, 10);
    drawInkStroke(ctx, backArmPts, color, lineWidth, nowMs);

    // Fist
    ctx.beginPath(); ctx.arc(backArmX, backArmY, 4, 0, Math.PI * 2); ctx.fill();

    // Front arm
    const frontArmAngle = -0.3 + chargePower * 0.2;
    const frontArmX = x + Math.cos(frontArmAngle) * armLen * 0.8;
    const frontArmY = shoulderY + Math.sin(frontArmAngle) * armLen * 0.8;
    const frontArmPts = getLinePoints(x + 2, shoulderY, frontArmX, frontArmY, 10);
    drawInkStroke(ctx, frontArmPts, color, lineWidth, nowMs);

    // Legs
    const hipY = torsoBottomY;

    // Front leg (Hip -> Knee -> Foot)
    const frontKneeX = x + 5; const frontKneeY = hipY + 8;
    const frontFootX = x + 3; const frontFootY = baseY;
    const frontLegPts = [
      ...getLinePoints(x, hipY, frontKneeX, frontKneeY, 6),
      ...getLinePoints(frontKneeX, frontKneeY, frontFootX, frontFootY, 6)
    ];
    drawInkStroke(ctx, frontLegPts, color, lineWidth, nowMs);

    // Back leg
    const backLegExtension = 15 + chargePower * 20;
    const backFootX = x - backLegExtension; const backFootY = baseY + 2;
    const backKneeX = x - backLegExtension * 0.5; const backKneeY = hipY + 4;
    const backLegPts = [
      ...getLinePoints(x, hipY, backKneeX, backKneeY, 6),
      ...getLinePoints(backKneeX, backKneeY, backFootX, backFootY, 6)
    ];
    drawInkStroke(ctx, backLegPts, color, lineWidth, nowMs);

  } else {
    // === FLIPBOOK ORIGINAL RENDERING ===

    // Draw head
    drawHandCircle(ctx, headX, headY, headRadius, color, lineWidth, nowMs, false);

    // Determined expression - focused eyes, slight frown
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(headX - headRadius * 0.35, headY - 1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headX + headRadius * 0.35, headY - 1, 2, 0, Math.PI * 2);
    ctx.fill();

    // Determined mouth - slight line
    ctx.beginPath();
    ctx.moveTo(headX - 3, headY + 3);
    ctx.lineTo(headX + 2, headY + 3);
    ctx.stroke();

    // Torso - twisted, coiled
    const torsoTopY = headY + headRadius + 2;
    const torsoBottomY = baseY - 5 * scale;
    const torsoTwist = chargePower * 4;

    ctx.beginPath();
    ctx.moveTo(headX, torsoTopY);
    ctx.quadraticCurveTo(x - torsoTwist, (torsoTopY + torsoBottomY) / 2, x, torsoBottomY);
    ctx.stroke();

    // Arms - one pulled back (fist), other forward
    const shoulderY = torsoTopY + 6 * scale;
    const armLen = 16 * scale;

    // Back arm (pulled behind, fist clenched)
    const backArmAngle = -0.8 - chargePower * 0.7;
    const backArmX = x + Math.cos(backArmAngle + Math.PI) * armLen;
    const backArmY = shoulderY + Math.sin(backArmAngle + Math.PI) * armLen;

    ctx.beginPath();
    ctx.moveTo(x - 2, shoulderY);
    ctx.lineTo(backArmX, backArmY);
    ctx.stroke();

    // Fist on back arm
    ctx.beginPath();
    ctx.arc(backArmX, backArmY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Front arm (forward for balance)
    const frontArmAngle = -0.3 + chargePower * 0.2;
    const frontArmX = x + Math.cos(frontArmAngle) * armLen * 0.8;
    const frontArmY = shoulderY + Math.sin(frontArmAngle) * armLen * 0.8;

    ctx.beginPath();
    ctx.moveTo(x + 2, shoulderY);
    ctx.lineTo(frontArmX, frontArmY);
    ctx.stroke();

    // Legs - front bent 90°, back extended FAR behind
    const hipY = torsoBottomY;

    // Front leg - bent, foot at edge
    const frontKneeX = x + 5;
    const frontKneeY = hipY + 8;
    const frontFootX = x + 3;
    const frontFootY = baseY;

    ctx.beginPath();
    ctx.moveTo(x, hipY);
    ctx.lineTo(frontKneeX, frontKneeY);
    ctx.lineTo(frontFootX, frontFootY);
    ctx.stroke();

    // Back leg - extended far behind (sprinter starting blocks)
    const backLegExtension = 15 + chargePower * 20;
    const backFootX = x - backLegExtension;
    const backFootY = baseY + 2;
    const backKneeX = x - backLegExtension * 0.5;
    const backKneeY = hipY + 4;

    ctx.beginPath();
    ctx.moveTo(x, hipY);
    ctx.lineTo(backKneeX, backKneeY);
    ctx.lineTo(backFootX, backFootY);
    ctx.stroke();
  }

  ctx.restore();

  // Energy effects (drawn without transform)
  // Spring tension on back leg
  // Noir style: thicker, more chaotic spring lines
  const effectIntensity = themeKind === 'noir' ? chargePower * 1.5 : chargePower;
  const backLegExtension = 15 + chargePower * 20; // Re-calc for effects context (outside restore)
  // Note: we need to transform these coordinates if we want them to attach to the squashed body? 
  // The original code passed transformed coords? No, it passed `x-5`, `backFootX+5` etc.
  // Wait, `backFootX` was calculated inside the transform block before.
  // I need to re-calculate them here or pull them out.
  // Simplified re-calc:
  const backFootX = x - backLegExtension;
  // Actually, spring lines are abstract, so approximate pos is fine.

  // Scale correction for effects
  // Clamp chargePower to avoid explosion
  const safePower = Math.min(Math.max(chargePower, 0), 1.0);
  const safeIntensity = Math.min(Math.max(effectIntensity, 0), 1.5);

  drawSpringLines(ctx, x - 5, baseY - 5, backFootX + 5, baseY + 2, safeIntensity, color, nowMs, themeKind);

  // Orbiting energy spirals
  drawEnergySpirals(ctx, x, baseY - 15, safePower, color, nowMs, themeKind);

  // Ground dust at back foot
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

  // Determine flight phase
  const rising = velocity.vy < -2;
  const falling = velocity.vy > 2;
  // const midFlight = !rising && !falling;

  // Stretch effect based on speed
  const stretchAmount = Math.min(0.3, speed * 0.02);
  const scaleX = 1 - stretchAmount * 0.3;
  const scaleY = 1 + stretchAmount;

  // Body angle follows velocity
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
    // SUPERMAN POSE - stretched, one arm forward

    // Head
    drawHandCircle(ctx, 0, -8, headRadius, color, lineWidth, nowMs, false);

    // Focused eyes
    ctx.beginPath();
    ctx.arc(-headRadius * 0.3, -9, 1.5, 0, Math.PI * 2);
    ctx.arc(headRadius * 0.3, -9, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Body - stretched horizontal
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(0, 12);
    ctx.stroke();

    // Forward arm (pointing ahead)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(18 * scale, -5);
    ctx.stroke();

    // Back arm (along body)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-12 * scale, 8);
    ctx.stroke();

    // Legs together, trailing
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(-3, 25 * scale);
    ctx.moveTo(0, 12);
    ctx.lineTo(3, 25 * scale);
    ctx.stroke();

  } else if (falling) {
    // PREPARING TO LAND - arms spreading, legs separating

    // Head
    drawHandCircle(ctx, 0, -10, headRadius, color, lineWidth, nowMs, false);

    // Eyes looking down
    ctx.beginPath();
    ctx.arc(-headRadius * 0.3, -8, 1.5, 0, Math.PI * 2);
    ctx.arc(headRadius * 0.3, -8, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 8);
    ctx.stroke();

    // Arms spreading out for balance
    const armWobble = Math.sin(nowMs * 0.015) * 0.2;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(-15 * scale, 2 + armWobble * 5);
    ctx.moveTo(0, -2);
    ctx.lineTo(15 * scale, 2 - armWobble * 5);
    ctx.stroke();

    // Legs bending, preparing
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(-8 * scale, 18 * scale);
    ctx.moveTo(0, 8);
    ctx.lineTo(8 * scale, 18 * scale);
    ctx.stroke();

  } else {
    // MID-FLIGHT - running stride through air
    const stride = Math.sin(nowMs * 0.02) * 0.5;

    // Head
    drawHandCircle(ctx, 0, -10, headRadius, color, lineWidth, nowMs, false);

    // Confident expression
    ctx.beginPath();
    ctx.arc(-headRadius * 0.3, -10, 1.5, 0, Math.PI * 2);
    ctx.arc(headRadius * 0.3, -10, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Slight smirk
    ctx.beginPath();
    ctx.arc(0, -7, 3, 0.1, Math.PI - 0.1);
    ctx.stroke();

    // Body - forward lean
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(3, 8);
    ctx.stroke();

    // Arms pumping
    ctx.beginPath();
    ctx.moveTo(2, -2);
    ctx.lineTo(12 * scale + stride * 8, -6 + stride * 5);
    ctx.moveTo(2, -2);
    ctx.lineTo(-8 * scale - stride * 8, 2 - stride * 5);
    ctx.stroke();

    // Legs in stride
    ctx.beginPath();
    ctx.moveTo(3, 8);
    ctx.lineTo(8 * scale + stride * 10, 20 * scale);
    ctx.moveTo(3, 8);
    ctx.lineTo(-5 * scale - stride * 10, 18 * scale);
    ctx.stroke();
  }

  ctx.restore();

  // Speed lines (drawn without rotation)
  drawSpeedLines(ctx, x, y, velocity, color, nowMs, themeKind);
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

  // Impact squash - maximum at frame 0, recovers over time
  const impactProgress = Math.min(1, landingFrame / 10);
  const squashAmount = 0.3 * (1 - impactProgress);
  const scaleX = 1 + squashAmount * 0.5;
  const scaleY = 1 - squashAmount;

  // Lower position during squash
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

  // THREE-POINT LANDING POSE
  // Head - looking up triumphantly
  const headX = x - 2;
  const headY = baseY - 22 * scale;

  drawHandCircle(ctx, headX, headY, headRadius, color, lineWidth, nowMs, false);

  // Triumphant expression - confident smirk
  ctx.beginPath();
  ctx.arc(headX - headRadius * 0.35, headY - 1, 1.5, 0, Math.PI * 2);
  ctx.arc(headX + headRadius * 0.35, headY - 1, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Confident smirk
  ctx.beginPath();
  ctx.arc(headX + 1, headY + 2, 3, 0.2, Math.PI - 0.4);
  ctx.stroke();

  // Torso - low, leaning forward
  const torsoTopY = headY + headRadius + 2;
  const torsoBottomY = baseY - 8 * scale;

  ctx.beginPath();
  ctx.moveTo(headX, torsoTopY);
  ctx.lineTo(x + 3, torsoBottomY);
  ctx.stroke();

  // Left arm - PLANTED on ground, fingers splayed
  const plantedHandX = x - 15 * scale;
  const plantedHandY = baseY;

  ctx.beginPath();
  ctx.moveTo(x, torsoTopY + 5);
  ctx.lineTo(plantedHandX, plantedHandY);
  ctx.stroke();

  // Splayed fingers
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

  // Right arm - UP and back for dramatic balance
  const upArmAngle = -Math.PI * 0.3;
  const upArmLen = 18 * scale;

  ctx.beginPath();
  ctx.moveTo(x + 5, torsoTopY + 5);
  ctx.lineTo(
    x + 5 + Math.cos(upArmAngle) * upArmLen,
    torsoTopY + 5 + Math.sin(upArmAngle) * upArmLen
  );
  ctx.stroke();

  // Left knee - DOWN, touching ground
  const leftKneeX = x - 5;
  const leftKneeY = baseY - 4;

  ctx.beginPath();
  ctx.moveTo(x, torsoBottomY);
  ctx.lineTo(leftKneeX, leftKneeY);
  ctx.lineTo(leftKneeX - 3, baseY); // Foot
  ctx.stroke();

  // Right leg - extended to side for stability
  const rightFootX = x + 18 * scale;
  const rightFootY = baseY;

  ctx.beginPath();
  ctx.moveTo(x + 5, torsoBottomY);
  ctx.lineTo(x + 10, baseY - 6);
  ctx.lineTo(rightFootX, rightFootY);
  ctx.stroke();

  ctx.restore();

  // Ground effects (drawn without transform)
  // Cracks from impact point (hand + knee)
  drawGroundCracks(ctx, plantedHandX + 3, baseY + 2, landingFrame, color, themeKind);
  drawGroundCracks(ctx, leftKneeX, baseY + 1, landingFrame, color, themeKind);

  // Dust puffs
  drawDustPuffs(ctx, x, baseY, landingFrame, color, nowMs, themeKind);

  // Impact burst (existing function)
  drawImpactBurst(ctx, x, baseY, color, landingFrame, themeKind);
}

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

/**
 * Draws the ground and cliff edge with a hand-drawn aesthetic.
 * Ground line from left edge to cliff, with cross-hatching underneath and grass scribbles on top.
 */
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

/**
 * Draws a clean decorative sky cloud with fixed, pleasing proportions.
 * Outline only (no fill), with small decorative curls at edges.
 */
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

/**
 * Draws a crescent moon for noir theme.
 */
export function drawMoon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  glowColor: string,
  nowMs: number,
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

/**
 * Draws a night cloud (simpler, more ethereal than day clouds).
 */
export function drawNightCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  nowMs: number,
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

/**
 * Draws a wind strength meter (visual bars showing intensity).
 */
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
