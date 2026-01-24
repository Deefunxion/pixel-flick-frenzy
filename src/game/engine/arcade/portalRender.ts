// src/game/engine/arcade/portalRender.ts
import type { Portal } from './portal';

export function renderPortal(
  ctx: CanvasRenderingContext2D,
  portal: Portal | null,
  timeMs: number
): void {
  if (!portal) return;

  renderPortalOrb(ctx, portal.entryX, portal.entryY, portal.radius, timeMs, 'entry', portal.usedThisThrow);
  renderPortalOrb(ctx, portal.exitX, portal.exitY, portal.radius, timeMs, 'exit', portal.usedThisThrow);

  // Connection line (faint)
  if (!portal.usedThisThrow) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(portal.entryX, portal.entryY);
    ctx.lineTo(portal.exitX, portal.exitY);
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  }
}

function renderPortalOrb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  timeMs: number,
  type: 'entry' | 'exit',
  used: boolean
): void {
  ctx.save();

  const pulsePhase = timeMs * 0.003 + (type === 'exit' ? Math.PI : 0);
  const pulse = 1 + Math.sin(pulsePhase) * 0.15;
  const r = radius * pulse;

  // Swirl animation
  ctx.translate(x, y);
  ctx.rotate(timeMs * 0.002 * (type === 'entry' ? 1 : -1));

  // Outer glow
  const gradient = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.5);
  if (used) {
    gradient.addColorStop(0, 'rgba(100, 100, 100, 0.5)');
    gradient.addColorStop(1, 'rgba(100, 100, 100, 0)');
  } else if (type === 'entry') {
    gradient.addColorStop(0, 'rgba(147, 51, 234, 0.8)'); // Purple
    gradient.addColorStop(1, 'rgba(147, 51, 234, 0)');
  } else {
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)'); // Blue
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
  }

  ctx.beginPath();
  ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Inner spiral
  ctx.beginPath();
  const spiralSegments = 3;
  for (let i = 0; i < spiralSegments; i++) {
    const angle = (i / spiralSegments) * Math.PI * 2;
    const spiralR = r * 0.7;
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
      Math.cos(angle) * spiralR * 0.5,
      Math.sin(angle) * spiralR * 0.5,
      Math.cos(angle + 0.5) * spiralR,
      Math.sin(angle + 0.5) * spiralR
    );
  }
  ctx.strokeStyle = used ? '#666' : (type === 'entry' ? '#A855F7' : '#3B82F6');
  ctx.lineWidth = 2;
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fillStyle = used ? '#999' : '#FFF';
  ctx.fill();

  // Label
  ctx.rotate(-timeMs * 0.002 * (type === 'entry' ? 1 : -1)); // Counter-rotate for readable text
  ctx.fillStyle = used ? '#666' : '#FFF';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(type === 'entry' ? 'IN' : 'OUT', 0, r + 12);

  ctx.restore();
}
