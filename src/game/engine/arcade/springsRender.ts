// src/game/engine/arcade/springsRender.ts
import type { Spring } from './springs';
import type { SpringDirection } from './types';
import { assetPath } from '@/lib/assetPath';

// Direction arrow angles (in radians)
const DIRECTION_ANGLES: Record<SpringDirection, number> = {
  up: -Math.PI / 2,
  'up-left': -Math.PI * 0.75,
  'up-right': -Math.PI * 0.25,
  down: Math.PI / 2,
};

// Spring sprite
let springSprite: HTMLImageElement | null = null;

function getSpringSprite(): HTMLImageElement | null {
  if (springSprite) return springSprite;

  const img = new Image();
  img.src = assetPath('/assets/pickables/spring.png');
  springSprite = img;

  return img.complete ? img : null;
}

// Preload spring sprite on module load
(() => {
  const img = new Image();
  img.src = assetPath('/assets/pickables/spring.png');
  springSprite = img;
})();

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
  const { x, y, direction, radius, usedThisThrow } = spring;

  ctx.save();

  // Squish animation when used
  const squish = usedThisThrow ? 0.5 : 1;
  const bounce = usedThisThrow ? 0 : Math.sin(timeMs * 0.005) * 0.1;

  ctx.translate(x, y);

  // Try to render sprite
  const sprite = getSpringSprite();
  if (sprite && sprite.complete && sprite.naturalWidth > 0) {
    // Apply squish/bounce to sprite
    ctx.scale(1, squish + bounce);

    // Rotate based on direction
    ctx.rotate(DIRECTION_ANGLES[direction] + Math.PI / 2);

    const spriteSize = radius * 2.5;
    ctx.globalAlpha = usedThisThrow ? 0.5 : 1;
    ctx.drawImage(
      sprite,
      -spriteSize / 2,
      -spriteSize / 2,
      spriteSize,
      spriteSize
    );
  } else {
    // Fallback: hand-drawn coil
    ctx.scale(1, squish + bounce);

    ctx.beginPath();
    ctx.strokeStyle = usedThisThrow ? '#999' : '#FF6B6B';
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
    ctx.fillStyle = usedThisThrow ? '#666' : '#333';
    ctx.fillRect(-radius * 0.6, coilHeight / 2, radius * 1.2, 4);

    // Direction arrow
    ctx.translate(0, -coilHeight / 2 - 8);
    ctx.rotate(DIRECTION_ANGLES[direction] + Math.PI / 2);

    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(-5, 4);
    ctx.lineTo(5, 4);
    ctx.closePath();
    ctx.fillStyle = usedThisThrow ? '#999' : '#FFD700';
    ctx.fill();
  }

  ctx.restore();
}
