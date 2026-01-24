// src/game/engine/arcade/portalRender.ts
import type { Portal } from './portal';

// Flipbook colors
const PORTAL_BLUE = '#1e3a5f';      // Ballpoint pen blue
const PORTAL_ORANGE = '#d35400';    // Stabilo orange
const PORTAL_GLOW = 'rgba(30, 58, 95, 0.4)';

export function renderPortal(
  ctx: CanvasRenderingContext2D,
  portal: Portal | null,
  timeMs: number
): void {
  if (!portal) return;

  // Render both portals identically (bidirectional)
  renderPortalOrb(ctx, portal.aX, portal.aY, portal.radius, timeMs, portal.usedThisThrow);
  renderPortalOrb(ctx, portal.bX, portal.bY, portal.radius, timeMs, portal.usedThisThrow);

  // Connection line - hand-drawn dashed style
  if (!portal.usedThisThrow) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(portal.aX, portal.aY);
    ctx.lineTo(portal.bX, portal.bY);
    ctx.strokeStyle = PORTAL_BLUE;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.globalAlpha = 0.3;
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
  used: boolean
): void {
  ctx.save();

  const pulsePhase = timeMs * 0.004;
  const pulse = 1 + Math.sin(pulsePhase) * 0.12;
  const r = radius * pulse;

  ctx.translate(x, y);

  // Outer glow (hand-drawn feel)
  if (!used) {
    const gradient = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.8);
    gradient.addColorStop(0, 'rgba(211, 84, 0, 0.5)');  // Orange center
    gradient.addColorStop(0.5, 'rgba(30, 58, 95, 0.3)'); // Blue mid
    gradient.addColorStop(1, 'rgba(30, 58, 95, 0)');
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // Main circle - sketchy wobble
  ctx.beginPath();
  const segments = 24;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const wobble = Math.sin(angle * 3 + timeMs * 0.002) * 1.5;
    const currentR = r + wobble;
    const px = Math.cos(angle) * currentR;
    const py = Math.sin(angle) * currentR;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Fill with paper texture
  ctx.fillStyle = used ? '#e0e0e0' : '#f5f0e1';
  ctx.fill();

  // Stroke with pen style
  ctx.strokeStyle = used ? '#999' : PORTAL_BLUE;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner spiral (hand-drawn)
  if (!used) {
    ctx.beginPath();
    const spiralTurns = 2;
    const points = 30;
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const angle = t * Math.PI * 2 * spiralTurns + timeMs * 0.003;
      const spiralR = t * (r * 0.7);
      const px = Math.cos(angle) * spiralR;
      const py = Math.sin(angle) * spiralR;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = PORTAL_ORANGE;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Center dot
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fillStyle = used ? '#999' : PORTAL_ORANGE;
  ctx.fill();

  // Directional arrows (showing bidirectional)
  if (!used) {
    ctx.fillStyle = PORTAL_BLUE;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⟷', 0, r + 14);
  }

  ctx.restore();
}
