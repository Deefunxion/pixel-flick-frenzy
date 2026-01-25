// src/game/engine/arcade/doodlesRender.ts
import type { Doodle } from './doodles';
import { assetPath } from '@/lib/assetPath';

// Sprite cache
const spriteCache: Map<string, HTMLImageElement> = new Map();

// Available doodle sprites (coin and star from pickables folder)
const DOODLE_SPRITES = ['coin', 'star'] as const;

function getDoodleSprite(sprite: string): HTMLImageElement | null {
  const cached = spriteCache.get(sprite);
  if (cached) return cached;

  const img = new Image();
  // Use pickables folder for actual assets
  img.src = assetPath(`/assets/pickables/${sprite}.png`);
  spriteCache.set(sprite, img);

  return img.complete ? img : null;
}

// Preload sprites on module load
DOODLE_SPRITES.forEach(sprite => {
  const img = new Image();
  img.src = assetPath(`/assets/pickables/${sprite}.png`);
  spriteCache.set(sprite, img);
});

export function renderDoodles(
  ctx: CanvasRenderingContext2D,
  doodles: Doodle[],
  timeMs: number
): void {
  doodles.forEach(doodle => {
    if (doodle.collected) {
      renderCollectedDoodle(ctx, doodle, timeMs);
    } else {
      renderActiveDoodle(ctx, doodle, timeMs);
    }
  });
}

function renderActiveDoodle(
  ctx: CanvasRenderingContext2D,
  doodle: Doodle,
  timeMs: number
): void {
  const { x, y, displaySize, sprite, sequence, rotation } = doodle;

  // Gentle bob animation
  const bobOffset = Math.sin(timeMs * 0.003 + sequence) * 3;

  ctx.save();

  // Apply rotation if set
  if (rotation !== 0) {
    ctx.translate(x, y + bobOffset);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-x, -(y + bobOffset));
  }

  // Try to render sprite
  const img = getDoodleSprite(sprite);
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(
      img,
      x - displaySize / 2,
      y - displaySize / 2 + bobOffset,
      displaySize,
      displaySize
    );
  } else {
    // Fallback: hand-drawn circle
    renderFallbackDoodle(ctx, x, y + bobOffset, displaySize, sequence);
  }

  ctx.restore();

  // Sequence number indicator (not rotated)
  renderSequenceNumber(ctx, x, y + bobOffset, displaySize, sequence);
}

function renderFallbackDoodle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  _sequence: number
): void {
  ctx.save();

  // Wobbly circle (hand-drawn style)
  ctx.beginPath();
  const radius = size / 2;
  const segments = 16;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const wobble = Math.sin(i * 3) * 2;
    const r = radius + wobble;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  ctx.fillStyle = '#FFF8E7';
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

function renderSequenceNumber(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  sequence: number
): void {
  ctx.save();

  // Tiny sequence badge (65% smaller than original 8px)
  const numX = x + size / 2 + 1;
  const numY = y - size / 2 - 1;

  ctx.beginPath();
  ctx.arc(numX, numY, 3, 0, Math.PI * 2);  // 8px → 3px (65% smaller)
  ctx.fillStyle = '#d35400';  // Stabilo orange
  ctx.fill();
  ctx.strokeStyle = '#1e3a5f';  // Ink blue
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 4px sans-serif';  // 10px → 4px
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(sequence), numX, numY);

  ctx.restore();
}

function renderCollectedDoodle(
  ctx: CanvasRenderingContext2D,
  doodle: Doodle,
  timeMs: number
): void {
  const elapsed = timeMs - doodle.collectedAt;
  if (elapsed > 500) return; // Animation complete

  const progress = elapsed / 500;
  const scale = 1 + progress * 0.5;
  const alpha = 1 - progress;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(doodle.x, doodle.y);
  ctx.scale(scale, scale);
  ctx.translate(-doodle.x, -doodle.y);

  renderFallbackDoodle(ctx, doodle.x, doodle.y, doodle.displaySize, doodle.sequence);

  ctx.restore();
}

// Preload common sprites
export function preloadDoodleSprites(sprites: string[]): void {
  sprites.forEach(getDoodleSprite);
}
