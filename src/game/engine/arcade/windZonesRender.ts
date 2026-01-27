// src/game/engine/arcade/windZonesRender.ts
import type { WindZone } from './windZones';

/**
 * No-op particle update - particles are now computed in render from timeMs
 * @deprecated Particles are now procedural based on timeMs
 */
export function updateWindZoneParticles(_zones: WindZone[], _deltaMs: number): void {
  // Particles are now computed procedurally in renderWindZones from timeMs
}

/**
 * Render wind particles flowing in angle direction
 */
function renderWindParticles(
  ctx: CanvasRenderingContext2D,
  zone: WindZone,
  frameCount: number
): void {
  const radians = zone.angle * Math.PI / 180;
  const particleCount = 8;

  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#87CEEB';

  for (let i = 0; i < particleCount; i++) {
    // Particles spawn opposite to wind direction and flow toward angle
    const phase = (frameCount * 0.03 + i / particleCount) % 1;
    const startOffset = zone.radius * 0.8;

    // Start position (opposite side of wind direction)
    const startX = zone.x - Math.cos(radians) * startOffset;
    const startY = zone.y - Math.sin(radians) * startOffset;

    // End position (wind direction side)
    const endX = zone.x + Math.cos(radians) * startOffset;
    const endY = zone.y + Math.sin(radians) * startOffset;

    // Interpolate position based on phase
    const px = startX + (endX - startX) * phase;
    const py = startY + (endY - startY) * phase;

    // Random perpendicular offset for variety
    const perpAngle = radians + Math.PI / 2;
    const perpOffset = Math.sin(i * 2.5 + frameCount * 0.05) * zone.radius * 0.3;
    const finalX = px + Math.cos(perpAngle) * perpOffset;
    const finalY = py + Math.sin(perpAngle) * perpOffset;

    // Fade in/out
    const alpha = Math.sin(phase * Math.PI) * 0.5;
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.arc(finalX, finalY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Render wind zones as circular fields with directional particles
 */
export function renderWindZones(
  ctx: CanvasRenderingContext2D,
  zones: WindZone[],
  _playerInZone: boolean = false,
  timeMs: number = 0
): void {
  const frameCount = Math.floor(timeMs / 16); // ~60fps

  for (const zone of zones) {
    const { x, y, radius, angle, scale } = zone;

    ctx.save();

    // Draw semi-transparent circular area
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#87CEEB'; // Sky blue
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Zone border (dashed circle)
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#87CEEB';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw center sprite (rotated by angle)
    ctx.globalAlpha = 1;
    ctx.translate(x, y);
    ctx.rotate(angle * Math.PI / 180);

    // Draw wind icon (arrow pointing right, rotated by angle)
    const iconSize = 16 * scale;
    ctx.fillStyle = '#4A90D9';
    ctx.beginPath();
    // Arrow pointing right (will be rotated by angle)
    ctx.moveTo(iconSize, 0);
    ctx.lineTo(-iconSize / 2, -iconSize / 2);
    ctx.lineTo(-iconSize / 2, iconSize / 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Draw particles flowing in angle direction
    renderWindParticles(ctx, zone, frameCount);
  }
}
