import type { ParticleSystem } from './particles';
import type { Animator } from './animator';
import type { Ring } from './rings';
import type { RingJuicePopup } from './ringJuice';
import type { GradeResult } from './gradeSystem';

export interface Star {
  x: number;
  y: number;
  speed: number;
  brightness: number;
  size: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color?: string;
}

export type TrailPoint = { x: number; y: number; age: number; pastTarget?: boolean };
export type GhostPoint = { x: number; y: number };

// Ghost trail frame - stores snapshot of player state for echo/motion blur effect
export interface GhostFrame {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  timestamp: number;
}

export interface Stats {
  totalThrows: number;
  successfulLandings: number;
  totalDistance: number;
  perfectLandings: number;
  maxMultiplier: number;
  // Ring stats
  totalRingsPassed: number;
  maxRingsInThrow: number;      // Best single throw (0-3)
  perfectRingThrows: number;    // Throws where all 3 rings passed
}

// Throw/Energy System
export interface ThrowState {
  freeThrows: number;           // 0-50, regenerates over time
  permanentThrows: number;      // 0+, earned/purchased, never expires
  lastRegenTimestamp: number;   // Unix ms for calculating regen
  isPremium: boolean;           // Purchased unlimited (Phase 4)
}

export interface DailyTasks {
  date: string;                 // ISO date string for reset detection
  landCount: number;            // Landings today
  zenoTargetCount: number;      // Times reached zeno target today
  landed400: boolean;           // Landed beyond 400 today
  airTime3s: boolean;           // Stayed airborne 3+ seconds
  airTime4s: boolean;           // Stayed airborne 4+ seconds
  airTime5s: boolean;           // Stayed airborne 5+ seconds
  claimed: string[];            // Task IDs already claimed today
}

export interface MilestonesClaimed {
  achievements: string[];       // Achievement reward IDs claimed
  milestones: string[];         // Milestone reward IDs claimed
  newPlayerBonus: boolean;      // 100 throws claimed on first launch
}

export interface PrecisionInput {
  pressedThisFrame: boolean;   // True only on the frame input started
  releasedThisFrame: boolean;  // True only on the frame input released
  holdDuration: number;        // Frames held (for continuous hold)
  lastPressedState: boolean;   // Previous frame's pressed state
}

export type TutorialPhase = 'none' | 'idle' | 'charge' | 'air' | 'slide';

export interface TutorialState {
  phase: TutorialPhase;
  active: boolean;
  timeRemaining: number; // seconds
  hasSeenCharge: boolean;
  hasSeenAir: boolean;
  hasSeenSlide: boolean;
}

export interface GameState {
  px: number;
  py: number;
  vx: number;
  vy: number;
  flying: boolean;
  sliding: boolean;
  charging: boolean;
  landed: boolean;  // Prevents input until reset
  chargeStart: number;
  chargePower: number;
  angle: number;
  dist: number;
  best: number;
  zenoTarget: number;
  zenoLevel: number;
  trail: TrailPoint[];
  wind: number;
  seed: number;
  tryCount: number;
  fellOff: boolean;
  nudgeUsed: boolean;
  initialSpeed: number;
  particles: Particle[];
  screenShake: number;
  landingFrame: number;
  stars: Star[];
  gridOffset: number;
  // Cinematic effects
  slowMo: number;
  screenFlash: number;
  zoom: number;
  zoomTargetX: number;
  zoomTargetY: number;
  celebrationBurst: boolean;
  // Risk/Reward
  currentMultiplier: number;
  lastMultiplier: number;
  perfectLanding: boolean;
  totalScore: number;
  totalFalls: number;
  // Meta Progression
  stats: Stats;
  achievements: Set<string>;
  newAchievement: string | null;
  // Mobile UX
  touchActive: boolean;
  touchFeedback: number;
  paused: boolean;
  // Ghost trails
  bestTrail: GhostPoint[];
  runTrail: GhostPoint[];
  ghostTrail: GhostFrame[];  // Echo figures during flight
  // Settings
  reduceFx: boolean;
  // Record zone camera
  recordZoneActive: boolean;      // True when approaching personal best
  recordZoneIntensity: number;    // 0-1 based on how close to beating record
  recordZonePeak: boolean;        // True at moment of potential record break
  epicMomentTriggered: boolean;   // Prevents repeat triggers per throw
  // Comedic failure
  failureAnimating: boolean;
  failureFrame: number;
  failureType: 'tumble' | 'dive' | 'splat' | null;
  // Fail juice state (visual feedback for any fall)
  failJuiceActive: boolean;
  failJuiceStartTime: number;
  failImpactX: number;
  failImpactY: number;
  // Hot streak (consecutive 419+ throws)
  hotStreak: number;
  bestHotStreak: number;
  // Launch effects
  launchFrame: number;  // Frames since last launch (for burst effect)
  launchTimestamp: number;  // Unix ms when throw started (for air time tracking)
  // New particle system
  particleSystem: ParticleSystem;
  // Sprite-based character animation
  zenoAnimator: Animator | null;
  // Precision mechanics - stamina system
  stamina: number;
  // Precision mechanics - input state tracking
  precisionInput: PrecisionInput;
  staminaDeniedShake: number; // Frames of shake remaining
  // Air float (gravity reduction on tap)
  gravityMultiplier: number;
  floatDuration: number;
  // Tutorial system
  tutorialState: TutorialState;
  // Precision bar system (419-420 zone)
  precisionBarActive: boolean;
  lastValidPx: number;
  precisionTimeScale: number;
  precisionBarTriggeredThisThrow: boolean;
  passedPbThisThrow: boolean;
  // "Almost!" overlay - stays visible until next throw
  almostOverlayActive: boolean;
  almostOverlayDistance: number; // Frozen distance from target at landing
  // Streak tracking (session-volatile, for achievements)
  sessionThrows: number;        // Resets on page load
  landingsWithoutFall: number;  // Resets on fall
  // Rings system
  rings: Ring[];
  ringsPassedThisThrow: number;
  ringMultiplier: number;
  // Ring juice state
  ringJuicePopups: RingJuicePopup[];
  lastRingCollectTime: number;
  edgeGlowIntensity: number;  // 0-1 for screen edge glow effect
  // Landing grade system
  lastGrade: GradeResult | null;
  gradeDisplayTime: number;  // When grade was shown (for animation timing)
  // Near-miss drama state
  nearMissActive: boolean;
  nearMissDistance: number;  // How far from target
  nearMissIntensity: 'extreme' | 'close' | 'near' | null;
  nearMissAnimationStart: number;
  // Session heat (ON FIRE mode)
  sessionHeat: number;  // 0-100, builds across session
  onFireMode: boolean;  // True when streak >= 5
  // Charge sweet spot
  chargeSweetSpot: boolean;  // True when in optimal range (70-85%)
  sweetSpotJustEntered: boolean;  // For one-time feedback
  // Monetization - Throw system
  throwState: ThrowState;
  dailyTasks: DailyTasks;
  milestonesClaimed: MilestonesClaimed;
  practiceMode: boolean;  // Computed: freeThrows=0 AND permanentThrows=0
}
