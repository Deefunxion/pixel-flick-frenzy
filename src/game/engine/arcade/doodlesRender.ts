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
  timeMs: number,
  levelId: number = 1
): void {
  // Render connecting lines first (behind doodles) for tutorial levels
  renderConnectingLines(ctx, doodles, levelId);

  doodles.forEach(doodle => {
    if (doodle.collected) {
      renderCollectedDoodle(ctx, doodle, timeMs);
    } else {
      renderActiveDoodle(ctx, doodle, timeMs);
    }
  });
}

/**
 * Render connecting lines between doodles for tutorial levels (1-10)
 * Helps new players understand the collection sequence
 */
function renderConnectingLines(
  ctx: CanvasRenderingContext2D,
  doodles: Doodle[],
  levelId: number
): void {
  // Only show for levels 1-10
  if (levelId > 10) return;
  if (doodles.length < 2) return;

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 180, 100, 0.25)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);

  ctx.beginPath();

  // Sort by sequence to draw in order
  const sorted = [...doodles]
    .filter(d => !d.collected)
    .sort((a, b) => a.sequence - b.sequence);

  for (let i = 0; i < sorted.length; i++) {
    const doodle = sorted[i];
    if (i === 0) {
      ctx.moveTo(doodle.x, doodle.y);
    } else {
      ctx.lineTo(doodle.x, doodle.y);
    }
  }

  ctx.stroke();
  ctx.restore();
}

function renderActiveDoodle(
  ctx: CanvasRenderingContext2D,
  doodle: Doodle,
  timeMs: number
): void {
  const { x, y, displaySize, sprite, sequence, rotation, isStrokeStart } = doodle;

  // Gentle bob animation
  const bobOffset = Math.sin(timeMs * 0.003 + sequence) * 3;

  // Stroke start glow (rendered behind doodle)
  if (isStrokeStart) {
    renderStrokeStartGlow(ctx, x, y + bobOffset, displaySize, timeMs);
  }

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

  // Center glow indicator - small vibrant white orb for precise hitbox
  renderCenterGlow(ctx, x, y + bobOffset, timeMs);

  // Sequence number indicator (not rotated)
  renderSequenceNumber(ctx, x, y + bobOffset, displaySize, sequence);
}

/**
 * Render a small vibrant white glow at the center of each doodle
 * This shows the exact hitbox center for precision collection
 */
function renderCenterGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  timeMs: number
): void {
  ctx.save();

  // Pulsing intensity
  const pulse = 0.8 + Math.sin(timeMs * 0.008) * 0.2;

  // Outer glow (soft halo)
  const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
  glowGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * pulse})`);
  glowGradient.addColorStop(0.3, `rgba(255, 255, 240, ${0.5 * pulse})`);
  glowGradient.addColorStop(0.6, `rgba(255, 220, 150, ${0.2 * pulse})`);
  glowGradient.addColorStop(1, 'rgba(255, 200, 100, 0)');

  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fillStyle = glowGradient;
  ctx.fill();

  // Core: bright white 4-pixel (2x2) square
  ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
  ctx.fillRect(x - 1, y - 1, 2, 2);

  ctx.restore();
}

/**
 * Render a prominent glow for stroke start doodles
 * Helps players identify where each stroke begins
 */
function renderStrokeStartGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  displaySize: number,
  timeMs: number
): void {
  ctx.save();

  // Strong pulsing effect
  const pulse = 0.7 + Math.sin(timeMs * 0.005) * 0.3;
  const radius = displaySize * 0.8;

  // Outer golden glow
  const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glowGradient.addColorStop(0, `rgba(255, 215, 0, ${0.6 * pulse})`);
  glowGradient.addColorStop(0.4, `rgba(255, 180, 0, ${0.3 * pulse})`);
  glowGradient.addColorStop(0.7, `rgba(255, 150, 0, ${0.15 * pulse})`);
  glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = glowGradient;
  ctx.fill();

  ctx.restore();
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
