// src/game/engine/arcade/frictionZonesRender.ts
import type { FrictionZone } from './frictionZones';

export function renderFrictionZones(
  ctx: CanvasRenderingContext2D,
  zones: FrictionZone[],
  timeMs: number
): void {
  zones.forEach(zone => {
    renderFrictionZone(ctx, zone, timeMs);
  });
}

function renderFrictionZone(
  ctx: CanvasRenderingContext2D,
  zone: FrictionZone,
  timeMs: number
): void {
  const { x, y, width, height, type } = zone;
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  ctx.save();

  if (type === 'ice') {
    renderIceZone(ctx, x, y, halfWidth, halfHeight, timeMs);
  } else {
    renderStickyZone(ctx, x, y, halfWidth, halfHeight, timeMs);
  }

  ctx.restore();
}

function renderIceZone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  halfWidth: number,
  halfHeight: number,
  timeMs: number
): void {
  // Ice: Light blue with shimmer effect
  const shimmer = Math.sin(timeMs * 0.003) * 0.1 + 0.9;

  // Base ice surface
  const gradient = ctx.createLinearGradient(
    x - halfWidth, y,
    x + halfWidth, y
  );
  gradient.addColorStop(0, `rgba(200, 230, 255, ${0.6 * shimmer})`);
  gradient.addColorStop(0.5, `rgba(220, 240, 255, ${0.8 * shimmer})`);
  gradient.addColorStop(1, `rgba(200, 230, 255, ${0.6 * shimmer})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(x - halfWidth, y - halfHeight, halfWidth * 2, halfHeight * 2);

  // Highlight streaks (ice reflections)
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * shimmer})`;
  ctx.lineWidth = 1;

  const streakCount = Math.floor(halfWidth / 15);
  for (let i = 0; i < streakCount; i++) {
    const streakX = x - halfWidth + (i + 0.5) * (halfWidth * 2 / streakCount);
    const offset = Math.sin(timeMs * 0.002 + i) * 3;

    ctx.beginPath();
    ctx.moveTo(streakX + offset, y - halfHeight);
    ctx.lineTo(streakX - offset, y + halfHeight);
    ctx.stroke();
  }

  // Sparkle particles
  const sparkleCount = 3;
  for (let i = 0; i < sparkleCount; i++) {
    const sparklePhase = (timeMs * 0.001 + i * 1.5) % 3;
    if (sparklePhase < 1) {
      const sparkleX = x - halfWidth + (i + 0.5) * (halfWidth * 2 / sparkleCount);
      const sparkleY = y + Math.sin(sparklePhase * Math.PI) * 3;
      const alpha = Math.sin(sparklePhase * Math.PI);

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Border
  ctx.strokeStyle = 'rgba(150, 200, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - halfWidth, y - halfHeight, halfWidth * 2, halfHeight * 2);
}

function renderStickyZone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  halfWidth: number,
  halfHeight: number,
  timeMs: number
): void {
  // Sticky: Brown/amber tar-like substance
  const wobble = Math.sin(timeMs * 0.002) * 0.05 + 1;

  // Base sticky surface
  const gradient = ctx.createLinearGradient(
    x - halfWidth, y - halfHeight,
    x - halfWidth, y + halfHeight
  );
  gradient.addColorStop(0, 'rgba(139, 90, 43, 0.8)');
  gradient.addColorStop(0.5, 'rgba(101, 67, 33, 0.9)');
  gradient.addColorStop(1, 'rgba(80, 50, 20, 0.8)');

  ctx.fillStyle = gradient;
  ctx.fillRect(x - halfWidth, y - halfHeight, halfWidth * 2, halfHeight * 2);

  // Sticky bubbles
  const bubbleCount = Math.floor(halfWidth / 20);
  for (let i = 0; i < bubbleCount; i++) {
    const bubblePhase = (timeMs * 0.001 + i * 0.7) % 2;
    const bubbleX = x - halfWidth + (i + 0.5) * (halfWidth * 2 / bubbleCount);
    const bubbleY = y - halfHeight + bubblePhase * halfHeight;
    const bubbleSize = 2 + Math.sin(bubblePhase * Math.PI) * 1.5;
    const alpha = bubblePhase < 1 ? bubblePhase : 2 - bubblePhase;

    ctx.fillStyle = `rgba(180, 120, 60, ${alpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(bubbleX, bubbleY, bubbleSize * wobble, 0, Math.PI * 2);
    ctx.fill();
  }

  // Drip effect on edges
  ctx.fillStyle = 'rgba(101, 67, 33, 0.6)';
  const dripCount = 4;
  for (let i = 0; i < dripCount; i++) {
    const dripX = x - halfWidth + (i + 0.5) * (halfWidth * 2 / dripCount);
    const dripPhase = (timeMs * 0.0005 + i * 0.25) % 1;
    const dripHeight = 3 + dripPhase * 2;

    ctx.beginPath();
    ctx.ellipse(dripX, y + halfHeight + dripHeight / 2, 2, dripHeight, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Border
  ctx.strokeStyle = 'rgba(80, 50, 20, 0.7)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - halfWidth, y - halfHeight, halfWidth * 2, halfHeight * 2);
}
