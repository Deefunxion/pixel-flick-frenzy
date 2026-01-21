import type { ParticleSystem } from './particles';
import type { Animator } from './animator';

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
  // Hot streak (consecutive 419+ throws)
  hotStreak: number;
  bestHotStreak: number;
  // Launch effects
  launchFrame: number;  // Frames since last launch (for burst effect)
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
  // Page flip transition state
  pageFlip: {
    active: boolean;
    startMs: number;
    durationMs: number;
    snapshotReady: boolean;
    direction: 'left' | 'right';
  };
}
