// Stick figure character drawings

import { WOBBLE_INTENSITY, CHARACTER_SCALE, SCALED_LINE_WEIGHTS } from '../constants';
import { getWobble } from '../wobble';
import { drawSketchyCircle } from '../primitives/circle';
import { drawSketchyLine } from '../primitives/line';

// Draw a stick figure with smile
export function drawStickFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  nowMs: number,
  state: 'idle' | 'charging' | 'flying' | 'landing' = 'idle',
  angle: number = 0,
  velocity: { vx: number; vy: number } = { vx: 0, vy: 0 },
  chargePower: number = 0,  // 0-1 charge amount for squash
) {
  // Squash & Stretch calculations
  let scaleX = 1;
  let scaleY = 1;

  if (state === 'charging') {
    // Charging SQUASH: compress vertically, expand horizontally
    const squashAmount = chargePower * 0.3; // Max 30% squash
    scaleX = 1 + squashAmount * 0.43; // ~130% width at full charge
    scaleY = 1 - squashAmount; // ~70% height at full charge
  } else if (state === 'flying') {
    // Flying STRETCH: elongate in velocity direction
    const speed = Math.sqrt(velocity.vx ** 2 + velocity.vy ** 2);
    const stretchAmount = Math.min(0.3, speed * 0.02);
    scaleX = 1 - stretchAmount * 0.3;
    scaleY = 1 + stretchAmount;
  } else if (state === 'landing') {
    // Landing SQUASH: impact compression
    scaleX = 1.3;
    scaleY = 0.7;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);
  ctx.translate(-x, -y);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = SCALED_LINE_WEIGHTS.body;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const scale = CHARACTER_SCALE.normal;
  const headRadius = 8 * scale;

  // Animation offsets based on state
  let bodyLean = 0;
  let armAngleL = 0;
  let armAngleR = 0;
  let legSpread = 8 * scale;

  if (state === 'idle') {
    // Slight idle animation
    const bounce = Math.sin(nowMs / 500) * 2;
    y += bounce;
    armAngleL = Math.sin(nowMs / 800) * 0.1;
    armAngleR = -Math.sin(nowMs / 800) * 0.1;
  } else if (state === 'charging') {
    // Charging wind-up with anticipation
    // Lean BACK first (opposite to launch direction)
    bodyLean = -8 - chargePower * 12; // Lean back more at higher charge

    // Arms pull behind body
    armAngleL = -0.6 - chargePower * 0.6;
    armAngleR = -0.4 - chargePower * 0.5;

    // One leg steps back to brace
    legSpread = 10 * scale + chargePower * 6;

    // Lower center of gravity
    y += 3 + chargePower * 8;
  } else if (state === 'flying') {
    // Check if just launched (first ~100ms of flight)
    const justLaunched = velocity.vy < -3 && Math.abs(velocity.vx) > 4;

    if (justLaunched && velocity.vy < -2) {
      // Release snap: everything whips forward
      armAngleL = -1.5; // Arms thrust forward
      armAngleR = -1.3;
      legSpread = 3 * scale; // Legs together, trailing
      bodyLean = velocity.vx * 1.5;
    } else {
      const rising = velocity.vy < 0;
      if (rising) {
        // Arms up, superman pose
        armAngleL = -1.2;
        armAngleR = -1.0;
        legSpread = 4 * scale;
      } else {
        // Falling, arms flailing
        const flail = Math.sin(nowMs / 80) * 0.5;
        armAngleL = 0.3 + flail;
        armAngleR = 0.3 - flail;
        legSpread = 10 * scale;
      }
      bodyLean = velocity.vx * 2;
    }
  } else if (state === 'landing') {
    // Impact squash with recovery sequence
    // Frame 0-3: Maximum squash
    // Frame 4-8: Recovery wobble
    // Frame 9+: Settle to proud stance

    // For now, enhanced single-frame squash
    y += 10;
    armAngleL = 1.0; // Arms out for balance
    armAngleR = 1.0;
    legSpread = 18 * scale; // Wide stance

    // Windmill effect (arms reaching out)
    const wobble = Math.sin(nowMs * 0.02) * 0.3;
    armAngleL += wobble;
    armAngleR -= wobble;
  }

  // Enhanced line width for landing emphasis (1-2 frame squash effect)
  const isLanding = state === 'landing';
  const landingEmphasis = isLanding ? 1.3 : 1.0;
  ctx.lineWidth = 4 * landingEmphasis;

  // Micro-offset for landing impact feel
  const impactOffset = isLanding ? Math.sin(nowMs * 0.5) * 0.5 : 0;
  x += impactOffset;

  // Head position
  const headX = x + bodyLean * 0.5;
  const headY = y - 35 * scale;

  // Draw head (circle) with multi-pass for hero element
  drawSketchyCircle(ctx, headX, headY, headRadius, color, 2.5 * landingEmphasis, nowMs, false);

  // Draw smile with slight wobble
  const smileWobble = getWobble(headX, headY + 2, nowMs, WOBBLE_INTENSITY.fine);
  ctx.beginPath();
  ctx.arc(headX + smileWobble.dx * 0.3, headY + 2 + smileWobble.dy * 0.3, headRadius * 0.5, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Draw eyes with wobble
  ctx.fillStyle = color;
  const eyeWobbleL = getWobble(headX - headRadius * 0.35, headY - 2, nowMs, WOBBLE_INTENSITY.fine);
  ctx.beginPath();
  ctx.arc(headX - headRadius * 0.35 + eyeWobbleL.dx * 0.3, headY - 2 + eyeWobbleL.dy * 0.3, 2, 0, Math.PI * 2);
  ctx.fill();
  const eyeWobbleR = getWobble(headX + headRadius * 0.35, headY - 2, nowMs, WOBBLE_INTENSITY.fine);
  ctx.beginPath();
  ctx.arc(headX + headRadius * 0.35 + eyeWobbleR.dx * 0.3, headY - 2 + eyeWobbleR.dy * 0.3, 2, 0, Math.PI * 2);
  ctx.fill();

  // Body - multi-pass for hero element
  const bodyTopY = headY + headRadius + 2;
  const bodyBottomY = y - 8 * scale;

  drawSketchyLine(ctx, headX, bodyTopY, x + bodyLean, bodyBottomY, color, SCALED_LINE_WEIGHTS.body, nowMs);

  // Arms - multi-pass for hero element
  const armY = bodyTopY + 8 * scale;
  const armLen = 18 * scale;

  // Left arm
  drawSketchyLine(
    ctx,
    x + bodyLean * 0.7, armY,
    x + bodyLean * 0.7 - Math.cos(armAngleL) * armLen,
    armY + Math.sin(armAngleL) * armLen,
    color, SCALED_LINE_WEIGHTS.limbs, nowMs
  );

  // Right arm
  drawSketchyLine(
    ctx,
    x + bodyLean * 0.7, armY,
    x + bodyLean * 0.7 + Math.cos(armAngleR) * armLen,
    armY + Math.sin(armAngleR) * armLen,
    color, SCALED_LINE_WEIGHTS.limbs, nowMs
  );

  // Legs - multi-pass for hero element
  // Left leg
  drawSketchyLine(
    ctx,
    x + bodyLean, bodyBottomY,
    x + bodyLean - legSpread, y,
    color, SCALED_LINE_WEIGHTS.limbs, nowMs
  );

  // Right leg
  drawSketchyLine(
    ctx,
    x + bodyLean, bodyBottomY,
    x + bodyLean + legSpread, y,
    color, SCALED_LINE_WEIGHTS.limbs, nowMs
  );

  ctx.restore();
}

// Draw a failing/falling stick figure
export function drawFailingStickFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  _nowMs: number,
  failureType: 'tumble' | 'dive',
  frame: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  const spin = (frame * 0.3) % (Math.PI * 2);

  ctx.save();
  ctx.translate(x, y);

  if (failureType === 'tumble') {
    // Spinning tumble
    ctx.rotate(spin);

    // Head
    ctx.beginPath();
    ctx.arc(0, -12, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Body
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(0, 5);
    ctx.stroke();

    // Arms (flailing)
    const armWave = Math.sin(frame * 0.5) * 0.5;
    ctx.beginPath();
    ctx.moveTo(-8, -2 + armWave * 5);
    ctx.lineTo(0, -3);
    ctx.lineTo(8, -2 - armWave * 5);
    ctx.stroke();

    // Legs (kicking)
    ctx.beginPath();
    ctx.moveTo(-6, 12 + armWave * 3);
    ctx.lineTo(0, 5);
    ctx.lineTo(6, 12 - armWave * 3);
    ctx.stroke();

  } else if (failureType === 'dive') {
    // Superman dive pose
    ctx.rotate(-Math.PI / 6);

    // Head looking down
    ctx.beginPath();
    ctx.arc(0, -10, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Panic eyes
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(-2, -11, 1.5, 0, Math.PI * 2);
    ctx.arc(2, -11, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Open mouth (O shape)
    ctx.beginPath();
    ctx.arc(0, -8, 2, 0, Math.PI * 2);
    ctx.stroke();

    // Body stretched
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(0, 10);
    ctx.stroke();

    // Arms reaching forward
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(0, -3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, -8);
    ctx.lineTo(0, -3);
    ctx.stroke();

    // Legs trailing
    ctx.beginPath();
    ctx.moveTo(-5, 18);
    ctx.lineTo(0, 10);
    ctx.lineTo(5, 18);
    ctx.stroke();
  }

  ctx.restore();

  // Sweat drops / panic lines
  if (frame % 4 < 2) {
    ctx.beginPath();
    ctx.moveTo(x + 10, y - 15);
    ctx.lineTo(x + 14, y - 20);
    ctx.moveTo(x - 10, y - 15);
    ctx.lineTo(x - 14, y - 20);
    ctx.stroke();
  }
}

// Draw a ghost figure (for trail effects)
export function drawGhostFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  opacity: number,
  nowMs: number,
  angle: number,
  themeKind: 'flipbook' | 'noir' = 'flipbook',
) {
  ctx.save();
  ctx.globalAlpha = opacity;

  // Thinner strokes for ghosts
  ctx.strokeStyle = color;
  ctx.lineWidth = themeKind === 'flipbook' ? SCALED_LINE_WEIGHTS.limbs : SCALED_LINE_WEIGHTS.details;
  ctx.lineCap = 'round';

  const scale = CHARACTER_SCALE.ghost;
  const headRadius = 6 * scale;

  // Simple tumbling pose based on angle
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Head
  ctx.beginPath();
  ctx.arc(0, -10, headRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(0, 5);
  ctx.stroke();

  // Arms (spread out)
  ctx.beginPath();
  ctx.moveTo(-8, -2);
  ctx.lineTo(0, -3);
  ctx.lineTo(8, -2);
  ctx.stroke();

  // Legs
  ctx.beginPath();
  ctx.moveTo(-5, 12);
  ctx.lineTo(0, 5);
  ctx.lineTo(5, 12);
  ctx.stroke();

  ctx.restore();
}
