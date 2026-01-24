// Film effects for sketchy/hand-drawn style (primarily Noir theme)

import { seededRandom } from '../wobble';

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
