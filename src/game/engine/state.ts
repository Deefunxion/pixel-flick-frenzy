import {
  CLIFF_EDGE,
  H,
  LAUNCH_PAD_X,
  MIN_ANGLE,
  OPTIMAL_ANGLE,
  W,
} from '@/game/constants';
import {
  dailySeedFromDate,
  loadJson,
  loadNumber,
  loadStringSet,
  todayLocalISODate,
} from '@/game/storage';
import type { GameState, Star, TutorialState } from './types';
import { ParticleSystem } from './particles';

function loadTutorialProgress(): Pick<TutorialState, 'hasSeenCharge' | 'hasSeenAir' | 'hasSeenSlide'> {
  if (typeof window === 'undefined') {
    return { hasSeenCharge: false, hasSeenAir: false, hasSeenSlide: false };
  }
  return {
    hasSeenCharge: localStorage.getItem('tutorial_charge_seen') === 'true',
    hasSeenAir: localStorage.getItem('tutorial_air_seen') === 'true',
    hasSeenSlide: localStorage.getItem('tutorial_slide_seen') === 'true',
  };
}

export function createInitialState(params: { reduceFx: boolean }): GameState {
  const best = loadNumber('best', 0, 'omf_best');
  const savedZenoTarget = loadNumber('zeno_target', 0, 'omf_zeno_target');
  const savedZenoLevel = loadNumber('zeno_level', 0, 'omf_zeno_level');
  const zenoTarget = savedZenoTarget || (best + CLIFF_EDGE) / 2;

  const today = todayLocalISODate();
  const seed = dailySeedFromDate(today);

  const stars: Star[] = [];
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * (H * 0.6),
      speed: 0.05 + Math.random() * 0.15,
      brightness: 0.3 + Math.random() * 0.7,
      size: Math.random() > 0.8 ? 2 : 1,
    });
  }

  return {
    px: LAUNCH_PAD_X,
    py: H - 20,
    vx: 0,
    vy: 0,
    flying: false,
    sliding: false,
    charging: false,
    landed: false,
    chargeStart: 0,
    chargePower: 0,
    angle: OPTIMAL_ANGLE,
    dist: 0,
    best,
    zenoTarget,
    zenoLevel: savedZenoLevel,
    trail: [],
    wind: (Math.sin(seed) * 0.08) - 0.02,
    seed,
    tryCount: 0,
    fellOff: false,
    nudgeUsed: false,
    initialSpeed: 0,
    particles: [],
    screenShake: 0,
    landingFrame: 0,
    stars,
    gridOffset: 0,
    slowMo: 0,
    screenFlash: 0,
    zoom: 1,
    zoomTargetX: W / 2,
    zoomTargetY: H / 2,
    celebrationBurst: false,
    currentMultiplier: 1,
    lastMultiplier: 1,
    perfectLanding: false,
    totalScore: loadNumber('total_score', 0, 'omf_total_score'),
    totalFalls: loadNumber('total_falls', 0, 'omf_total_falls'),
    stats: loadJson('stats', { totalThrows: 0, successfulLandings: 0, totalDistance: 0, perfectLandings: 0, maxMultiplier: 1 }, 'omf_stats'),
    achievements: loadStringSet('achievements', 'omf_achievements'),
    newAchievement: null,
    touchActive: false,
    touchFeedback: 0,
    paused: false,
    bestTrail: loadJson('best_trail', [], 'omf_best_trail'),
    runTrail: [],
    ghostTrail: [],
    reduceFx: params.reduceFx,
    recordZoneActive: false,
    recordZoneIntensity: 0,
    recordZonePeak: false,
    epicMomentTriggered: false,
    // Page flip transition
    pageFlip: {
      active: false,
      startMs: 0,
      durationMs: 450,
      snapshotReady: false,
      direction: 'left',
    },
    failureAnimating: false,
    failureFrame: 0,
    failureType: null,
    hotStreak: 0,
    bestHotStreak: loadNumber('best_hot_streak', 0, 'omf_best_hot_streak'),
    launchFrame: 0,
    particleSystem: new ParticleSystem(),
    zenoAnimator: null,
    stamina: 100,
    precisionInput: {
      pressedThisFrame: false,
      releasedThisFrame: false,
      holdDuration: 0,
      lastPressedState: false,
    },
    staminaDeniedShake: 0,
    gravityMultiplier: 1,
    floatDuration: 0,
    tutorialState: {
      phase: 'none',
      active: false,
      timeRemaining: 0,
      ...loadTutorialProgress(),
    },
    // Precision bar
    precisionBarActive: false,
    lastValidPx: 0,
    precisionTimeScale: 1,
    precisionBarTriggeredThisThrow: false,
    passedPbThisThrow: false,
  };
}

export function resetPhysics(state: GameState) {
  state.px = LAUNCH_PAD_X;
  state.py = H - 20;
  state.vx = 0;
  state.vy = 0;
  state.flying = false;
  state.sliding = false;
  state.charging = false;
  state.landed = false;
  state.chargePower = 0;
  state.trail = [];
  state.fellOff = false;
  state.nudgeUsed = false;
  state.initialSpeed = 0;
  state.particles = [];
  state.screenShake = 0;
  state.landingFrame = 0;
  state.slowMo = 0;
  state.zoom = 1;
  state.celebrationBurst = false;
  // Reset page flip state (but don't clear - let animation complete)
  // Note: pageFlip.active is cleared by the transition renderer on completion
  state.currentMultiplier = 1;
  state.perfectLanding = false;
  state.runTrail = [];
  state.recordZoneActive = false;
  state.recordZoneIntensity = 0;
  state.recordZonePeak = false;
  state.epicMomentTriggered = false;
  state.failureAnimating = false;
  state.failureFrame = 0;
  state.failureType = null;
  state.launchFrame = 0;
  state.stamina = 100;
  state.precisionInput = {
    pressedThisFrame: false,
    releasedThisFrame: false,
    holdDuration: 0,
    lastPressedState: false,
  };
  state.staminaDeniedShake = 0;
  state.gravityMultiplier = 1;
  state.floatDuration = 0;
  // Precision bar reset
  state.precisionBarActive = false;
  state.lastValidPx = 0;
  state.precisionTimeScale = 1;
  state.precisionBarTriggeredThisThrow = false;
  state.passedPbThisThrow = false;
  if (state.particleSystem) {
    state.particleSystem.clear();
  }
}

export function nextWind(state: GameState) {
  state.seed++;
  state.wind = (Math.sin(state.seed) * 0.08) - 0.02;
}

export function spawnParticles(
  state: GameState,
  x: number,
  y: number,
  count: number,
  spread: number,
  defaultColor: string,
  overrideColor?: string,
) {
  const color = overrideColor || defaultColor;
  for (let i = 0; i < count; i++) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * spread,
      vy: -Math.random() * spread * 0.8,
      life: 1,
      maxLife: 15 + Math.random() * 15,
      color,
    });
  }
}

export function spawnCelebration(
  state: GameState,
  x: number,
  y: number,
  palette: string[],
) {
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    const speed = 1.5 + Math.random() * 2;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 1,
      maxLife: 30 + Math.random() * 20,
      color: palette[Math.floor(Math.random() * palette.length)],
    });
  }
}

export function clampAngle(angle: number) {
  return Math.max(MIN_ANGLE, Math.min(70, angle));
}
