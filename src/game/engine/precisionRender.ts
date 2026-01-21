import type { Theme } from '@/game/themes';
import type { GameState } from './types';
import {
  calculatePrecisionProgress,
  formatPrecisionScore,
  getPbMarkerPosition,
  getPrecisionBarColor,
  hasPassedPb,
} from './precisionBar';

// Bar dimensions (fixed)
const BAR_WIDTH = 60;
const BAR_HEIGHT = 8;
const BAR_GAP_FROM_STAMINA = 4;

/**
 * Draw precision bar above Zeno (above stamina bar if visible).
 */
export function drawPrecisionBar(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  zenoX: number,
  zenoY: number,
  theme: Theme,
  nowMs: number
): void {
  if (!state.precisionBarActive) return;

  const staminaVisible = state.stamina < 100;
  // Position above stamina bar if visible, otherwise directly above Zeno
  const baseY = zenoY - (staminaVisible ? 25 + 6 + BAR_GAP_FROM_STAMINA : 25);

  const barX = zenoX - BAR_WIDTH / 2;
  const barY = baseY - BAR_HEIGHT - BAR_GAP_FROM_STAMINA;

  // Progress through precision zone
  const progress = calculatePrecisionProgress(state.px);
  const fillWidth = progress * BAR_WIDTH;

  // Background (dark)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(barX, barY, BAR_WIDTH, BAR_HEIGHT);

  // Fill with gradient color
  const fillColor = getPrecisionBarColor(state.px);
  ctx.fillStyle = fillColor;
  ctx.fillRect(barX, barY, fillWidth, BAR_HEIGHT);

  // Pulse effect for very high precision (419.99+)
  if (progress > 0.99) {
    const pulse = Math.sin(nowMs / 100) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.5})`;
    ctx.fillRect(barX, barY, fillWidth, BAR_HEIGHT);
  }

  // PB marker (white vertical line, 1px)
  const pbPosition = getPbMarkerPosition(state.best, BAR_WIDTH);
  if (pbPosition !== null) {
    const pbPassed = hasPassedPb(state.px, state.best);
    ctx.strokeStyle = pbPassed ? '#888888' : '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(barX + pbPosition, barY);
    ctx.lineTo(barX + pbPosition, barY + BAR_HEIGHT);
    ctx.stroke();

    // Flash effect when passing PB
    if (pbPassed && !state.passedPbThisThrow) {
      const flash = Math.sin(nowMs / 50) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255, 215, 0, ${flash * 0.8})`;
      ctx.fillRect(barX, barY - 2, BAR_WIDTH, BAR_HEIGHT + 4);
    }
  }

  // Border
  ctx.strokeStyle = theme.accent3;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, BAR_WIDTH, BAR_HEIGHT);

  // Score display (inside bar, right-aligned, premium feel)
  const scoreText = formatPrecisionScore(state.px);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 7px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  // Text shadow for readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 2;
  ctx.fillText(scoreText, barX + BAR_WIDTH - 2, barY + BAR_HEIGHT / 2);
  ctx.shadowBlur = 0;

  // "NEW!" indicator when passing PB
  if (hasPassedPb(state.px, state.best) && state.best >= 410) {
    const blink = Math.floor(nowMs / 200) % 2;
    if (blink) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 6px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('NEW!', barX + 2, barY - 3);
    }
  }
}

/**
 * Draw "Almost!" overlay on successful landing showing distance from target.
 * Uses frozen distance stored in state.almostOverlayDistance.
 */
export function drawPrecisionFallOverlay(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  W: number,
  H: number,
  theme: Theme,
  nowMs: number
): void {
  // Use the frozen distance from landing
  const distanceFromTarget = state.almostOverlayDistance;
  if (distanceFromTarget <= 0) return;

  const centerX = W / 2;
  const centerY = H / 2 - 20;

  // Background overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, W, H);

  // "ALMOST!" text with bounce animation
  const bounce = Math.sin(nowMs / 150) * 3;
  ctx.fillStyle = '#f08c1d';
  ctx.font = 'bold 20px "Comic Sans MS", cursive, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ALMOST!', centerX, centerY - 20 + bounce);

  // Distance from target display
  const barWidth = 100;
  const barHeight = 10;
  const barX = centerX - barWidth / 2;
  const barY = centerY;

  // Progress bar showing how close to target
  // Full bar = reached target, empty = far from target
  const maxDistance = 50; // Max distance we show on bar
  const progress = Math.max(0, 1 - (distanceFromTarget / maxDistance));
  const fillWidth = progress * barWidth;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Fill - color based on how close
  const fillColor = distanceFromTarget < 5 ? '#f08c1d' :
                    distanceFromTarget < 15 ? '#FFA500' : theme.accent3;
  ctx.fillStyle = fillColor;
  ctx.fillRect(barX, barY, fillWidth, barHeight);

  // Target marker at the end
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(barX + barWidth - 1, barY);
  ctx.lineTo(barX + barWidth - 1, barY + barHeight);
  ctx.stroke();

  // Border
  ctx.strokeStyle = theme.accent3;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Distance text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${distanceFromTarget.toFixed(2)} to target`, centerX, barY + barHeight + 18);

  // Contextual message
  let message = '';
  if (distanceFromTarget < 2) {
    message = 'So close!';
  } else if (distanceFromTarget < 10) {
    message = 'Almost there!';
  } else {
    message = 'Keep going!';
  }
  ctx.fillStyle = theme.accent3;
  ctx.font = '10px sans-serif';
  ctx.fillText(message, centerX, barY + barHeight + 35);
}

/**
 * Draw success overlay for new PB in precision zone.
 */
export function drawPrecisionSuccessOverlay(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  W: number,
  H: number,
  theme: Theme,
  nowMs: number,
  previousBest: number
): void {
  if (state.dist < 410 || state.fellOff) return;

  const isNewPb = state.dist > previousBest && previousBest >= 410;
  if (!isNewPb) return;

  const centerX = W / 2;
  const centerY = H / 2 - 20;

  // Golden glow background
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100);
  gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // Sparkle effect
  const sparkle = Math.sin(nowMs / 100) * 0.5 + 0.5;
  ctx.fillStyle = `rgba(255, 255, 255, ${sparkle * 0.8})`;
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✨', centerX - 60, centerY - 15);
  ctx.fillText('✨', centerX + 60, centerY - 15);

  // "NEW PERSONAL BEST!" text
  const bounce = Math.sin(nowMs / 150) * 2;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 14px "Comic Sans MS", cursive, sans-serif';
  ctx.fillText('NEW PERSONAL BEST!', centerX, centerY - 10 + bounce);

  // Score
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(state.dist.toFixed(6), centerX, centerY + 15);

  // Improvement
  const improvement = state.dist - previousBest;
  ctx.fillStyle = '#22c55e';
  ctx.font = '10px sans-serif';
  ctx.fillText(`+${improvement.toFixed(6)}`, centerX, centerY + 30);
}
