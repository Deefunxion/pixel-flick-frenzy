// src/game/engine/arcade/hazardsRender.ts
import type { Hazard } from './hazards';
import { HAZARD_SPRITES, getSprite, getAnimationFrame } from './arcadeAssets';

export function renderHazards(
  ctx: CanvasRenderingContext2D,
  hazards: Hazard[],
  timeMs: number
): void {
  hazards.forEach(hazard => {
    renderHazard(ctx, hazard, timeMs);
  });
}

function renderHazard(
  ctx: CanvasRenderingContext2D,
  hazard: Hazard,
  timeMs: number
): void {
  const { currentX, currentY, radius, sprite, scale } = hazard;

  ctx.save();
  ctx.translate(currentX, currentY);

  // Rotation animation for moving hazards (saws spin)
  const isMoving = hazard.motion.type !== 'static';
  if (isMoving || sprite === 'saw') {
    const rotationSpeed = sprite === 'saw' ? 0.01 : 0.003;
    ctx.rotate(timeMs * rotationSpeed);
  }

  // Get current animation frame from arcadeAssets
  const config = HAZARD_SPRITES[sprite as keyof typeof HAZARD_SPRITES];
  if (config) {
    const frameIndex = getAnimationFrame(config, timeMs);
    const framePath = config.frames[frameIndex];
    const img = getSprite(framePath);

    if (img) {
      const spriteSize = radius * 2 * (scale ?? 1);
      ctx.drawImage(
        img,
        -spriteSize / 2,
        -spriteSize / 2,
        spriteSize,
        spriteSize
      );
    } else {
      // Fallback: hand-drawn hazard based on type
      renderFallbackHazard(ctx, sprite, radius, timeMs);
    }
  } else {
    // Unknown sprite type, use fallback
    renderFallbackHazard(ctx, sprite, radius, timeMs);
  }

  ctx.restore();
}

function renderFallbackHazard(
  ctx: CanvasRenderingContext2D,
  sprite: string,
  radius: number,
  timeMs: number
): void {
  switch (sprite) {
    case 'spike':
      // Triangle spike
      ctx.beginPath();
      ctx.moveTo(0, -radius);
      ctx.lineTo(-radius * 0.7, radius);
      ctx.lineTo(radius * 0.7, radius);
      ctx.closePath();
      ctx.fillStyle = '#666';
      ctx.fill();
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;

    case 'saw':
      // Circular saw with teeth
      const teeth = 8;
      ctx.beginPath();
      for (let i = 0; i < teeth * 2; i++) {
        const angle = (i / (teeth * 2)) * Math.PI * 2;
        const r = i % 2 === 0 ? radius : radius * 0.6;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = '#888';
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center hole
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#333';
      ctx.fill();
      break;

    case 'fire':
      // Animated fire
      const flicker = Math.sin(timeMs * 0.02) * 0.2 + 1;
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * flicker);
      gradient.addColorStop(0, '#FFFF00');
      gradient.addColorStop(0.4, '#FF8800');
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(0, 0, radius * flicker, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      break;

    default:
      // Generic danger circle
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#FF4444';
      ctx.fill();
      ctx.strokeStyle = '#AA0000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // X mark
      ctx.beginPath();
      ctx.moveTo(-radius * 0.5, -radius * 0.5);
      ctx.lineTo(radius * 0.5, radius * 0.5);
      ctx.moveTo(radius * 0.5, -radius * 0.5);
      ctx.lineTo(-radius * 0.5, radius * 0.5);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
  }
}
