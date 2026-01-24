// src/game/engine/contractRender.ts
/**
 * Contract and Route UI Rendering
 *
 * Matches the hand-drawn flipbook aesthetic:
 * - No solid boxes or backgrounds
 * - Hand-drawn wobbly circles
 * - Comic Sans MS font
 * - Subtle, integrated visuals
 */

import type { Contract, ContractResult } from './contracts';
import type { Route } from './routes';

// Wobble function for hand-drawn effect
function getWobble(seed: number, intensity: number = 1.5): number {
  return (Math.sin(seed * 12.9898) * 43758.5453 % 1 - 0.5) * intensity;
}

// Draw a hand-drawn wobbly circle
function drawWobblyCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  lineWidth: number,
  nowMs: number,
  dashed: boolean = false
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  if (dashed) {
    ctx.setLineDash([4, 4]);
  }

  ctx.beginPath();
  const segments = 24;
  const frame = Math.floor(nowMs / 150);

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const wobble = getWobble(cx + cy + i + frame, 2);
    const r = radius + wobble;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
  ctx.restore();
}

/**
 * Render current contract objective - minimal, non-intrusive
 * Only shows result messages, no permanent HUD
 */
export function renderContractHUD(
  ctx: CanvasRenderingContext2D,
  contract: Contract | null,
  route: Route | null,
  lastResult: ContractResult | null,
  nowMs: number
): void {
  // No permanent HUD - just result messages

  // Last result flash (fade over 2 seconds)
  if (lastResult) {
    const age = nowMs % 10000;
    const flashAlpha = Math.max(0, 1 - age / 2000);

    if (flashAlpha > 0) {
      ctx.save();

      ctx.font = 'bold 12px "Comic Sans MS", cursive';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const text = lastResult.success
        ? `+${lastResult.reward} throws!`
        : lastResult.failReason ?? 'Miss!';

      const y = 50 + Math.sin(nowMs * 0.01) * 2;

      // Outline
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.globalAlpha = flashAlpha;
      ctx.strokeText(text, 240, y);

      // Fill
      ctx.fillStyle = lastResult.success ? '#7FD858' : '#FF6B6B';
      ctx.fillText(text, 240, y);

      ctx.restore();
    }
  }
}

/**
 * Render route nodes as subtle hand-drawn markers
 * Shows path the player should follow
 */
export function renderRouteNodeHighlight(
  ctx: CanvasRenderingContext2D,
  route: Route | null,
  nowMs: number
): void {
  if (!route) return;

  ctx.save();

  // Draw all route nodes with different styles based on state
  route.nodes.forEach((node, i) => {
    const completed = i < route.currentIndex;
    const current = i === route.currentIndex;
    const upcoming = i > route.currentIndex;

    if (completed) {
      // Completed nodes: faded green checkmark-ish circle
      ctx.globalAlpha = 0.4;
      drawWobblyCircle(ctx, node.x, node.y, 15, '#7FD858', 2, nowMs);
    } else if (current && !route.failed) {
      // Current target: pulsing hand-drawn circle
      const pulse = 1 + Math.sin(nowMs * 0.006) * 0.15;
      const radius = 20 * pulse;

      ctx.globalAlpha = 0.7 + Math.sin(nowMs * 0.008) * 0.2;
      drawWobblyCircle(ctx, node.x, node.y, radius, '#FFFFFF', 2.5, nowMs, true);

      // Small indicator arrow above
      ctx.globalAlpha = 0.6;
      const arrowY = node.y - radius - 8 + Math.sin(nowMs * 0.005) * 3;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(node.x, arrowY + 6);
      ctx.lineTo(node.x - 4, arrowY);
      ctx.lineTo(node.x + 4, arrowY);
      ctx.closePath();
      ctx.fill();
    } else if (upcoming && !route.failed) {
      // Upcoming nodes: very faint dashed circle
      ctx.globalAlpha = 0.25;
      drawWobblyCircle(ctx, node.x, node.y, 12, '#AAAAAA', 1.5, nowMs, true);
    }

    // Draw connection lines between nodes (faint)
    if (i < route.nodes.length - 1 && !route.failed) {
      const nextNode = route.nodes[i + 1];
      ctx.globalAlpha = completed ? 0.2 : 0.1;
      ctx.strokeStyle = completed ? '#7FD858' : '#888888';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(nextNode.x, nextNode.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  // Route failed indicator
  if (route.failed) {
    const currentNode = route.nodes[route.currentIndex];
    if (currentNode) {
      ctx.globalAlpha = 0.6 + Math.sin(nowMs * 0.01) * 0.2;
      drawWobblyCircle(ctx, currentNode.x, currentNode.y, 18, '#FF6B6B', 2.5, nowMs);

      // X mark
      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentNode.x - 6, currentNode.y - 6);
      ctx.lineTo(currentNode.x + 6, currentNode.y + 6);
      ctx.moveTo(currentNode.x + 6, currentNode.y - 6);
      ctx.lineTo(currentNode.x - 6, currentNode.y + 6);
      ctx.stroke();
    }
  }

  ctx.restore();
}
