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

export interface Stats {
  totalThrows: number;
  successfulLandings: number;
  totalDistance: number;
  perfectLandings: number;
  maxMultiplier: number;
}

export interface GameState {
  px: number;
  py: number;
  vx: number;
  vy: number;
  flying: boolean;
  sliding: boolean;
  charging: boolean;
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
  // Settings
  reduceFx: boolean;
  // Record zone camera
  recordZoneActive: boolean;      // True when approaching personal best
  recordZoneIntensity: number;    // 0-1 based on how close to beating record
  recordZonePeak: boolean;        // True at moment of potential record break
  epicMomentTriggered: boolean;   // Prevents repeat triggers per throw
}
