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
) {
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
    // Crouching, arms back
    bodyLean = -5;
    armAngleL = -0.8 - angle * 0.01;
    armAngleR = -0.6 - angle * 0.01;
    legSpread = 12 * scale;
    y += 5;
  } else if (state === 'flying') {
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
  } else if (state === 'landing') {
    // Impact squash
    y += 8;
    armAngleL = 0.8;
    armAngleR = 0.8;
    legSpread = 16 * scale;
  }

  // Head position
  const headX = x + bodyLean * 0.5;
  const headY = y - 35 * scale;

  // Draw head (circle)
  drawHandCircle(ctx, headX, headY, headRadius, color, 2.5, nowMs, false);

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

// Draw paper texture (subtle)
export function drawPaperTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  nowMs: number,
) {
  // Very subtle noise for paper feel
  ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
  const frame = Math.floor(nowMs / 1000);

  for (let i = 0; i < 50; i++) {
    const x = seededRandom(i + frame * 0.01) * width;
    const y = seededRandom(i * 2 + frame * 0.01) * height;
    ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
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
  ctx.lineWidth = 1.5;

  for (let y = holeSpacing; y < height - holeSpacing; y += holeSpacing) {
    drawHandCircle(ctx, holeX, y, holeRadius, color, 1.5, nowMs, false);
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
