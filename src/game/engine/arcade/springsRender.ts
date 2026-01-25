// src/game/engine/arcade/springsRender.ts
import type { Spring } from './springs';
import type { SpringDirection } from './types';
import { SPRING_SPRITES, getSprite, getAnimationFrame } from './arcadeAssets';

// Direction arrow angles (in radians)
const DIRECTION_ANGLES: Record<SpringDirection, number> = {
  up: -Math.PI / 2,
  'up-left': -Math.PI * 0.75,
  'up-right': -Math.PI * 0.25,
  down: Math.PI / 2,
};

export function renderSprings(
  ctx: CanvasRenderingContext2D,
  springs: Spring[],
  timeMs: number
): void {
  springs.forEach(spring => {
    renderSpring(ctx, spring, timeMs);
  });
}

function renderSpring(
  ctx: CanvasRenderingContext2D,
  spring: Spring,
  timeMs: number
): void {
  const { x, y, direction, radius, usedThisThrow, isActive, timing } = spring;

  ctx.save();

  // Determine visual state
  const isInactive = !isActive && timing !== null; // Timed spring in off phase
  const isUsed = usedThisThrow;

  // Squish animation when used, collapse when inactive
  const squish = isUsed ? 0.5 : (isInactive ? 0.3 : 1);
  const bounce = (isUsed || isInactive) ? 0 : Math.sin(timeMs * 0.005) * 0.1;

  ctx.translate(x, y);

  // Determine alpha and color based on state
  const alpha = isInactive ? 0.3 : (isUsed ? 0.5 : 1);
  const coilColor = isInactive ? '#666' : (isUsed ? '#999' : '#FF6B6B');
  const arrowColor = isInactive ? '#666' : (isUsed ? '#999' : '#FFD700');
  const baseColor = isInactive ? '#444' : (isUsed ? '#666' : '#333');

  // Try to render animated sprite
  const frameIndex = getAnimationFrame(SPRING_SPRITES, timeMs);
  const framePath = SPRING_SPRITES.frames[frameIndex];
  const sprite = getSprite(framePath);

  if (sprite) {
    // Apply squish/bounce to sprite
    ctx.scale(1, squish + bounce);

    // Rotate based on direction
    ctx.rotate(DIRECTION_ANGLES[direction] + Math.PI / 2);

    const spriteSize = radius * 2.5;
    ctx.globalAlpha = alpha;
    ctx.drawImage(
      sprite,
      -spriteSize / 2,
      -spriteSize / 2,
      spriteSize,
      spriteSize
    );

    // If inactive (timed spring off), add visual indicator
    if (isInactive) {
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-spriteSize / 3, -spriteSize / 3);
      ctx.lineTo(spriteSize / 3, spriteSize / 3);
      ctx.stroke();
    }
  } else {
    // Fallback: hand-drawn coil
    ctx.scale(1, squish + bounce);

    ctx.beginPath();
    ctx.strokeStyle = coilColor;
    ctx.lineWidth = 3;

    const coilHeight = radius * 1.5;
    const coilWidth = radius * 0.8;
    const coils = 4;

    ctx.moveTo(-coilWidth / 2, coilHeight / 2);
    for (let i = 0; i <= coils; i++) {
      const t = i / coils;
      const yPos = coilHeight / 2 - t * coilHeight;
      const xPos = (i % 2 === 0 ? -1 : 1) * coilWidth / 2;
      ctx.lineTo(xPos, yPos);
    }
    ctx.stroke();

    // Base plate
    ctx.fillStyle = baseColor;
    ctx.fillRect(-radius * 0.6, coilHeight / 2, radius * 1.2, 4);

    // Direction arrow (only if active)
    if (!isInactive) {
      ctx.translate(0, -coilHeight / 2 - 8);
      ctx.rotate(DIRECTION_ANGLES[direction] + Math.PI / 2);

      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(-5, 4);
      ctx.lineTo(5, 4);
      ctx.closePath();
      ctx.fillStyle = arrowColor;
      ctx.fill();
    }
  }

  ctx.restore();
}
