// src/game/engine/arcade/gravityWellsRender.ts
import type { GravityWell } from './gravityWells';

// Particle state for visual effect
interface WellParticle {
  angle: number;
  distance: number;
  speed: number;
  size: number;
}

// Store particles per well
const wellParticles: Map<GravityWell, WellParticle[]> = new WeakMap() as Map<GravityWell, WellParticle[]>;

function getOrCreateParticles(well: GravityWell): WellParticle[] {
  let particles = wellParticles.get(well);
  if (!particles) {
    // Create particles in a spiral pattern
    particles = [];
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        angle: (i / particleCount) * Math.PI * 2,
        distance: well.radius * (0.3 + (i % 3) * 0.25),
        speed: 1 + Math.random() * 0.5,
        size: 2 + Math.random() * 2,
      });
    }
    wellParticles.set(well, particles);
  }
  return particles;
}

export function renderGravityWells(
  ctx: CanvasRenderingContext2D,
  wells: GravityWell[],
  timeMs: number
): void {
  wells.forEach(well => {
    renderGravityWell(ctx, well, timeMs);
  });
}

function renderGravityWell(
  ctx: CanvasRenderingContext2D,
  well: GravityWell,
  timeMs: number
): void {
  const { x, y, radius, type, strength } = well;

  ctx.save();
  ctx.translate(x, y);

  // Pulsing animation
  const pulse = 1 + Math.sin(timeMs * 0.003) * 0.1;

  // Colors based on type
  const isAttract = type === 'attract';
  const primaryColor = isAttract ? '#6666FF' : '#FF6666';
  const secondaryColor = isAttract ? '#4444AA' : '#AA4444';
  const glowColor = isAttract ? 'rgba(100, 100, 255, 0.3)' : 'rgba(255, 100, 100, 0.3)';

  // Outer glow
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * pulse);
  gradient.addColorStop(0, glowColor);
  gradient.addColorStop(0.5, isAttract ? 'rgba(100, 100, 255, 0.1)' : 'rgba(255, 100, 100, 0.1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.beginPath();
  ctx.arc(0, 0, radius * pulse, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Field lines (circles)
  const ringCount = 3;
  for (let i = 1; i <= ringCount; i++) {
    const ringRadius = (radius / (ringCount + 1)) * i * pulse;
    const alpha = 0.3 - (i * 0.08);

    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = isAttract
      ? `rgba(100, 100, 255, ${alpha})`
      : `rgba(255, 100, 100, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
  }

  ctx.setLineDash([]);

  // Animated particles
  const particles = getOrCreateParticles(well);
  const particleTime = timeMs * 0.002 * (isAttract ? 1 : -1);

  particles.forEach(particle => {
    const angle = particle.angle + particleTime * particle.speed;
    // For attract, particles spiral inward; for repel, spiral outward
    const distanceOffset = Math.sin(timeMs * 0.005 + particle.angle) * 0.1;
    const dist = particle.distance * (1 + distanceOffset) * pulse;

    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;

    ctx.beginPath();
    ctx.arc(px, py, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = primaryColor;
    ctx.globalAlpha = 0.6;
    ctx.fill();
  });

  ctx.globalAlpha = 1;

  // Center orb
  const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
  centerGradient.addColorStop(0, '#FFFFFF');
  centerGradient.addColorStop(0.5, primaryColor);
  centerGradient.addColorStop(1, secondaryColor);

  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fillStyle = centerGradient;
  ctx.fill();

  // Direction indicator arrows
  const arrowCount = 4;
  for (let i = 0; i < arrowCount; i++) {
    const angle = (i / arrowCount) * Math.PI * 2 + timeMs * 0.002;
    const arrowDist = radius * 0.6;

    ctx.save();
    ctx.rotate(angle);
    ctx.translate(arrowDist, 0);
    ctx.rotate(isAttract ? Math.PI : 0);  // Point inward for attract, outward for repel

    // Draw arrow
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-4, -4);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fillStyle = primaryColor;
    ctx.globalAlpha = 0.5;
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}
