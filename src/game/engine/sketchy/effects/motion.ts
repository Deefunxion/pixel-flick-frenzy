// Motion effects for sketchy/hand-drawn style

import { SCALED_LINE_WEIGHTS } from '../constants';
import { seededRandom } from '../wobble';

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
