import type { Theme } from '@/game/themes';

// Zeno Ruler constants
export const ZENO_RULER = {
  height: 24,      // Ruler height in pixels
  tickCount: 10,   // Number of tick marks per level
  threshold: 419,  // Position threshold to show ruler
};

/**
 * Calculate the current decimal level and bounds for Zeno's position
 * Level 0: 419.0 - 420.0 (tenths)
 * Level 1: 419.9 - 420.0 (hundredths)
 * Level 2: 419.99 - 420.0 (thousandths)
 * etc.
 */
export function getZenoRulerLevel(px: number): { level: number; lowerBound: number; progress: number } {
  if (px < 419) {
    return { level: 0, lowerBound: 419, progress: 0 };
  }

  const upperBound = 420;
  let level = 0;
  let lowerBound = 419;

  // Find the deepest level where px has passed the 90% mark
  while (level < 6) { // Max 6 levels (419.999999)
    const nextThreshold = upperBound - (upperBound - lowerBound) * 0.1;
    if (px >= nextThreshold) {
      lowerBound = nextThreshold;
      level++;
    } else {
      break;
    }
  }

  const range = upperBound - lowerBound;
  const progress = range > 0 ? (px - lowerBound) / range : 0;

  return { level, lowerBound, progress };
}

/**
 * Format a number for the Zeno ruler display
 */
export function formatRulerLabel(value: number, level: number): string {
  const decimals = Math.max(1, level + 1);
  return value.toFixed(decimals);
}

/**
 * Render the Zeno Paradox ruler - a fractal ruler that "grows" as you approach 420
 * The ruler zooms in as Zeno passes each decimal threshold
 */
export function renderZenoRuler(
  ctx: CanvasRenderingContext2D,
  px: number,
  isSliding: boolean,
  windowX: number,
  windowY: number,
  windowWidth: number,
  windowHeight: number,
  theme: Theme,
  nowMs: number
): void {
  // Only show during sliding, not flying
  if (px < ZENO_RULER.threshold || !isSliding) {
    return;
  }

  const { height: rulerHeight, tickCount } = ZENO_RULER;
  const { level, lowerBound, progress } = getZenoRulerLevel(px);
  const upperBound = 420;

  // Ruler position (at bottom of detail window)
  const rulerY = windowY + windowHeight - rulerHeight - 4;
  const rulerX = windowX + 8;
  const rulerWidth = windowWidth - 16;

  // Background for ruler
  ctx.fillStyle = theme.renderStyle.kind === 'noir'
    ? 'rgba(0, 0, 0, 0.8)'
    : 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(rulerX - 2, rulerY - 2, rulerWidth + 4, rulerHeight + 4);

  // Ruler base line
  ctx.strokeStyle = theme.foreground;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rulerX, rulerY + rulerHeight - 8);
  ctx.lineTo(rulerX + rulerWidth, rulerY + rulerHeight - 8);
  ctx.stroke();

  // Tick marks
  const tickSpacing = rulerWidth / tickCount;
  for (let i = 0; i <= tickCount; i++) {
    const tickX = rulerX + i * tickSpacing;
    const isMajor = i === 0 || i === tickCount || i === 5;
    const tickHeight = isMajor ? 8 : 4;

    ctx.strokeStyle = theme.foreground;
    ctx.lineWidth = isMajor ? 1.5 : 0.8;
    ctx.beginPath();
    ctx.moveTo(tickX, rulerY + rulerHeight - 8);
    ctx.lineTo(tickX, rulerY + rulerHeight - 8 - tickHeight);
    ctx.stroke();
  }

  // Zeno's toe marker (triangle pointing down)
  const toeX = rulerX + progress * rulerWidth;
  const toeY = rulerY + rulerHeight - 10;

  // Pulsing glow effect
  const pulse = Math.sin(nowMs / 150) * 0.3 + 0.7;
  ctx.shadowColor = theme.highlight;
  ctx.shadowBlur = 6 * pulse;

  // Toe marker triangle
  ctx.fillStyle = theme.highlight;
  ctx.beginPath();
  ctx.moveTo(toeX, toeY);
  ctx.lineTo(toeX - 4, toeY - 6);
  ctx.lineTo(toeX + 4, toeY - 6);
  ctx.closePath();
  ctx.fill();

  // Vertical line from toe
  ctx.strokeStyle = theme.highlight;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(toeX, toeY - 6);
  ctx.lineTo(toeX, rulerY + 2);
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Labels
  ctx.font = '7px monospace';
  ctx.textBaseline = 'top';

  // Left label (lower bound)
  ctx.textAlign = 'left';
  ctx.fillStyle = theme.foreground;
  ctx.fillText(formatRulerLabel(lowerBound, level), rulerX, rulerY);

  // Right label (420)
  ctx.textAlign = 'right';
  ctx.fillStyle = theme.danger || '#ff4444';
  ctx.fillText(formatRulerLabel(upperBound, level), rulerX + rulerWidth, rulerY);

  // Level indicator (∞ symbol gets bigger with level)
  if (level > 0) {
    ctx.textAlign = 'center';
    ctx.font = `${8 + level}px serif`;
    ctx.fillStyle = theme.highlight;
    const infinitySymbol = '∞'.repeat(Math.min(level, 3));
    ctx.fillText(infinitySymbol, rulerX + rulerWidth / 2, rulerY - 1);
  }

  // Current position label (above the toe)
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = theme.highlight;
  const posLabel = px.toFixed(Math.min(level + 2, 6));
  ctx.fillText(posLabel, toeX, rulerY + 2);
}
