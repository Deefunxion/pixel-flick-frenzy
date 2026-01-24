import {
  CLIFF_EDGE,
  FREE_THROWS_CAP,
  H,
  LAUNCH_PAD_X,
  MIN_ANGLE,
  NEW_PLAYER_BONUS_THROWS,
  OPTIMAL_ANGLE,
  W,
} from '@/game/constants';
import {
  dailySeedFromDate,
  loadJson,
  loadNumber,
  loadStringSet,
  saveJson,
  todayLocalISODate,
} from '@/game/storage';
import type { DailyTasks, GameState, MilestonesClaimed, Star, ThrowState, TutorialState } from './types';
import { ParticleSystem } from './particles';
import { generateRings } from './rings';
import { calculateThrowRegen } from './throws';
import { generateBounceSurface } from './bounce';
import { generateRouteFromObjects } from './routes';
import { getNextContract } from './contracts';
import {
  createArcadeState,
  getLevel,
  createDoodlesFromLevel,
  createSpringsFromLevel,
  createPortalFromPair,
  resetDoodles,
  resetSprings,
  resetPortal,
  resetThrowState,
} from './arcade';

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

function getDefaultThrowState(): ThrowState {
  return {
    freeThrows: FREE_THROWS_CAP,
    permanentThrows: 0,
    lastRegenTimestamp: Date.now(),
    isPremium: false,
  };
}

function getDefaultDailyTasks(): DailyTasks {
  return {
    date: new Date().toISOString().split('T')[0],
    landCount: 0,
    zenoTargetCount: 0,
    landed400: false,
    airTime3s: false,
    airTime4s: false,
    airTime5s: false,
    claimed: [],
  };
}

function getDefaultMilestonesClaimed(): MilestonesClaimed {
  return {
    achievements: [],
    milestones: [],
    newPlayerBonus: false,
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

  // Load throw state
  const savedThrowState = loadJson<ThrowState>('throw_state', getDefaultThrowState());
  const savedDailyTasks = loadJson<DailyTasks>('daily_tasks', getDefaultDailyTasks());
  const savedMilestones = loadJson<MilestonesClaimed>('milestones_claimed', getDefaultMilestonesClaimed());

  // Check if daily tasks need reset (new day)
  const dailyTasks = savedDailyTasks.date === today
    ? savedDailyTasks
    : getDefaultDailyTasks();

  // Calculate free throw regeneration
  const throwState = calculateThrowRegen(savedThrowState);

  // Check for new player bonus
  const milestonesClaimed = savedMilestones;
  if (!milestonesClaimed.newPlayerBonus) {
    throwState.permanentThrows += NEW_PLAYER_BONUS_THROWS;
    milestonesClaimed.newPlayerBonus = true;
    saveJson('milestones_claimed', milestonesClaimed);
    saveJson('throw_state', throwState);
  }

  const state: GameState = {
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
    lastDist: null,
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
    stats: loadJson('stats', {
      totalThrows: 0,
      successfulLandings: 0,
      totalDistance: 0,
      perfectLandings: 0,
      maxMultiplier: 1,
      totalRingsPassed: 0,
      maxRingsInThrow: 0,
      perfectRingThrows: 0,
      maxAirTime: 0,
    }, 'omf_stats'),
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
    // Fail juice
    failJuiceActive: false,
    failJuiceStartTime: 0,
    failImpactX: 0,
    failImpactY: 0,
    hotStreak: 0,
    bestHotStreak: loadNumber('best_hot_streak', 0, 'omf_best_hot_streak'),
    launchFrame: 0,
    launchTimestamp: 0,
    particleSystem: new ParticleSystem(),
    zenoAnimator: null,
    stamina: 100,
    precisionInput: {
      pressedThisFrame: false,
      releasedThisFrame: false,
      holdDuration: 0,
      holdDurationAtRelease: 0,
      lastPressedState: false,
    },
    staminaDeniedShake: 0,
    pendingTapVelocity: 0,
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
    pbPaceActive: false,
    almostOverlayActive: false,
    almostOverlayDistance: 0,
    // Streak tracking (session-volatile)
    sessionThrows: 0,
    landingsWithoutFall: 0,
    // Rings system
    rings: generateRings(seed),
    ringsPassedThisThrow: 0,
    ringMultiplier: 1,
    // Ring juice
    ringJuicePopups: [],
    lastRingCollectTime: 0,
    edgeGlowIntensity: 0,
    // Route juice
    routeJuicePopups: [],
    // Landing grade system
    lastGrade: null,
    gradeDisplayTime: 0,
    // Near-miss drama state
    nearMissActive: false,
    nearMissDistance: 0,
    nearMissIntensity: null,
    nearMissAnimationStart: 0,
    // Session heat (ON FIRE mode)
    sessionHeat: 0,
    onFireMode: false,
    // Charge sweet spot
    chargeSweetSpot: false,
    sweetSpotJustEntered: false,
    // Charge visual tension
    chargeGlowIntensity: 0,
    chargeVignetteActive: false,
    // Air control feedback
    lastControlAction: null,
    controlActionTime: 0,
    // Monetization - Throw system
    throwState,
    dailyTasks,
    milestonesClaimed,
    practiceMode: throwState.freeThrows === 0 && throwState.permanentThrows === 0 && !throwState.isPremium,
    // Achievement notification queue
    achievementQueue: [],
    achievementDisplaying: null,
    achievementDisplayStartTime: 0,
    // Menu state
    menuOpen: false,
    // Zeno Air Control (rapid tap = float, no input = fall, hold = brake)
    airControl: {
      throttleActive: false,
      throttleMsUsed: 0,
      brakeTaps: 0,
      recentTapTimes: [],
      isHoldingBrake: false,
    },
    // Bounce surface (puzzle mechanic) - generated for planning visibility
    bounce: generateBounceSurface(seed),
    // Routes system (combo objectives) - will be set after
    activeRoute: null,
    // Contracts system (varied objectives)
    activeContract: getNextContract(seed, 0, 0),
    contractConsecutiveFails: 0,
    lastContractResult: null,
    staminaUsedThisThrow: 0,
    // Arcade mode (default to arcade for MVP)
    arcadeMode: true,
    arcadeState: createArcadeState(),
    arcadeDoodles: [],
    arcadeSprings: [],
    arcadePortal: null,
  };

  // Initialize arcade level objects
  if (state.arcadeMode && state.arcadeState) {
    const level = getLevel(state.arcadeState.currentLevelId);
    if (level) {
      state.arcadeDoodles = createDoodlesFromLevel(level.doodles);
      state.arcadeSprings = createSpringsFromLevel(level.springs);
      state.arcadePortal = level.portal ? createPortalFromPair(level.portal) : null;
    }
  }

  // Generate route after state is created (needs rings array)
  state.activeRoute = generateRouteFromObjects(
    state.rings,
    state.bounce,
    seed
  );

  return state;
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
  // Fail juice reset
  state.failJuiceActive = false;
  state.failJuiceStartTime = 0;
  state.launchFrame = 0;
  state.launchTimestamp = 0;
  state.stamina = 100;
  state.precisionInput = {
    pressedThisFrame: false,
    releasedThisFrame: false,
    holdDuration: 0,
    holdDurationAtRelease: 0,
    lastPressedState: false,
  };
  state.staminaDeniedShake = 0;
  state.pendingTapVelocity = 0;
  // Precision bar reset
  state.precisionBarActive = false;
  state.lastValidPx = 0;
  state.precisionTimeScale = 1;
  state.precisionBarTriggeredThisThrow = false;
  state.passedPbThisThrow = false;
  state.pbPaceActive = false;
  // Note: almostOverlayActive is NOT reset here - it clears when charging starts
  if (state.particleSystem) {
    state.particleSystem.clear();
  }
  // Rings reset - generate new rings for each throw
  // Use derived seed (base seed + throw count) for unique layouts per throw
  state.rings = generateRings(state.seed + state.stats.totalThrows);
  state.ringsPassedThisThrow = 0;
  state.ringMultiplier = 1;
  // Reset ring juice
  state.ringJuicePopups = [];
  state.lastRingCollectTime = 0;
  state.edgeGlowIntensity = 0;
  // Reset route juice
  state.routeJuicePopups = [];
  // Reset landing grade
  state.lastGrade = null;
  state.gradeDisplayTime = 0;
  // Reset near-miss drama
  state.nearMissActive = false;
  state.nearMissDistance = 0;
  state.nearMissIntensity = null;
  state.nearMissAnimationStart = 0;
  // Reset charge sweet spot
  state.chargeSweetSpot = false;
  state.sweetSpotJustEntered = false;
  // Reset charge visual tension
  state.chargeGlowIntensity = 0;
  state.chargeVignetteActive = false;
  // Reset air control feedback
  state.lastControlAction = null;
  state.controlActionTime = 0;
  // Reset Zeno air control
  state.airControl = {
    throttleActive: false,
    throttleMsUsed: 0,
    brakeTaps: 0,
    recentTapTimes: [],
    isHoldingBrake: false,
  };

  // Generate bounce surface for next throw (visible during planning)
  const throwSeed = state.seed + state.stats.totalThrows;
  state.bounce = generateBounceSurface(throwSeed);

  // Generate route from rings + bounce (visible during planning)
  state.activeRoute = generateRouteFromObjects(
    state.rings,
    state.bounce,
    throwSeed
  );

  // Generate contract if needed (visible during planning)
  if (!state.activeContract) {
    state.activeContract = getNextContract(
      state.seed,
      state.stats.totalThrows,
      state.contractConsecutiveFails
    );
  }

  // Reset contract tracking for new throw
  state.staminaUsedThisThrow = 0;
  state.lastContractResult = null;

  // Reset arcade state for new throw
  if (state.arcadeMode && state.arcadeState) {
    resetThrowState(state.arcadeState);
    resetDoodles(state.arcadeDoodles);
    resetSprings(state.arcadeSprings);
    resetPortal(state.arcadePortal);
  }
}

export function nextWind(state: GameState) {
  state.seed++;

  // Alternate wind direction for a true 50/50 east/west split
  const direction = state.tryCount % 2 === 0 ? 1 : -1;

  // Cycle wind intensity every 3 throws (low/medium/high)
  const intensityLevels = [0.02, 0.05, 0.08];
  const levelIndex = Math.floor(state.tryCount / 3) % intensityLevels.length;
  const magnitude = intensityLevels[levelIndex];

  state.wind = direction * magnitude;
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

export function loadArcadeLevel(state: GameState, levelId: number): void {
  if (!state.arcadeState) return;

  const level = getLevel(levelId);
  if (!level) return;

  state.arcadeState.currentLevelId = levelId;
  state.arcadeDoodles = createDoodlesFromLevel(level.doodles);
  state.arcadeSprings = createSpringsFromLevel(level.springs);
  state.arcadePortal = level.portal ? createPortalFromPair(level.portal) : null;

  resetThrowState(state.arcadeState);
}
