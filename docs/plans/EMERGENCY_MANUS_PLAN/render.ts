      ctx,
      state.px,
      state.py,
      playerColor,
      nowMs,
      state.failureType,
      state.failureFrame,
    );
  } else if (state.charging) {
    drawZenoCoil(ctx, state.px, state.py, playerColor, nowMs, state.chargePower, 'flipbook');
  } else if (state.flying && !state.failureAnimating) {
    drawZenoBolt(ctx, state.px, state.py, playerColor, nowMs, { vx: state.vx, vy: state.vy }, 'flipbook');
  } else if (state.landingFrame > 0 && state.landingFrame < 15 && !state.fellOff) {
    drawZenoImpact(ctx, state.px, state.py, playerColor, nowMs, state.landingFrame, 'flipbook');
  } else {
    // Idle or other states
    drawStickFigure(ctx, state.px, state.py, playerColor, nowMs, playerState, state.angle, { vx: state.vx, vy: state.vy }, state.chargePower);
  }

  // Scribble energy during charging
  if (state.charging && state.chargePower > 0.1) {
    drawScribbleEnergy(
      ctx,
      state.px,
      state.py,