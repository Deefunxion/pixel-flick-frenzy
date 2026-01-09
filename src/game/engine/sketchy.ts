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

// Draw a cloud
export function drawCloud(
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

  const wobble = getWobble(x, y, nowMs, 1);

  // Draw cloud as overlapping circles
  const cloudParts = [
    { dx: 0, dy: 0, r: size },
    { dx: -size * 0.8, dy: size * 0.2, r: size * 0.7 },
    { dx: size * 0.8, dy: size * 0.2, r: size * 0.7 },
    { dx: -size * 0.4, dy: -size * 0.3, r: size * 0.6 },
    { dx: size * 0.4, dy: -size * 0.3, r: size * 0.6 },
  ];

  for (const part of cloudParts) {
    ctx.beginPath();
    ctx.arc(x + part.dx + wobble.dx, y + part.dy + wobble.dy, part.r, 0, Math.PI * 2);
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

// Draw handwritten number
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
  ctx.fillText(number.toFixed(4), x, y);
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
    const puffCount = 5;
    for (let i = 0; i < puffCount; i++) {
      const angle = (i / puffCount) * Math.PI + Math.PI; // Bottom half arc
      const dist = 8 + progress * 15;
      const puffX = x + Math.cos(angle) * dist;
      const puffY = y + Math.sin(angle) * dist * 0.5; // Flattened

      ctx.globalAlpha = baseAlpha * 0.4;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(puffX, puffY, 2 + progress * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Small radial lines
    ctx.globalAlpha = baseAlpha * 0.5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI + Math.PI * 0.1;
      const innerR = 5;
      const outerR = 10 + progress * 8;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * innerR, y + Math.sin(angle) * innerR * 0.5);
      ctx.lineTo(x + Math.cos(angle) * outerR, y + Math.sin(angle) * outerR * 0.5);
      ctx.stroke();
    }
  } else {
    // Noir: ink blot burst - higher contrast, fewer drops
    const dropCount = 4;
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
  ctx.lineWidth = themeKind === 'flipbook' ? 1.5 : 1;
  ctx.lineCap = 'round';

  const scale = 0.4; // Slightly smaller than main figure
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

  const lineCount = Math.min(6, Math.floor(speed / 2));
  const lineLen = 10 + speed * 2;

  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? 1.5 : 1;
  ctx.lineCap = 'round';

  for (let i = 0; i < lineCount; i++) {
    const seed = i * 47 + nowMs * 0.02;
    const offsetY = (seededRandom(seed) - 0.5) * 30;
    const alpha = 0.3 + seededRandom(seed + 1) * 0.3;
    const len = lineLen * (0.6 + seededRandom(seed + 2) * 0.4);

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x - len, y + offsetY);
    ctx.lineTo(x - len * 0.3, y + offsetY + (seededRandom(seed + 3) - 0.5) * 3);
    ctx.stroke();
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
