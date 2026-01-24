// Typography/handwriting utilities for sketchy/hand-drawn style

import { formatZenoScore } from '@/game/leaderboard';

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
