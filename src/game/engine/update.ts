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
import { updateGoals, type SessionGoal } from '@/game/goals';
import type { DailyStats } from '@/game/storage';
import type { GameState } from './types';
import { nextWind, spawnCelebration, spawnParticles } from './state';
import { ACHIEVEMENTS } from './achievements';

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

  // Charging start
  if (!state.flying && !state.sliding && pressed && !state.charging) {
    state.charging = true;
    state.chargeStart = nowMs;
    ui.setFellOff(false);
    audio.startCharge(0);
  }

  // Charging update (power only)
  if (state.charging && pressed) {
    const dt = Math.min(nowMs - state.chargeStart, CHARGE_MS) / CHARGE_MS;
    state.chargePower = dt;
    audio.updateCharge(dt);
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
    state.chargePower = 0;
    state.nudgeUsed = false;

    audio.stopCharge();
    audio.whoosh();
  }

  // Nudge
  if (state.flying && pressed && !state.nudgeUsed && state.initialSpeed > 0) {
    const nudgePower = state.initialSpeed * 0.1;
    state.vx -= Math.sign(state.wind) * nudgePower;
    state.nudgeUsed = true;
    audio.tone(660, 0.03);
  }

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

  // Flying physics
  if (state.flying) {
    state.vy += BASE_GRAV;
    state.vx += state.wind * 0.3;

    state.px += state.vx;
    state.py += state.vy;

    const pastTarget = state.px >= state.zenoTarget;
    state.trail.push({ x: state.px, y: state.py, age: 0, pastTarget });

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

      state.vx *= 0.55;
      state.vy = 0;

      audio.impact(Math.min(1, impactVelocity / 4));
    }
  }

  // Age trail
  for (const t of state.trail) t.age++;
  state.trail = state.trail.filter((t) => t.age < 40);

  // Particles
  state.particles = state.particles.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life--;
    return p.life > 0;
  });

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

  // Sliding
  if (state.sliding) {
    const friction = 0.92;
    state.vx *= friction;
    state.px += state.vx;

    if (Math.abs(state.vx) > 0.5 && Math.random() > 0.5) {
      spawnParticles(state, state.px, state.py, 1, 0.5, theme.accent1);
    }

    const pastTarget = state.px >= state.zenoTarget;
    state.trail.push({ x: state.px, y: state.py, age: 0, pastTarget });

    if (Math.abs(state.vx) < 0.1) {
      state.sliding = false;
      state.vx = 0;

      const landedAt = Math.round(state.px * 10000) / 10000;

      if (landedAt >= CLIFF_EDGE) {
        state.fellOff = true;
        state.dist = 0;
        state.lastMultiplier = 0;
        ui.setFellOff(true);
        ui.setLastMultiplier(0);
        ui.setPerfectLanding(false);

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
        } else if (state.dist > state.best) {
          state.best = state.dist;
          saveNumber('best', state.best);
          ui.setBestScore(state.best);
          audio.tone(660, 0.08, 'sine', 0.08);

          if (state.runTrail.length > 0) {
            state.bestTrail = state.runTrail.slice(0, 240);
            saveJson('best_trail', state.bestTrail);
          }
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

      // Session goals
      // score_250 increments handled by caller by passing score deltas; keep minimal here

      checkAchievements(state, ui, audio, 3000);

      ui.setLastDist(state.fellOff ? null : state.dist);

      state.tryCount++;
      if (state.tryCount % 5 === 0) nextWind(state);

      svc.scheduleReset(1200);
    }

    if (state.px >= CLIFF_EDGE && state.sliding) {
      state.sliding = false;
      state.fellOff = true;
      state.dist = 0;
      ui.setFellOff(true);

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
      svc.scheduleReset(2000); // Longer delay for animation
    }
  }
}
