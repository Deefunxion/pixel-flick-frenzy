import type { RingJuicePopup } from '../../ringJuice';
import type { RouteJuicePopup } from '../../routeJuice';

/**
 * Render ring juice text popups ("Nice!", "Great!", "PERFECT!")
 * Popups rise and fade out over time
 */
export function renderRingPopups(
  ctx: CanvasRenderingContext2D,
  popups: RingJuicePopup[]
): void {
  for (const popup of popups) {
    ctx.save();
    ctx.globalAlpha = popup.opacity;
    ctx.translate(popup.x, popup.y);
    ctx.scale(popup.scale, popup.scale);

    // Draw text with outline for visibility
    ctx.font = 'bold 14px "Comic Sans MS", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(popup.text, 0, 0);

    // Fill
    ctx.fillStyle = popup.color;
    ctx.fillText(popup.text, 0, 0);

    ctx.restore();
  }
}

/**
 * Render route juice text popups ("ROUTE 1!", "ROUTE 2!", "COMBO!")
 * Popups rise and fade out over time - purple/blue theme
 */
export function renderRoutePopups(
  ctx: CanvasRenderingContext2D,
  popups: RouteJuicePopup[]
): void {
  for (const popup of popups) {
    ctx.save();
    ctx.globalAlpha = popup.opacity;
    ctx.translate(popup.x, popup.y);
    ctx.scale(popup.scale, popup.scale);

    // Draw text with outline for visibility - bolder font for routes
    ctx.font = 'bold 16px "Comic Sans MS", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // White outline for contrast
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.strokeText(popup.text, 0, 0);

    // Black inner outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText(popup.text, 0, 0);

    // Fill with popup color
    ctx.fillStyle = popup.color;
    ctx.fillText(popup.text, 0, 0);

    ctx.restore();
  }
}

/**
 * Render screen edge glow effect when collecting multiple rings
 */
export function renderEdgeGlow(
  ctx: CanvasRenderingContext2D,
  intensity: number,
  width: number,
  height: number
): void {
  if (intensity <= 0) return;

  // Left edge glow
  const leftGradient = ctx.createLinearGradient(0, 0, 30, 0);
  leftGradient.addColorStop(0, `rgba(255, 215, 0, ${intensity * 0.4})`);
  leftGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = leftGradient;
  ctx.fillRect(0, 0, 30, height);

  // Right edge glow (mirror)
  const rightGradient = ctx.createLinearGradient(width - 30, 0, width, 0);
  rightGradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
  rightGradient.addColorStop(1, `rgba(255, 215, 0, ${intensity * 0.4})`);
  ctx.fillStyle = rightGradient;
  ctx.fillRect(width - 30, 0, 30, height);
}
