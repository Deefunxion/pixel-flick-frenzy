import type { Theme } from '@/game/themes';
import { MAX_ANGLE, MIN_ANGLE, OPTIMAL_ANGLE, MIN_POWER, MAX_POWER, BASE_GRAV, W } from '@/game/constants';
import {
  drawHandCircle,
  drawDecorativeCurl,
  drawStyledTrajectory,
  drawAimArrow,
} from '../../sketchy';

/**
 * Draw the charging HUD - power bar, angle arc, trajectory preview
 */
export function drawChargeHud(
  ctx: CanvasRenderingContext2D,
  zenoX: number,
  zenoY: number,
  groundY: number,
  ZENO_Y_OFFSET: number,
  chargePower: number,
  angle: number,
  COLORS: Theme,
  nowMs: number,
  themeKind: 'flipbook' | 'noir'
): void {
  if (themeKind === 'noir') {
    drawNoirChargeHud(ctx, zenoX, zenoY, groundY, ZENO_Y_OFFSET, chargePower, angle, COLORS, nowMs);
  } else {
    drawFlipbookChargeHud(ctx, zenoX, zenoY, groundY, ZENO_Y_OFFSET, chargePower, angle, COLORS, nowMs);
  }
}

function drawFlipbookChargeHud(
  ctx: CanvasRenderingContext2D,
  zenoX: number,
  zenoY: number,
  groundY: number,
  ZENO_Y_OFFSET: number,
  chargePower: number,
  angle: number,
  COLORS: Theme,
  nowMs: number
): void {
  const barX = 50;
  const barY = 15;
  const barW = 80;
  const barH = 12;

  // Bar outline (hand-drawn rectangle)
  ctx.strokeStyle = COLORS.accent3;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(barX, barY, barW, barH);
  ctx.stroke();

  // Decorative curls at bar ends
  drawDecorativeCurl(ctx, barX - 3, barY + barH / 2, 5, COLORS.accent3, 1, nowMs, -1);
  drawDecorativeCurl(ctx, barX + barW + 3, barY + barH / 2, 5, COLORS.accent3, 1, nowMs, 1);

  // Fill based on power
  const fillW = chargePower * (barW - 4);
  const powerColor = chargePower > 0.8 ? COLORS.danger
    : chargePower > 0.5 ? COLORS.highlight
      : COLORS.accent1;
  ctx.fillStyle = powerColor;
  ctx.fillRect(barX + 2, barY + 2, fillW, barH - 4);

  // Angle indicator arc (faint guide)
  const arcX = zenoX;
  const arcY = zenoY;
  const arcRadius = 20;

  // Draw faint arc guide
  ctx.strokeStyle = COLORS.accent3;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(arcX, arcY, arcRadius, -MAX_ANGLE * Math.PI / 180, -MIN_ANGLE * Math.PI / 180);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Animated aim arrow with dashed segments and chevron arrowhead
  drawAimArrow(
    ctx,
    arcX,
    arcY,
    angle,
    chargePower,
    COLORS.accent1,
    nowMs,
  );

  // Optimal angle marker (small dot that blinks)
  const optRad = (OPTIMAL_ANGLE * Math.PI) / 180;
  const optBlink = Math.sin(nowMs / 200) * 0.5 + 0.5; // Smooth pulsing
  const optX = arcX + Math.cos(optRad) * (arcRadius + 5);
  const optY = arcY - Math.sin(optRad) * (arcRadius + 5);
  ctx.globalAlpha = 0.4 + optBlink * 0.4;
  drawHandCircle(ctx, optX, optY, 3, COLORS.highlight, 1.5, nowMs, true);
  ctx.globalAlpha = 1;

  // Trajectory preview arc (dashed curve showing predicted path)
  if (chargePower > 0.2) {
    const angleRad = (angle * Math.PI) / 180;
    const power = MIN_POWER + chargePower * (MAX_POWER - MIN_POWER);
    const vx = Math.cos(angleRad) * power;
    const vy = -Math.sin(angleRad) * power;

    // Generate preview points
    const previewPoints: { x: number; y: number }[] = [];
    let px = zenoX;
    let py = zenoY;
    const pvx = vx;
    let pvy = vy;

    for (let i = 0; i < 40; i++) {
      previewPoints.push({ x: px, y: py });
      px += pvx;
      pvy += BASE_GRAV;
      py += pvy;
      if (py > groundY + ZENO_Y_OFFSET || px > W) break;
    }

    // Draw styled preview arc
    ctx.globalAlpha = 0.5 + chargePower * 0.3;
    drawStyledTrajectory(ctx, previewPoints, COLORS.accent3, nowMs, 'flipbook');
    ctx.globalAlpha = 1;
  }
}

function drawNoirChargeHud(
  ctx: CanvasRenderingContext2D,
  zenoX: number,
  zenoY: number,
  groundY: number,
  ZENO_Y_OFFSET: number,
  chargePower: number,
  angle: number,
  COLORS: Theme,
  nowMs: number
): void {
  const barX = 50;
  const barY = 15;
  const barW = 70;
  const barH = 8;

  ctx.strokeStyle = COLORS.accent3;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  const fillW = chargePower * (barW - 2);
  const powerColor = chargePower > 0.8 ? COLORS.danger : COLORS.accent1;
  ctx.fillStyle = powerColor;
  ctx.fillRect(barX + 1, barY + 1, fillW, barH - 2);

  // Animated aim arrow (noir style - same as flipbook for consistency)
  const arcX = zenoX;
  const arcY = zenoY;

  drawAimArrow(
    ctx,
    arcX,
    arcY,
    angle,
    chargePower,
    COLORS.accent1,
    nowMs,
  );

  // Trajectory preview arc (noir style)
  if (chargePower > 0.2) {
    const angleRad = (angle * Math.PI) / 180;
    const power = MIN_POWER + chargePower * (MAX_POWER - MIN_POWER);
    const vx = Math.cos(angleRad) * power;
    const vy = -Math.sin(angleRad) * power;

    // Generate preview points
    const previewPoints: { x: number; y: number }[] = [];
    let px = zenoX;
    let py = zenoY;
    const pvx = vx;
    let pvy = vy;

    for (let i = 0; i < 40; i++) {
      previewPoints.push({ x: px, y: py });
      px += pvx;
      pvy += BASE_GRAV;
      py += pvy;
      if (py > groundY + ZENO_Y_OFFSET || px > W) break;
    }

    // Draw styled preview arc (noir style)
    ctx.globalAlpha = 0.6 + chargePower * 0.3;
    drawStyledTrajectory(ctx, previewPoints, COLORS.player, nowMs, 'noir');
    ctx.globalAlpha = 1;
  }
}
