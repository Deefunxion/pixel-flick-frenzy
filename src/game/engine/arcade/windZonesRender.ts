// src/game/engine/arcade/windZonesRender.ts
import type { WindZone } from './windZones';

// Wind particle for visual effect
interface WindParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

// Store particles per zone
const particlesByZone = new WeakMap<WindZone, WindParticle[]>();

/**
 * Get or create particle array for a zone
 */
function getParticles(zone: WindZone): WindParticle[] {
  let particles = particlesByZone.get(zone);
  if (!particles) {
    particles = [];
    particlesByZone.set(zone, particles);
  }
  return particles;
}

/**
 * Spawn a new wind particle within zone bounds
 */
function spawnParticle(zone: WindZone): WindParticle {
  // Spawn from edge opposite to wind direction
  let x: number, y: number;

  switch (zone.direction) {
    case 'right':
      x = zone.left;
      y = zone.top + Math.random() * zone.height;
      break;
    case 'left':
      x = zone.right;
      y = zone.top + Math.random() * zone.height;
      break;
    case 'down':
      x = zone.left + Math.random() * zone.width;
      y = zone.top;
      break;
    case 'up':
      x = zone.left + Math.random() * zone.width;
      y = zone.bottom;
      break;
    default:
      x = zone.x;
      y = zone.y;
  }

  // Velocity in wind direction
  const speed = zone.strength * 30 + Math.random() * 20;
  let vx = 0, vy = 0;

  switch (zone.direction) {
    case 'right': vx = speed; break;
    case 'left': vx = -speed; break;
    case 'down': vy = speed; break;
    case 'up': vy = -speed; break;
  }

  return {
    x,
    y,
    vx,
    vy,
    life: 1,
    maxLife: 1,
  };
}

/**
 * Update wind zone particles
 */
export function updateWindZoneParticles(zones: WindZone[], deltaMs: number): void {
  const dt = deltaMs / 1000;

  for (const zone of zones) {
    const particles = getParticles(zone);

    // Update existing particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 2; // Fade over ~0.5 seconds

      // Remove dead or out-of-bounds particles
      if (p.life <= 0 || !isInZoneBounds(p.x, p.y, zone)) {
        particles.splice(i, 1);
      }
    }

    // Spawn new particles (based on zone size)
    const targetCount = Math.floor((zone.width * zone.height) / 2000);
    while (particles.length < targetCount) {
      particles.push(spawnParticle(zone));
    }
  }
}

function isInZoneBounds(x: number, y: number, zone: WindZone): boolean {
  return x >= zone.left && x <= zone.right && y >= zone.top && y <= zone.bottom;
}

/**
 * Render wind zones with visual feedback
 */
export function renderWindZones(
  ctx: CanvasRenderingContext2D,
  zones: WindZone[],
  playerInZone: boolean = false
): void {
  for (const zone of zones) {
    // Draw zone background (semi-transparent)
    ctx.save();

    // Zone fill
    ctx.fillStyle = 'rgba(135, 206, 235, 0.15)'; // Sky blue, very transparent
    ctx.fillRect(zone.left, zone.top, zone.width, zone.height);

    // Zone border (dashed)
    ctx.strokeStyle = 'rgba(135, 206, 235, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(zone.left, zone.top, zone.width, zone.height);
    ctx.setLineDash([]);

    // Draw wind direction indicator
    drawWindArrow(ctx, zone);

    // Draw particles
    const particles = getParticles(zone);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';

    for (const p of particles) {
      const alpha = p.life;
      ctx.globalAlpha = alpha * 0.6;

      // Draw as small line/streak in direction of motion
      const streakLen = 4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - (p.vx / 30) * streakLen, p.y - (p.vy / 30) * streakLen);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }
}

/**
 * Draw wind direction arrow in center of zone
 */
function drawWindArrow(ctx: CanvasRenderingContext2D, zone: WindZone): void {
  const cx = zone.x;
  const cy = zone.y;
  const arrowLen = Math.min(zone.width, zone.height) * 0.3;

  ctx.save();
  ctx.translate(cx, cy);

  // Rotate based on direction
  let angle = 0;
  switch (zone.direction) {
    case 'right': angle = 0; break;
    case 'down': angle = Math.PI / 2; break;
    case 'left': angle = Math.PI; break;
    case 'up': angle = -Math.PI / 2; break;
  }
  ctx.rotate(angle);

  // Draw arrow
  ctx.strokeStyle = 'rgba(135, 206, 235, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-arrowLen / 2, 0);
  ctx.lineTo(arrowLen / 2, 0);
  ctx.lineTo(arrowLen / 2 - 6, -4);
  ctx.moveTo(arrowLen / 2, 0);
  ctx.lineTo(arrowLen / 2 - 6, 4);
  ctx.stroke();

  ctx.restore();
}
