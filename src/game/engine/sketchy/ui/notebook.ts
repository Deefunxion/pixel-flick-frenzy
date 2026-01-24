// Notebook UI elements for sketchy/hand-drawn style

import { LINE_WEIGHTS } from '../constants';
import { seededRandom } from '../wobble';
import { drawHandCircle } from '../primitives/circle';

// Draw notebook ruled lines
export function drawRuledLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lineColor: string,
  marginColor: string,
  _nowMs: number,
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
