import {
  BASE_GRAV,
  CHARGE_MS,
  CLIFF_EDGE,
  H,
  MAX_ANGLE,
  MAX_POWER,
  MIN_ANGLE,
  MIN_POWER,
} from '@/game/constants';

// Time scale for gameplay speed (0.550 = 55% speed, 1.0 = normal)
const TIME_SCALE = 0.550;

// Cinematic zone threshold - triggers 4x zoom and 4x slowdown
const CINEMATIC_THRESHOLD = 318.5;
import type { Theme } from '@/game/themes';
import {
  loadDailyStats,
  saveDailyStats,
  saveJson,
  saveNumber,
  todayLocalISODate,
  updateTodayHistory,
} from '@/game/storage';
import { addToPersonalLeaderboard } from '@/game/leaderboard';
import { updateDailyChallenge, type DailyChallenge } from '@/game/dailyChallenge';
import { updateGoals, type SessionGoal } from '@/game/goals';
import type { DailyStats } from '@/game/storage';
import type { GameState } from './types';
import { nextWind, spawnCelebration, spawnParticles } from './state';
import { ACHIEVEMENTS } from './achievements';
import { updateAnimator } from './animationController';
import { applyAirBrake, applySlideControl } from './precision';

export type GameAudio = {
  startCharge: (power01: number) => void;
  updateCharge: (power01: number) => void;
  stopCharge: () => void;
  whoosh: () => void;
  impact: (intensity01: number) => void;
  edgeWarning: (proximity01: number) => void;
  stopEdgeWarning: () => void;
  tone: (freq: number, duration: number, type?: OscillatorType, volume?: number) => void;
  zenoJingle: () => void;
  heartbeat: (intensity: number) => void;
  recordBreak: () => void;
  failureSound: (type: 'tumble' | 'dive' | 'splat') => void;
  wilhelmScream: () => void;
  // New file-based sounds
  startFly?: () => void;
  stopFly?: () => void;
  slide?: () => void;
  stopSlide?: () => void;
  win?: () => void;
  // Precision control sounds
  airBrakeTap?: () => void;
  airBrakeHold?: () => void;
  slideExtend?: () => void;
  slideBrake?: () => void;
  staminaLow?: () => void;
  actionDenied?: () => void;
};

export type GameUI = {
  setFellOff: (v: boolean) => void;
  setLastMultiplier: (v: number) => void;
  setPerfectLanding: (v: boolean) => void;
  setTotalScore: (v: number) => void;
  setBestScore: (v: number) => void;
  setZenoTarget: (v: number) => void;
  setZenoLevel: (v: number) => void;
  setStats: (v: GameState['stats']) => void;
  setAchievements: (v: Set<string>) => void;
  setNewAchievement: (v: string | null) => void;
  setLastDist: (v: number | null) => void;
  setSessionGoals: (updater: (prev: SessionGoal[]) => SessionGoal[]) => void;
  setDailyStats: (v: DailyStats) => void;
  setDailyChallenge: (v: DailyChallenge) => void;
  setHotStreak: (current: number, best: number) => void;
  onNewPersonalBest?: (totalScore: number, bestThrow: number) => void;
  onFall?: (totalFalls: number) => void;
};

export type GameServices = {
  theme: Theme;
  nowMs: number;
  pressed: boolean;
  audio: GameAudio;
  ui: GameUI;
  triggerHaptic: (pattern?: number | number[]) => void;
  scheduleReset: (ms: number) => void;
  getDailyStats: () => DailyStats;
};

function checkAchievements(state: GameState, ui: GameUI, audio: GameAudio, clearAfterMs: number) {
  for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
    if (!state.achievements.has(id) && achievement.check(state.stats, state)) {
      state.achievements.add(id);
      state.newAchievement = achievement.name;
      ui.setAchievements(new Set(state.achievements));
      ui.setNewAchievement(achievement.name);
      saveJson('achievements', [...state.achievements]);

      audio.tone(523, 0.1, 'sine', 0.06);
      setTimeout(() => audio.tone(659, 0.1, 'sine', 0.06), 80);
      setTimeout(() => audio.tone(784, 0.15, 'sine', 0.08), 160);

      setTimeout(() => {
        ui.setNewAchievement(null);
      }, clearAfterMs);

      break;
    }
  }
}

export function updateFrame(state: GameState, svc: GameServices) {
  const { pressed, nowMs, theme, audio, ui } = svc;

  if (state.paused) return;

  // Decay touch feedback
  if (state.touchFeedback > 0) {
    state.touchFeedback *= 0.9;
    if (state.touchFeedback < 0.01) state.touchFeedback = 0;
  }

  // Precision control input edge detection (for tap vs hold)
  if (state.flying || state.sliding) {
    const wasPressed = state.precisionInput.lastPressedState;
    state.precisionInput.pressedThisFrame = pressed && !wasPressed;
    state.precisionInput.releasedThisFrame = !pressed && wasPressed;

    if (pressed) {
      state.precisionInput.holdDuration++;
    } else {
      state.precisionInput.holdDuration = 0;
    }

    state.precisionInput.lastPressedState = pressed;
  }

  // FIX 1: Track if precision control was used this frame to prevent double-dipping
  let precisionAppliedThisFrame = false;

  // Charging start - blocked if already landed (waiting for reset)
  if (!state.flying && !state.sliding && !state.landed && pressed && !state.charging) {
    state.charging = true;
    state.chargeStart = nowMs;
    ui.setFellOff(false);
    audio.startCharge(0);
  }

  // Charging update (power only) - bounces 0→100→0→100 continuously
  if (state.charging && pressed) {
    const elapsed = nowMs - state.chargeStart;
    const cycleTime = CHARGE_MS * 2; // Full cycle is up + down
    const cyclePosition = (elapsed % cycleTime) / CHARGE_MS;
    // cyclePosition: 0→1 (going up), 1→2 (going down)
    const dt = cyclePosition <= 1 ? cyclePosition : 2 - cyclePosition;
    state.chargePower = dt;
    audio.updateCharge(dt);

    // Emit charging swirls every 4 frames
    if (Math.floor(nowMs / 64) % 4 === 0 && state.particleSystem) {
      state.particleSystem.emitChargingSwirls(state.px, state.py, dt, theme.accent1);
    }
  }

  // Launch
  if (state.charging && !pressed) {
    state.charging = false;
    state.flying = true;
    const power = MIN_POWER + (MAX_POWER - MIN_POWER) * state.chargePower;
    const angleRad = (state.angle * Math.PI) / 180;
    state.vx = power * Math.cos(angleRad);
    state.vy = -power * Math.sin(angleRad);
    state.initialSpeed = power;
    state.trail = [];
    state.ghostTrail = []; // Clear ghost trail for new throw
    state.chargePower = 0;
    state.nudgeUsed = false;
    state.launchFrame = 0; // Reset launch frame for burst effect

    // Emit launch sparks
    if (state.particleSystem) {
      state.particleSystem.emitLaunchSparks(state.px, state.py, theme.accent3);
    }

    audio.stopCharge();
    audio.whoosh();
    audio.startFly?.(); // Start fly sound while in air
  }

  // Nudge feature disabled - one input per throw only
  // if (state.flying && pressed && !state.nudgeUsed && state.initialSpeed > 0) {
  //   const nudgePower = state.initialSpeed * 0.1;
  //   state.vx -= Math.sign(state.wind) * nudgePower;
  //   state.nudgeUsed = true;
  //   audio.tone(660, 0.03);
  // }

  // Stars
  for (const star of state.stars) {
    star.x -= star.speed;
    if (star.x < 0) {
      star.x = 160;
      star.y = Math.random() * (80 * 0.6);
    }
    star.brightness = 0.3 + Math.abs(Math.sin(nowMs / 500 + star.x)) * 0.7;
  }

  // Grid
  state.gridOffset = (state.gridOffset + 0.3) % 10;

  // Flying physics (scaled by TIME_SCALE and slowMo for dramatic effects)
  // slowMo of 0.75 = 4x slower, 0.97 = very slow
  const effectiveTimeScale = TIME_SCALE * (1 - state.slowMo);

  if (state.flying) {
    state.launchFrame++; // Increment for launch burst effect

    // Precision control: Air brake (FIX 1: check flag)
    if (!state.landed && !precisionAppliedThisFrame) {
      const deltaTime = 1/60;
      if (state.precisionInput.pressedThisFrame) {
        // Tap: single reduction
        const result = applyAirBrake(state, 'tap');
        if (result.applied) {
          precisionAppliedThisFrame = true;
          audio.airBrakeTap?.();
        } else if (result.denied) {
          audio.actionDenied?.();
          state.staminaDeniedShake = 8;
        }
      } else if (pressed && state.precisionInput.holdDuration > 0) {
        // Hold: continuous reduction
        const result = applyAirBrake(state, 'hold', deltaTime);
        if (result.applied) {
          precisionAppliedThisFrame = true;
          // Play hold sound every 6 frames to avoid spam
          if (state.precisionInput.holdDuration % 6 === 0) {
            audio.airBrakeHold?.();
          }
        } else if (result.denied) {
          audio.actionDenied?.();
          state.staminaDeniedShake = 8;
        }
      }
    }

    // Low stamina warning (play beep periodically when below threshold)
    if (state.stamina <= 25 && state.stamina > 0) {
      if (Math.floor(svc.nowMs / 500) !== Math.floor((svc.nowMs - 16) / 500)) {
        audio.staminaLow?.();
      }
    }

    state.vy += BASE_GRAV * effectiveTimeScale;
    state.vx += state.wind * 0.3 * effectiveTimeScale;

    state.px += state.vx * effectiveTimeScale;
    state.py += state.vy * effectiveTimeScale;

    const pastTarget = state.px >= state.zenoTarget;
    state.trail.push({ x: state.px, y: state.py, age: 0, pastTarget });

    // Record ghost frame for trail (every 50ms during flight)
    const lastGhostTimestamp = state.ghostTrail[state.ghostTrail.length - 1]?.timestamp ?? 0;
    if (nowMs - lastGhostTimestamp > 50) {
      state.ghostTrail.push({
        x: state.px,
        y: state.py,
        vx: state.vx,
        vy: state.vy,
        angle: Math.atan2(-state.vy, state.vx),
        timestamp: nowMs,
      });
      // Keep max 20 ghost frames
      if (state.ghostTrail.length > 20) {
        state.ghostTrail.shift();
      }
    }

    if (state.runTrail.length === 0 || state.runTrail.length % 2 === 0) {
      state.runTrail.push({ x: state.px, y: state.py });
    }

    if (state.py >= H - 20) {
      state.flying = false;
      state.sliding = true;
      state.py = H - 20;

      const impactVelocity = Math.abs(state.vy);
      state.screenShake = state.reduceFx ? 0 : Math.min(8, 2 + impactVelocity * 1.5);
      state.landingFrame = 8;

      const particleCount = Math.floor(4 + impactVelocity * 2);
      spawnParticles(state, state.px, state.py, particleCount, 1.5 + impactVelocity * 0.3, theme.accent4);

      // New particle system landing effects
      if (state.particleSystem) {
        state.particleSystem.emitLandingDust(state.px, state.py, theme.accent3);
        state.particleSystem.emitImpactDebris(state.px, state.py, theme.accent3);
        state.particleSystem.emitGroundCracks(state.px, state.py, theme.accent3);
      }

      state.vx *= 0.55;
      state.vy = 0;

      audio.impact(Math.min(1, impactVelocity / 4));
      audio.stopFly?.(); // Stop fly sound when landing
      audio.slide?.(); // Play slide sound when landing
    }
  }

  // Age trail
  for (const t of state.trail) t.age++;
  state.trail = state.trail.filter((t) => t.age < 40);

  // Particles (old system)
  state.particles = state.particles.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life--;
    return p.life > 0;
  });

  // New particle system update
  if (state.particleSystem) {
    state.particleSystem.update(1);
  }

  // Failure animation update
  if (state.failureAnimating) {
    state.failureFrame++;

    // Animate falling off the edge
    if (state.failureType === 'tumble') {
      state.px += 1;
      state.py += state.failureFrame * 0.5;
      // Spawn occasional particles
      if (state.failureFrame % 5 === 0) {
        spawnParticles(state, state.px, state.py, 2, 1, theme.danger);
      }
    } else if (state.failureType === 'dive') {
      state.px += 2;
      state.py += state.failureFrame * 0.8;
    }

    // End animation after falling off screen
    if (state.py > H + 50) {
      state.failureAnimating = false;
    }
  }

  if (state.screenShake > 0) state.screenShake *= 0.8;
  if (state.landingFrame > 0) state.landingFrame--;
  if (state.staminaDeniedShake > 0) state.staminaDeniedShake--;

  if (state.slowMo > 0) state.slowMo *= 0.95;
  if (state.screenFlash > 0) state.screenFlash *= 0.85;
  if (state.zoom > 1) state.zoom = 1 + (state.zoom - 1) * 0.92;

  // Record zone detection - Peggle-style epic moment
  if ((state.flying || state.sliding) && !state.epicMomentTriggered) {
    const approachingBest = state.px > state.best - 30 && state.px < state.best + 5;
    const willBeatRecord = state.px > state.best - 10 && state.vx > 0;

    if (approachingBest && state.best > 50) {
      state.recordZoneActive = true;
      // Intensity ramps up as we get closer
      const distToBest = Math.abs(state.px - state.best);
      state.recordZoneIntensity = Math.max(0, 1 - distToBest / 30);

      if (willBeatRecord && state.px > state.best - 3) {
        state.recordZonePeak = true;
        state.epicMomentTriggered = true;
      }
    } else {
      state.recordZoneActive = false;
      state.recordZoneIntensity = 0;
    }
  }

  if ((state.flying || state.sliding) && state.px > 90) {
    const edgeProximity = (state.px - 90) / (CLIFF_EDGE - 90);

    // Base slowMo from edge proximity
    let targetSlowMo = state.reduceFx ? 0 : Math.min(0.7, edgeProximity * 0.8);
    let targetZoom = state.reduceFx ? 1 : (1 + edgeProximity * 0.3);

    // Record Zone Bullet Time - Two Levels
    if (state.recordZoneActive && !state.reduceFx) {
      // Level 1: Instant bullet time when entering record zone
      // Base slowMo jumps to 0.7 immediately
      targetSlowMo = Math.max(0.7, targetSlowMo);
      targetZoom = Math.max(1.5, targetZoom);

      // Level 2: Peggle super heat when really going for record (intensity > 0.6)
      if (state.recordZoneIntensity > 0.6) {
        targetSlowMo = 0.85 + state.recordZoneIntensity * 0.1; // 0.91-0.95
        targetZoom = 1.8 + state.recordZoneIntensity * 0.5;    // 2.1-2.3
      }
    }

    // Peak moment - maximum freeze
    if (state.recordZonePeak && !state.reduceFx) {
      targetSlowMo = 0.98;
      targetZoom = 2.5;
    }

    // CINEMATIC ZONE - 2x zoom and 2x slowdown when passing threshold
    // This overrides all other effects for dramatic impact
    if (state.px > CINEMATIC_THRESHOLD && !state.reduceFx) {
      targetZoom = 2;
      targetSlowMo = 0.5; // 2x slower (effectiveTimeScale = 0.75 * 0.5 = 0.375)
      // Focus on the finish area instead of Zeno
      state.zoomTargetX = CLIFF_EDGE - 30; // Slightly before cliff edge
      state.zoomTargetY = H - 60; // Ground level area
    }

    // Heartbeat audio during record zone
    if (state.recordZoneActive && !state.reduceFx) {
      // Play heartbeat every ~400ms based on frame count (faster when intense)
      const heartbeatInterval = state.recordZoneIntensity > 0.6 ? 300 : 400;
      if (Math.floor(nowMs / heartbeatInterval) !== Math.floor((nowMs - 16) / heartbeatInterval)) {
        audio.heartbeat(state.recordZoneIntensity);
      }
    }

    // Record break celebration
    if (state.recordZonePeak) {
      audio.recordBreak();
      state.recordZonePeak = false; // Only trigger once
    }

    state.slowMo = targetSlowMo;
    state.zoom = targetZoom;
    state.zoomTargetX = state.px;
    state.zoomTargetY = state.py;
    audio.edgeWarning(edgeProximity);
  } else {
    audio.stopEdgeWarning();
  }

  if ((state.flying || state.sliding) && state.px > 50) {
    const riskFactor = (state.px - 50) / (CLIFF_EDGE - 50);
    state.currentMultiplier = 1 + riskFactor * riskFactor * 4;
  } else {
    state.currentMultiplier = 1;
  }

  // Sliding (scaled by effectiveTimeScale for slowmo support)
  if (state.sliding) {
    // Precision control: Slide extend/brake (FIX 1: check flag)
    let frictionMultiplier = 1.0;
    if (!state.landed && !precisionAppliedThisFrame) {
      const deltaTime = 1/60;
      if (state.precisionInput.pressedThisFrame) {
        // Tap: extend slide
        const result = applySlideControl(state, 'tap');
        if (result.applied) {
          precisionAppliedThisFrame = true;
          audio.slideExtend?.();
        } else if (result.denied) {
          audio.actionDenied?.();
          state.staminaDeniedShake = 8;
        }
      } else if (pressed && state.precisionInput.holdDuration > 0) {
        // Hold: brake
        const result = applySlideControl(state, 'hold', deltaTime);
        if (result.applied) {
          precisionAppliedThisFrame = true;
          if (result.frictionMultiplier) {
            frictionMultiplier = result.frictionMultiplier;
          }
          // Play brake sound every 6 frames to avoid spam
          if (state.precisionInput.holdDuration % 6 === 0) {
            audio.slideBrake?.();
          }
        } else if (result.denied) {
          audio.actionDenied?.();
          state.staminaDeniedShake = 8;
        }
      }
    }

    // Low stamina warning (play beep periodically when below threshold)
    if (state.stamina <= 25 && state.stamina > 0) {
      if (Math.floor(svc.nowMs / 500) !== Math.floor((svc.nowMs - 16) / 500)) {
        audio.staminaLow?.();
      }
    }

    // FIX 2: Apply friction with TIME_SCALE and optional brake multiplier
    const baseFriction = 0.92;
    const friction = Math.pow(baseFriction, effectiveTimeScale * frictionMultiplier);
    state.vx *= friction;
    state.px += state.vx * effectiveTimeScale;

    if (Math.abs(state.vx) > 0.5 && Math.random() > 0.5) {
      spawnParticles(state, state.px, state.py, 1, 0.5, theme.accent1);
    }

    const pastTarget = state.px >= state.zenoTarget;
    state.trail.push({ x: state.px, y: state.py, age: 0, pastTarget });

    if (Math.abs(state.vx) < 0.1) {
      state.sliding = false;
      state.vx = 0;

      const landedAt = Math.round(state.px * 100000000) / 100000000; // 8 decimal precision for Zeno system

      if (landedAt >= CLIFF_EDGE) {
        state.fellOff = true;
        state.dist = 0;
        state.lastMultiplier = 0;
        ui.setFellOff(true);
        ui.setLastMultiplier(0);
        ui.setPerfectLanding(false);

        // Stop slide and fly sounds when falling off
        audio.stopSlide?.();
        audio.stopFly?.();

        // Increment and sync total falls
        state.totalFalls++;
        saveNumber('total_falls', state.totalFalls);
        ui.onFall?.(state.totalFalls);

        // Trigger comedic failure
        state.failureAnimating = true;
        state.failureFrame = 0;
        state.failureType = Math.random() > 0.5 ? 'tumble' : 'dive';

        // 10% chance of Wilhelm scream easter egg
        if (Math.random() < 0.1) {
          audio.wilhelmScream();
        } else {
          audio.failureSound(state.failureType);
        }
      } else {
        state.dist = Math.max(0, landedAt);
        ui.setFellOff(false);

        const finalMultiplier = state.currentMultiplier;
        state.lastMultiplier = finalMultiplier;
        ui.setLastMultiplier(finalMultiplier);

        const distFromTarget = Math.abs(landedAt - state.zenoTarget);
        const isPerfect = distFromTarget < 0.5;
        state.perfectLanding = isPerfect;
        ui.setPerfectLanding(isPerfect);

        const basePoints = state.dist;
        const multipliedPoints = basePoints * finalMultiplier;
        const perfectBonus = isPerfect ? 10 : 0;
        const scoreGained = multipliedPoints + perfectBonus;

        state.totalScore += scoreGained;
        saveNumber('total_score', state.totalScore);
        ui.setTotalScore(state.totalScore);

        const today = todayLocalISODate();
        const cachedDaily = svc.getDailyStats();
        const daily = cachedDaily.date === today ? cachedDaily : loadDailyStats();
        const nextDaily: DailyStats = {
          date: today,
          bestDistance: Math.max(daily.bestDistance, state.dist),
          bestScore: Math.max(daily.bestScore, state.totalScore),
        };
        saveDailyStats(nextDaily);
        ui.setDailyStats(nextDaily);

        if (state.dist >= state.zenoTarget) {
          state.zenoLevel++;
          state.best = state.dist;
          state.zenoTarget = (state.best + CLIFF_EDGE) / 2;

          saveNumber('best', state.best);
          saveNumber('zeno_target', state.zenoTarget);
          saveNumber('zeno_level', state.zenoLevel);

          ui.setBestScore(state.best);
          ui.setZenoTarget(state.zenoTarget);
          ui.setZenoLevel(state.zenoLevel);

          state.screenFlash = state.reduceFx ? 0 : 1;
          state.celebrationBurst = true;
          spawnCelebration(state, state.px, state.py, [theme.accent2, theme.accent1, theme.highlight, theme.accent4, theme.accent3]);

          audio.zenoJingle();
          audio.stopEdgeWarning();

          if (state.runTrail.length > 0) {
            state.bestTrail = state.runTrail.slice(0, 240);
            saveJson('best_trail', state.bestTrail);
          }

          ui.setSessionGoals((prev) => updateGoals(prev, { beat_target_once: 1 }));

          // Sync new personal best to Firebase
          ui.onNewPersonalBest?.(state.totalScore, state.best);
        } else if (state.dist > state.best) {
          state.best = state.dist;
          saveNumber('best', state.best);
          ui.setBestScore(state.best);
          audio.tone(660, 0.08, 'sine', 0.08);

          if (state.runTrail.length > 0) {
            state.bestTrail = state.runTrail.slice(0, 240);
            saveJson('best_trail', state.bestTrail);
          }

          // Sync new personal best to Firebase
          ui.onNewPersonalBest?.(state.totalScore, state.best);
        }

        audio.stopEdgeWarning();

        if (isPerfect) {
          setTimeout(() => audio.tone(1320, 0.05, 'sine', 0.06), 50);
          setTimeout(() => audio.tone(1760, 0.04, 'sine', 0.05), 100);
          ui.setSessionGoals((prev) => updateGoals(prev, { two_perfects: 1 }));
        }

        state.stats.successfulLandings++;
        state.stats.totalDistance += state.dist;
        if (isPerfect) state.stats.perfectLandings++;
        if (finalMultiplier > state.stats.maxMultiplier) state.stats.maxMultiplier = finalMultiplier;

        // Play win sound on successful landing
        audio.win?.();
        audio.stopSlide?.();

        ui.setSessionGoals((prev) => updateGoals(prev, { land_5_times: 1 }));
        if (finalMultiplier >= 3) ui.setSessionGoals((prev) => updateGoals(prev, { reach_multiplier_3: 1 }));
      }

      state.stats.totalThrows++;
      saveJson('stats', state.stats);
      ui.setStats({ ...state.stats });

      // Update history tracking for stats page
      updateTodayHistory(state.best, state.stats.totalThrows, state.totalScore);

      // Add to personal leaderboard (only meaningful distances)
      if (state.dist > 50) {
        addToPersonalLeaderboard(state.dist);
      }

      // Update daily challenge
      const updatedChallenge = updateDailyChallenge(state.dist, state.lastMultiplier, state.fellOff);
      ui.setDailyChallenge(updatedChallenge);

      // Hot streak tracking (consecutive 419+ throws)
      if (!state.fellOff && state.dist >= 419) {
        state.hotStreak++;
        if (state.hotStreak > state.bestHotStreak) {
          state.bestHotStreak = state.hotStreak;
          saveNumber('best_hot_streak', state.bestHotStreak);
        }
      } else {
        state.hotStreak = 0;
      }
      ui.setHotStreak(state.hotStreak, state.bestHotStreak);

      // Session goals
      // score_250 increments handled by caller by passing score deltas; keep minimal here

      checkAchievements(state, ui, audio, 3000);

      ui.setLastDist(state.fellOff ? null : state.dist);

      state.tryCount++;
      if (state.tryCount % 5 === 0) nextWind(state);

      // Mark as landed to prevent new inputs, then quick reset
      state.landed = true;
      svc.scheduleReset(400);
    }

    if (state.px >= CLIFF_EDGE && state.sliding) {
      state.sliding = false;
      state.fellOff = true;
      state.dist = 0;
      ui.setFellOff(true);

      // Increment and sync total falls
      state.totalFalls++;
      saveNumber('total_falls', state.totalFalls);
      ui.onFall?.(state.totalFalls);

      // Comedic failure
      state.failureAnimating = true;
      state.failureFrame = 0;
      state.failureType = state.vx > 2 ? 'dive' : 'tumble';

      // 10% chance of Wilhelm scream easter egg
      if (Math.random() < 0.1) {
        audio.wilhelmScream();
      } else {
        audio.failureSound(state.failureType);
      }

      ui.setLastDist(null);
      state.tryCount++;
      if (state.tryCount % 5 === 0) nextWind(state);

      // Mark as landed to prevent new inputs
      state.landed = true;
      svc.scheduleReset(1200); // Slightly longer for failure animation
    }
  }

  // Update sprite animation (deltaTime ~16.67ms at 60fps)
  updateAnimator(state, 1 / 60);
}
