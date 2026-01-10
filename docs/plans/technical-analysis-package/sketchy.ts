// Sketchy/hand-drawn rendering utilities for flipbook aesthetic
// ORGANIC VERSION - uses strokes for hand-drawn feel at 480x240 resolution

// Blue ink color (like ballpoint pen)
export const INK_BLUE = '#1a4a7a';
export const INK_LIGHT = '#4a7ab0';
export const INK_DARK = '#0d2840';

// Seeded random for deterministic wobble
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Get wobble offset for hand-drawn effect
function getWobble(x: number, y: number, nowMs: number, intensity: number = 1): { dx: number; dy: number } {
  const frame = Math.floor(nowMs / 100);
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

// Draw a hand-drawn line with slight wobble
export function drawHandLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth: number = 2,
  nowMs: number = 0,
) {
  const w1 = getWobble(x1, y1, nowMs, 1.5);
  const w2 = getWobble(x2, y2, nowMs, 1.5);

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(x1 + w1.dx, y1 + w1.dy);

  // Add slight curve in the middle for hand-drawn feel
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const midW = getWobble(midX, midY, nowMs, 2);

  ctx.quadraticCurveTo(midX + midW.dx, midY + midW.dy, x2 + w2.dx, y2 + w2.dy);
  ctx.stroke();
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
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  const segments = 24;
  ctx.beginPath();

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const wobble = getWobble(cx + i * 10, cy + i * 10, nowMs, 1.5);
    const r = radius + wobble.dx;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;

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
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const scale = 0.5;
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
  ctx.lineWidth = 2.5 * landingEmphasis;

  // Micro-offset for landing impact feel
  const impactOffset = isLanding ? Math.sin(nowMs * 0.5) * 0.5 : 0;
  x += impactOffset;

  // Head position
  const headX = x + bodyLean * 0.5;
  const headY = y - 35 * scale;

  // Draw head (circle) with landing emphasis
  drawHandCircle(ctx, headX, headY, headRadius, color, 2.5 * landingEmphasis, nowMs, false);

  // Draw smile
  ctx.beginPath();
  ctx.arc(headX, headY + 2, headRadius * 0.5, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Draw eyes
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(headX - headRadius * 0.35, headY - 2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(headX + headRadius * 0.35, headY - 2, 2, 0, Math.PI * 2);
  ctx.fill();

  // Body
  const bodyTopY = headY + headRadius + 2;
  const bodyBottomY = y - 8 * scale;

  ctx.beginPath();
  ctx.moveTo(headX, bodyTopY);
  ctx.lineTo(x + bodyLean, bodyBottomY);
  ctx.stroke();

  // Arms
  const armY = bodyTopY + 8 * scale;
  const armLen = 18 * scale;

  // Left arm
  ctx.beginPath();
  ctx.moveTo(x + bodyLean * 0.7, armY);
  ctx.lineTo(
    x + bodyLean * 0.7 - Math.cos(armAngleL) * armLen,
    armY + Math.sin(armAngleL) * armLen
  );
  ctx.stroke();

  // Right arm
  ctx.beginPath();
  ctx.moveTo(x + bodyLean * 0.7, armY);
  ctx.lineTo(
    x + bodyLean * 0.7 + Math.cos(armAngleR) * armLen,
    armY + Math.sin(armAngleR) * armLen
  );
  ctx.stroke();

  // Legs
  const legLen = 20 * scale;

  // Left leg
  ctx.beginPath();
  ctx.moveTo(x + bodyLean, bodyBottomY);
  ctx.lineTo(x + bodyLean - legSpread, y);
  ctx.stroke();

  // Right leg
  ctx.beginPath();
  ctx.moveTo(x + bodyLean, bodyBottomY);
  ctx.lineTo(x + bodyLean + legSpread, y);
  ctx.stroke();

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
  ctx.lineWidth = 2.5;
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