import { useEffect, useRef, useCallback, useState } from 'react';

const W = 160;
const H = 80;
const CLIFF_EDGE = 145;
const BASE_GRAV = 0.15;
const CHARGE_MS = 1800;
const MIN_POWER = 2;
const MAX_POWER = 6;
const MIN_ANGLE = 20;
const MAX_ANGLE = 70;
const OPTIMAL_ANGLE = 45;
const LAUNCH_PAD_X = 10;

// Theme definitions
interface Theme {
  name: string;
  background: string;
  backgroundGradientEnd: string;
  horizon: string;
  gridPrimary: string;
  gridSecondary: string;
  accent1: string;      // Primary accent (was neonPink)
  accent2: string;      // Secondary accent (was neonCyan)
  accent3: string;      // Tertiary accent (was neonPurple)
  accent4: string;      // Quaternary accent (was neonMagenta)
  highlight: string;    // Highlight color (was neonYellow)
  player: string;
  playerGlow: string;
  trailNormal: string;
  trailPastTarget: string;
  star: string;
  danger: string;
  uiBg: string;
  uiText: string;
}

const THEMES: Record<string, Theme> = {
  synthwave: {
    name: 'Synthwave',
    background: '#0a0014',
    backgroundGradientEnd: '#1a0044',
    horizon: '#1a0033',
    gridPrimary: '#ff00ff',
    gridSecondary: '#8800aa',
    accent1: '#ff0080',
    accent2: '#00ffff',
    accent3: '#bf00ff',
    accent4: '#ff00aa',
    highlight: '#ffff00',
    player: '#00ffff',
    playerGlow: 'rgba(0,255,255,0.6)',
    trailNormal: '#ff0080',
    trailPastTarget: '#00ffff',
    star: '#ffffff',
    danger: '#ff0040',
    uiBg: 'rgba(0,0,0,0.6)',
    uiText: '#ffffff',
  },
  noir: {
    name: 'Dark Noir',
    background: '#0a0a0a',
    backgroundGradientEnd: '#1a1a1a',
    horizon: '#151515',
    gridPrimary: '#333333',
    gridSecondary: '#222222',
    accent1: '#ff4444',      // Blood red accents
    accent2: '#888888',      // Silver/gray
    accent3: '#666666',      // Dark gray
    accent4: '#aa4444',      // Muted red
    highlight: '#ffffff',    // Pure white highlights
    player: '#ffffff',       // White player
    playerGlow: 'rgba(255,255,255,0.4)',
    trailNormal: '#666666',
    trailPastTarget: '#ff4444',
    star: '#444444',         // Dim stars
    danger: '#ff2222',
    uiBg: 'rgba(0,0,0,0.8)',
    uiText: '#cccccc',
  },
  golf: {
    name: 'Golf Classic',
    background: '#0a1a0a',
    backgroundGradientEnd: '#1a3a1a',
    horizon: '#2a4a2a',
    gridPrimary: '#3a6a3a',
    gridSecondary: '#2a5a2a',
    accent1: '#44aa44',      // Grass green
    accent2: '#ffffff',      // Ball white
    accent3: '#88cc88',      // Light green
    accent4: '#66aa66',      // Medium green
    highlight: '#ffdd44',    // Gold/flag yellow
    player: '#ffffff',       // Golf ball white
    playerGlow: 'rgba(255,255,255,0.5)',
    trailNormal: '#88cc88',
    trailPastTarget: '#ffdd44',
    star: '#aaddaa',         // Pale green stars
    danger: '#cc4444',       // Red hazard
    uiBg: 'rgba(20,40,20,0.8)',
    uiText: '#ccffcc',
  },
};

// Current theme reference (updated by state)
let COLORS = THEMES.synthwave;

interface Star {
  x: number;
  y: number;
  speed: number;
  brightness: number;
  size: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color?: string;
}

interface GameState {
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
  trail: { x: number; y: number; age: number; pastTarget?: boolean }[];
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
  // Phase 2: Cinematic effects
  slowMo: number;
  screenFlash: number;
  zoom: number;
  zoomTargetX: number;
  zoomTargetY: number;
  celebrationBurst: boolean;
  // Phase 3: Risk/Reward system
  currentMultiplier: number;
  lastMultiplier: number;
  perfectLanding: boolean;
  totalScore: number;
  // Phase 5: Meta Progression
  stats: {
    totalThrows: number;
    successfulLandings: number;
    totalDistance: number;
    perfectLandings: number;
    maxMultiplier: number;
  };
  achievements: Set<string>;
  newAchievement: string | null;
  // Mobile UX enhancements
  touchActive: boolean;
  touchFeedback: number;
  paused: boolean;
}

// Achievement definitions
const ACHIEVEMENTS: Record<string, { name: string; desc: string; check: (stats: GameState['stats'], state: GameState) => boolean }> = {
  first_zeno: { name: 'First Step', desc: 'Beat your first Zeno target', check: (_, s) => s.zenoLevel >= 1 },
  level_5: { name: 'Halfway There', desc: 'Reach Zeno Level 5', check: (_, s) => s.zenoLevel >= 5 },
  level_10: { name: 'Zeno Master', desc: 'Reach Zeno Level 10', check: (_, s) => s.zenoLevel >= 10 },
  perfect_140: { name: 'Edge Walker', desc: 'Land beyond 140', check: (_, s) => s.best >= 140 },
  perfect_landing: { name: 'Bullseye', desc: 'Get a perfect landing', check: (stats) => stats.perfectLandings >= 1 },
  ten_perfects: { name: 'Sharpshooter', desc: 'Get 10 perfect landings', check: (stats) => stats.perfectLandings >= 10 },
  hundred_throws: { name: 'Dedicated', desc: '100 total throws', check: (stats) => stats.totalThrows >= 100 },
  high_roller: { name: 'High Roller', desc: 'Achieve 4x multiplier', check: (stats) => stats.maxMultiplier >= 4 },
  thousand_score: { name: 'Scorer', desc: 'Accumulate 1000 total score', check: (_, s) => s.totalScore >= 1000 },
};

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const pressedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const [bestScore, setBestScore] = useState(parseFloat(localStorage.getItem('omf_best') || '0'));
  const [zenoTarget, setZenoTarget] = useState(parseFloat(localStorage.getItem('omf_zeno_target') || String(CLIFF_EDGE / 2)));
  const [zenoLevel, setZenoLevel] = useState(+(localStorage.getItem('omf_zeno_level') || '0'));
  const [lastDist, setLastDist] = useState<number | null>(null);
  const [fellOff, setFellOff] = useState(false);
  // Phase 3: Risk/Reward states
  const [lastMultiplier, setLastMultiplier] = useState(1);
  const [totalScore, setTotalScore] = useState(parseFloat(localStorage.getItem('omf_total_score') || '0'));
  const [perfectLanding, setPerfectLanding] = useState(false);
  // Phase 5: Meta Progression states
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('omf_stats');
    return saved ? JSON.parse(saved) : { totalThrows: 0, successfulLandings: 0, totalDistance: 0, perfectLandings: 0, maxMultiplier: 1 };
  });
  const [achievements, setAchievements] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('omf_achievements');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [newAchievement, setNewAchievement] = useState<string | null>(null);
  const [showMobileHint, setShowMobileHint] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('omf_theme');
    return saved && THEMES[saved] ? saved : 'synthwave';
  });

  // Update COLORS reference when theme changes
  useEffect(() => {
    COLORS = THEMES[currentTheme];
    localStorage.setItem('omf_theme', currentTheme);
  }, [currentTheme]);

  // Format score with small decimals
  const formatScore = (score: number) => {
    const intPart = Math.floor(score);
    const decPart = (score - intPart).toFixed(4).substring(2); // Get 4 decimals without "0."
    return { int: intPart, dec: decPart };
  };

  const initState = useCallback((): GameState => {
    const best = parseFloat(localStorage.getItem('omf_best') || '0');
    const seed = +(localStorage.getItem('omf_seed') || '0');
    const savedZenoTarget = parseFloat(localStorage.getItem('omf_zeno_target') || '0');
    const savedZenoLevel = +(localStorage.getItem('omf_zeno_level') || '0');
    const zenoTarget = savedZenoTarget || (best + CLIFF_EDGE) / 2;

    // Generate parallax starfield
    const stars: Star[] = [];
    for (let i = 0; i < 50; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * (H * 0.6), // Stars only in upper portion
        speed: 0.05 + Math.random() * 0.15,
        brightness: 0.3 + Math.random() * 0.7,
        size: Math.random() > 0.8 ? 2 : 1,
      });
    }

    return {
      px: LAUNCH_PAD_X,
      py: H - 6,
      vx: 0,
      vy: 0,
      flying: false,
      sliding: false,
      charging: false,
      chargeStart: 0,
      chargePower: 0,
      angle: MIN_ANGLE,
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
      // Phase 2: Cinematic effects
      slowMo: 0,
      screenFlash: 0,
      zoom: 1,
      zoomTargetX: W / 2,
      zoomTargetY: H / 2,
      celebrationBurst: false,
      // Phase 3: Risk/Reward system
      currentMultiplier: 1,
      lastMultiplier: 1,
      perfectLanding: false,
      totalScore: parseFloat(localStorage.getItem('omf_total_score') || '0'),
      // Phase 5: Meta Progression
      stats: JSON.parse(localStorage.getItem('omf_stats') || '{"totalThrows":0,"successfulLandings":0,"totalDistance":0,"perfectLandings":0,"maxMultiplier":1}'),
      achievements: new Set(JSON.parse(localStorage.getItem('omf_achievements') || '[]')),
      newAchievement: null,
      // Mobile UX enhancements
      touchActive: false,
      touchFeedback: 0,
      paused: false,
    };
  }, []);

  const spawnParticles = useCallback((state: GameState, x: number, y: number, count: number, spread: number, color?: string) => {
    for (let i = 0; i < count; i++) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * spread,
        vy: -Math.random() * spread * 0.8,
        life: 1,
        maxLife: 15 + Math.random() * 15,
        color: color || COLORS.accent1,
      });
    }
  }, []);

  // Phase 2: Celebration burst for Zeno level-up
  const spawnCelebration = useCallback((state: GameState, x: number, y: number) => {
    const colors = [COLORS.accent2, COLORS.accent1, COLORS.highlight, COLORS.accent4, COLORS.accent3];
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
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }, []);

  const nextWind = useCallback((state: GameState) => {
    state.seed++;
    state.wind = (Math.sin(state.seed) * 0.08) - 0.02;
    localStorage.setItem('omf_seed', state.seed.toString());
  }, []);

  const resetPhysics = useCallback((state: GameState) => {
    state.px = LAUNCH_PAD_X;
    state.py = H - 6;
    state.vx = 0;
    state.vy = 0;
    state.flying = false;
    state.sliding = false;
    state.charging = false;
    state.chargePower = 0;
    state.angle = MIN_ANGLE;
    state.trail = [];
    state.fellOff = false;
    state.nudgeUsed = false;
    state.initialSpeed = 0;
    state.particles = [];
    state.screenShake = 0;
    state.landingFrame = 0;
    // Keep stars persistent - don't reset them
    // Phase 2: Reset cinematic effects
    state.slowMo = 0;
    state.zoom = 1;
    state.celebrationBurst = false;
    // Phase 3: Reset risk/reward
    state.currentMultiplier = 1;
    state.perfectLanding = false;
  }, []);

  const playSound = useCallback((freq: number, duration: number, type: OscillatorType = 'square', volume: number = 0.1) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, []);

  // Phase 4: Ascending charge tone
  const chargeOscRef = useRef<OscillatorNode | null>(null);
  const chargeGainRef = useRef<GainNode | null>(null);

  const startChargeTone = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;

    // Stop any existing charge tone
    if (chargeOscRef.current) {
      chargeOscRef.current.stop();
    }

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 220; // Start at A3

    const gain = ctx.createGain();
    gain.gain.value = 0.05;

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    chargeOscRef.current = osc;
    chargeGainRef.current = gain;
  }, []);

  const updateChargeTone = useCallback((chargePower: number) => {
    if (chargeOscRef.current) {
      // Ascending tone from 220Hz to 880Hz (2 octaves)
      chargeOscRef.current.frequency.value = 220 + chargePower * 660;
    }
    if (chargeGainRef.current) {
      // Increase volume slightly as power increases
      chargeGainRef.current.gain.value = 0.03 + chargePower * 0.04;
    }
  }, []);

  const stopChargeTone = useCallback(() => {
    if (chargeOscRef.current) {
      chargeOscRef.current.stop();
      chargeOscRef.current = null;
    }
    if (chargeGainRef.current) {
      chargeGainRef.current = null;
    }
  }, []);

  // Phase 4: Zeno level-up arpeggio
  const playZenoJingle = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.25);
    });
  }, []);

  // Phase 4: Edge warning tone
  const edgeWarningRef = useRef<OscillatorNode | null>(null);
  const edgeGainRef = useRef<GainNode | null>(null);

  const updateEdgeWarning = useCallback((proximity: number) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;

    if (proximity > 0.3) {
      if (!edgeWarningRef.current) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 100;

        const gain = ctx.createGain();
        gain.gain.value = 0;

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        edgeWarningRef.current = osc;
        edgeGainRef.current = gain;
      }

      // Increase pitch and volume as danger increases
      edgeWarningRef.current.frequency.value = 80 + proximity * 120;
      edgeGainRef.current!.gain.value = (proximity - 0.3) * 0.06;
    } else {
      if (edgeWarningRef.current) {
        edgeWarningRef.current.stop();
        edgeWarningRef.current = null;
        edgeGainRef.current = null;
      }
    }
  }, []);

  const stopEdgeWarning = useCallback(() => {
    if (edgeWarningRef.current) {
      edgeWarningRef.current.stop();
      edgeWarningRef.current = null;
      edgeGainRef.current = null;
    }
  }, []);

  // Phase 5: Check and award achievements
  const checkAchievements = useCallback((state: GameState) => {
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (!state.achievements.has(id) && achievement.check(state.stats, state)) {
        state.achievements.add(id);
        state.newAchievement = achievement.name;
        setAchievements(new Set(state.achievements));
        setNewAchievement(achievement.name);
        localStorage.setItem('omf_achievements', JSON.stringify([...state.achievements]));

        // Play achievement sound
        playSound(523, 0.1, 'sine', 0.06);
        setTimeout(() => playSound(659, 0.1, 'sine', 0.06), 80);
        setTimeout(() => playSound(784, 0.15, 'sine', 0.08), 160);

        // Clear achievement notification after 3 seconds
        setTimeout(() => {
          setNewAchievement(null);
          if (stateRef.current) stateRef.current.newAchievement = null;
        }, 3000);

        break; // Only show one achievement at a time
      }
    }
  }, [playSound]);

  // Mobile UX: Haptic feedback helper
  const triggerHaptic = useCallback((pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Vibration not supported or blocked
      }
    }
  }, []);

  // Mobile UX: Detect if user is on mobile
  const isMobileRef = useRef(
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    stateRef.current = initState();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        pressedRef.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        pressedRef.current = false;
      }
    };

    const handleMouseDown = () => pressedRef.current = true;
    const handleMouseUp = () => pressedRef.current = false;

    // Touch controls for mobile with enhanced UX
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      pressedRef.current = true;
      if (stateRef.current) {
        stateRef.current.touchActive = true;
        stateRef.current.touchFeedback = 1;
      }
      // Haptic feedback on touch
      triggerHaptic(15);
      // Hide mobile hint after first touch
      setShowMobileHint(false);
    };
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      pressedRef.current = false;
      if (stateRef.current) {
        stateRef.current.touchActive = false;
      }
      // Haptic on release (launch)
      if (stateRef.current?.charging) {
        triggerHaptic([10, 30, 20]);
      }
    };

    // Mobile UX: Pause when tab/app goes to background (battery saver)
    const handleVisibilityChange = () => {
      if (stateRef.current) {
        stateRef.current.paused = document.hidden;
        // Stop any audio when going to background
        if (document.hidden) {
          stopChargeTone();
          stopEdgeWarning();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    const update = (state: GameState) => {
      // Mobile UX: Skip update when paused (battery saver)
      if (state.paused) return;

      const pressed = pressedRef.current;

      // Mobile UX: Decay touch feedback visual
      if (state.touchFeedback > 0) {
        state.touchFeedback *= 0.9;
        if (state.touchFeedback < 0.01) state.touchFeedback = 0;
      }

      // Start charging
      if (!state.flying && !state.sliding && pressed && !state.charging) {
        state.charging = true;
        state.chargeStart = performance.now();
        setFellOff(false);
        // Phase 4: Start ascending charge tone
        startChargeTone();
      }

      // Update charge power AND angle while holding (both increase together!)
      if (state.charging && pressed) {
        const dt = Math.min(performance.now() - state.chargeStart, CHARGE_MS) / CHARGE_MS;
        state.chargePower = dt;
        // Angle increases from MIN to MAX as you hold longer
        state.angle = MIN_ANGLE + (MAX_ANGLE - MIN_ANGLE) * dt;
        // Phase 4: Update charge tone frequency
        updateChargeTone(dt);
      }

      // Launch on release
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
        // Phase 4: Stop charge tone on launch
        stopChargeTone();
        // Launch whoosh sound
        playSound(200, 0.15, 'sawtooth', 0.05);
      }

      // Mid-air nudge (single use) - press SPACE while flying
      if (state.flying && pressed && !state.nudgeUsed && state.initialSpeed > 0) {
        const nudgePower = state.initialSpeed * 0.1;
        // Apply nudge opposite to wind direction
        state.vx -= Math.sign(state.wind) * nudgePower;
        state.nudgeUsed = true;
        playSound(660, 0.03);
      }

      // Update stars (parallax movement)
      for (const star of state.stars) {
        star.x -= star.speed;
        if (star.x < 0) {
          star.x = W;
          star.y = Math.random() * (H * 0.6);
        }
        // Twinkle effect
        star.brightness = 0.3 + Math.abs(Math.sin(performance.now() / 500 + star.x)) * 0.7;
      }

      // Animate grid
      state.gridOffset = (state.gridOffset + 0.3) % 10;

      // Physics - flying
      if (state.flying) {
        state.vy += BASE_GRAV;

        // Gentle wind effect (subtle, not game-breaking)
        state.vx += state.wind * 0.3;

        state.px += state.vx;
        state.py += state.vy;

        // Record trail with age - mark if past Zeno target for color change
        const pastTarget = state.px >= state.zenoTarget;
        state.trail.push({ x: state.px, y: state.py, age: 0, pastTarget });

        // Touched ground - start sliding
        if (state.py >= H - 4) {
          state.flying = false;
          state.sliding = true;
          state.py = H - 4;
          // Phase 2: Enhanced screen shake based on impact velocity
          const impactVelocity = Math.abs(state.vy);
          state.screenShake = Math.min(8, 2 + impactVelocity * 1.5);
          state.landingFrame = 8;
          // More particles for harder impacts
          const particleCount = Math.floor(4 + impactVelocity * 2);
          spawnParticles(state, state.px, state.py, particleCount, 1.5 + impactVelocity * 0.3, COLORS.accent4);
          state.vx *= 0.55;
          state.vy = 0;
          // Phase 4: Impact sound varies with velocity
          const impactFreq = 200 + impactVelocity * 80;
          playSound(impactFreq, 0.08, 'triangle', 0.08);
          // Add a bass thud for heavier impacts
          if (impactVelocity > 2) {
            playSound(80, 0.12, 'sine', 0.06);
          }
        }
      }

      // Age trail points
      for (const t of state.trail) {
        t.age++;
      }
      state.trail = state.trail.filter(t => t.age < 40);

      // Update particles
      state.particles = state.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life--;
        return p.life > 0;
      });

      // Decay screen shake
      if (state.screenShake > 0) state.screenShake *= 0.8;
      if (state.landingFrame > 0) state.landingFrame--;

      // Phase 2: Cinematic effects decay
      if (state.slowMo > 0) state.slowMo *= 0.95;
      if (state.screenFlash > 0) state.screenFlash *= 0.85;
      if (state.zoom > 1) state.zoom = 1 + (state.zoom - 1) * 0.92;

      // Trigger slow-mo when player is past 90 and approaching edge
      if ((state.flying || state.sliding) && state.px > 90) {
        const edgeProximity = (state.px - 90) / (CLIFF_EDGE - 90);
        state.slowMo = Math.min(0.7, edgeProximity * 0.8);
        state.zoom = 1 + edgeProximity * 0.3;
        state.zoomTargetX = state.px;
        state.zoomTargetY = state.py;
        // Phase 4: Edge warning audio
        updateEdgeWarning(edgeProximity);
      } else {
        // Stop edge warning when not near edge
        stopEdgeWarning();
      }

      // Phase 3: Calculate current multiplier based on edge proximity
      if ((state.flying || state.sliding) && state.px > 50) {
        // Multiplier increases exponentially as you approach the edge
        const riskFactor = (state.px - 50) / (CLIFF_EDGE - 50);
        state.currentMultiplier = 1 + riskFactor * riskFactor * 4; // 1x to 5x
      } else {
        state.currentMultiplier = 1;
      }

      // Physics - sliding
      if (state.sliding) {
        const friction = 0.88;
        state.vx *= friction;
        state.px += state.vx;

        // Spawn dust while sliding fast
        if (Math.abs(state.vx) > 0.5 && Math.random() > 0.5) {
          spawnParticles(state, state.px, state.py, 1, 0.5, COLORS.accent1);
        }

        const pastTarget = state.px >= state.zenoTarget;
        state.trail.push({ x: state.px, y: state.py, age: 0, pastTarget });

        // Stop sliding when slow enough
        if (Math.abs(state.vx) < 0.1) {
          state.sliding = false;
          state.vx = 0;
          
          // Granular float scoring - 4 decimal precision for Zeno's infinite subdivision
          const landedAt = Math.round(state.px * 10000) / 10000;

          if (landedAt >= CLIFF_EDGE) {
            // The edge is UNREACHABLE - Zeno's paradox!
            state.fellOff = true;
            state.dist = 0;
            state.lastMultiplier = 0;
            setFellOff(true);
            setLastMultiplier(0);
            setPerfectLanding(false);
            playSound(220, 0.15);
          } else {
            state.dist = Math.max(0, landedAt);
            setFellOff(false);

            // Phase 3: Calculate final multiplier and check for perfect landing
            const finalMultiplier = state.currentMultiplier;
            state.lastMultiplier = finalMultiplier;
            setLastMultiplier(finalMultiplier);

            // Check for perfect landing (within 0.5 of Zeno target)
            const distFromTarget = Math.abs(landedAt - state.zenoTarget);
            const isPerfect = distFromTarget < 0.5;
            state.perfectLanding = isPerfect;
            setPerfectLanding(isPerfect);

            // Calculate score with multiplier
            const basePoints = state.dist;
            const multipliedPoints = basePoints * finalMultiplier;
            const perfectBonus = isPerfect ? 10 : 0;
            const scoreGained = multipliedPoints + perfectBonus;

            state.totalScore += scoreGained;
            localStorage.setItem('omf_total_score', state.totalScore.toString());
            setTotalScore(state.totalScore);

            // Zeno's Paradox scoring: chase the ever-moving target
            if (state.dist >= state.zenoTarget) {
              // Beat the Zeno target! Level up and set new target
              state.zenoLevel++;
              state.best = state.dist;
              // New target is halfway between new best and the unreachable edge
              state.zenoTarget = (state.best + CLIFF_EDGE) / 2;

              localStorage.setItem('omf_best', state.best.toString());
              localStorage.setItem('omf_zeno_target', state.zenoTarget.toString());
              localStorage.setItem('omf_zeno_level', state.zenoLevel.toString());

              setBestScore(state.best);
              setZenoTarget(state.zenoTarget);
              setZenoLevel(state.zenoLevel);

              // Phase 2: Cinematic celebration!
              state.screenFlash = 1;
              state.celebrationBurst = true;
              spawnCelebration(state, state.px, state.py);

              // Phase 4: Triumphant Zeno jingle!
              playZenoJingle();
              // Stop edge warning since we landed
              stopEdgeWarning();
            } else if (state.dist > state.best) {
              // Beat personal best but not the Zeno target
              state.best = state.dist;
              localStorage.setItem('omf_best', state.best.toString());
              setBestScore(state.best);
              playSound(660, 0.08, 'sine', 0.08);
            }

            // Stop edge warning since we landed safely
            stopEdgeWarning();

            // Perfect landing sound - sparkly arpeggio
            if (isPerfect) {
              setTimeout(() => playSound(1320, 0.05, 'sine', 0.06), 50);
              setTimeout(() => playSound(1760, 0.04, 'sine', 0.05), 100);
            }

            // Phase 5: Update stats
            state.stats.successfulLandings++;
            state.stats.totalDistance += state.dist;
            if (isPerfect) state.stats.perfectLandings++;
            if (finalMultiplier > state.stats.maxMultiplier) {
              state.stats.maxMultiplier = finalMultiplier;
            }
          }

          // Phase 5: Update total throws (for both success and fall)
          state.stats.totalThrows++;
          localStorage.setItem('omf_stats', JSON.stringify(state.stats));
          setStats({ ...state.stats });

          // Check for new achievements
          checkAchievements(state);

          setLastDist(state.fellOff ? null : state.dist);

          state.tryCount++;
          
          if (state.tryCount % 5 === 0) {
            nextWind(state);
          }

          setTimeout(() => {
            if (stateRef.current) {
              resetPhysics(stateRef.current);
            }
          }, 1200);
        }
        
        // Fall off while sliding
        if (state.px >= CLIFF_EDGE && state.sliding) {
          state.sliding = false;
          state.fellOff = true;
          state.dist = 0;
          setFellOff(true);
          playSound(220, 0.15);
          setLastDist(null);
          
          state.tryCount++;
          if (state.tryCount % 5 === 0) {
            nextWind(state);
          }
          
          setTimeout(() => {
            if (stateRef.current) {
              resetPhysics(stateRef.current);
            }
          }, 1200);
        }
      }
    };

    const draw = (state: GameState) => {
      // Apply screen shake
      const shakeX = state.screenShake > 0.1 ? (Math.random() - 0.5) * state.screenShake : 0;
      const shakeY = state.screenShake > 0.1 ? (Math.random() - 0.5) * state.screenShake : 0;

      ctx.save();

      // Phase 2: Apply zoom transform
      if (state.zoom > 1.01) {
        const zoomCenterX = state.zoomTargetX;
        const zoomCenterY = state.zoomTargetY;
        ctx.translate(zoomCenterX, zoomCenterY);
        ctx.scale(state.zoom, state.zoom);
        ctx.translate(-zoomCenterX, -zoomCenterY);
      }

      ctx.translate(shakeX, shakeY);

      // === SYNTHWAVE BACKGROUND ===
      // Gradient from dark purple to deep blue
      const gradient = ctx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, COLORS.background);
      gradient.addColorStop(0.5, COLORS.horizon);
      gradient.addColorStop(1, COLORS.backgroundGradientEnd);
      ctx.fillStyle = gradient;
      ctx.fillRect(-2, -2, W + 4, H + 4);

      // === PARALLAX STARFIELD ===
      for (const star of state.stars) {
        ctx.fillStyle = `rgba(255,255,255,${star.brightness})`;
        ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
      }

      // === PERSPECTIVE GRID ===
      const horizonY = H * 0.55;
      const gridColor = COLORS.gridSecondary;

      // Horizontal lines with perspective (closer together near horizon)
      ctx.fillStyle = gridColor;
      for (let i = 0; i < 12; i++) {
        const progress = i / 12;
        const yPos = horizonY + (H - horizonY) * Math.pow(progress, 0.7) + state.gridOffset * progress;
        if (yPos < H - 3) {
          const alpha = 0.2 + progress * 0.4;
          ctx.fillStyle = `rgba(136,0,170,${alpha})`;
          ctx.fillRect(0, Math.floor(yPos), W, 1);
        }
      }

      // Vertical lines converging to center horizon
      const vanishX = W / 2;
      for (let i = -8; i <= 8; i++) {
        const baseX = vanishX + i * 12;
        const bottomX = vanishX + i * 25;
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(vanishX + i * 3, horizonY);
        ctx.lineTo(bottomX, H - 3);
        ctx.stroke();
      }

      // Horizon glow line
      const glowPulse = Math.sin(performance.now() / 300) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(255,0,255,${glowPulse * 0.6})`;
      ctx.fillRect(0, Math.floor(horizonY) - 1, W, 2);
      ctx.fillStyle = `rgba(255,0,255,${glowPulse * 0.3})`;
      ctx.fillRect(0, Math.floor(horizonY) - 2, W, 4);

      // === GROUND (Neon Platform) ===
      // Main ground line with glow
      ctx.fillStyle = 'rgba(255,0,128,0.3)';
      ctx.fillRect(0, H - 5, CLIFF_EDGE + 1, 3);
      ctx.fillStyle = COLORS.accent1;
      ctx.fillRect(0, H - 3, CLIFF_EDGE + 1, 1);
      ctx.fillStyle = 'rgba(255,0,128,0.5)';
      ctx.fillRect(0, H - 2, CLIFF_EDGE + 1, 2);

      // === LAUNCH PAD (Neon Cyan Platform) ===
      ctx.fillStyle = 'rgba(0,255,255,0.2)';
      ctx.fillRect(LAUNCH_PAD_X - 5, H - 7, 11, 5);
      ctx.fillStyle = COLORS.accent2;
      ctx.fillRect(LAUNCH_PAD_X - 4, H - 5, 9, 2);
      // Launch pad stripes
      ctx.fillStyle = COLORS.accent4;
      ctx.fillRect(LAUNCH_PAD_X - 2, H - 5, 1, 2);
      ctx.fillRect(LAUNCH_PAD_X + 2, H - 5, 1, 2);

      // === CLIFF EDGE DANGER ZONE ===
      const t = performance.now() / 200;
      // Danger zone glow
      ctx.fillStyle = 'rgba(255,0,80,0.3)';
      ctx.fillRect(CLIFF_EDGE - 12, H - 6, 13, 4);
      // Animated danger stripes
      for (let i = 0; i < 6; i++) {
        if ((Math.floor(t) + i) % 2 === 0) {
          ctx.fillStyle = `rgba(255,0,80,${0.6 + Math.sin(t * 2) * 0.3})`;
          ctx.fillRect(CLIFF_EDGE - 1, H - 6 - i, 1, 1);
        }
      }

      // === BEST DISTANCE MARKER (Neon Purple) ===
      if (state.best > 0 && state.best <= CLIFF_EDGE) {
        ctx.fillStyle = 'rgba(191,0,255,0.3)';
        ctx.fillRect(state.best - 1, H - 10, 3, 7);
        ctx.fillStyle = COLORS.accent3;
        ctx.fillRect(state.best, H - 9, 1, 6);
        ctx.fillRect(state.best - 1, H - 9, 3, 1);
      }

      // === ZENO TARGET MARKER (Pulsing Cyan) ===
      if (state.zenoTarget > 0 && state.zenoTarget <= CLIFF_EDGE) {
        const zenoPulse = Math.sin(performance.now() / 150) * 0.3 + 0.7;
        // Glow
        ctx.fillStyle = `rgba(0,255,255,${zenoPulse * 0.2})`;
        ctx.fillRect(Math.floor(state.zenoTarget) - 3, H - 14, 7, 12);
        // Marker
        ctx.fillStyle = `rgba(0,255,255,${zenoPulse * 0.9})`;
        ctx.fillRect(Math.floor(state.zenoTarget), H - 12, 1, 9);
        ctx.fillRect(Math.floor(state.zenoTarget) - 1, H - 13, 3, 1);
        ctx.fillRect(Math.floor(state.zenoTarget), H - 14, 1, 1);
      }

      // === WIND INDICATOR (Synthwave styled) ===
      const windDir = state.wind > 0 ? 1 : -1;
      const windStrength = Math.abs(state.wind);
      const windAnim = Math.sin(performance.now() / 150) * 0.5;

      // Wind box background
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(W - 46, 1, 44, 14);
      ctx.strokeStyle = COLORS.accent3;
      ctx.lineWidth = 1;
      ctx.strokeRect(W - 46, 1, 44, 14);

      // Arrow base
      const arrowX = W - 24;
      ctx.fillStyle = COLORS.accent2;
      ctx.fillRect(arrowX - 8, 7, 16, 1);

      // Arrow head
      ctx.fillStyle = COLORS.accent2;
      if (windDir > 0) {
        ctx.fillRect(arrowX + 6, 6, 2, 1);
        ctx.fillRect(arrowX + 6, 8, 2, 1);
        ctx.fillRect(arrowX + 8, 7, 1, 1);
      } else {
        ctx.fillRect(arrowX - 8, 6, 2, 1);
        ctx.fillRect(arrowX - 8, 8, 2, 1);
        ctx.fillRect(arrowX - 9, 7, 1, 1);
      }

      // Wind strength dots
      const numDots = Math.max(1, Math.ceil(windStrength * 60));
      for (let i = 0; i < Math.min(numDots, 5); i++) {
        const wobble = Math.sin(performance.now() / 80 + i * 0.5) * 0.5;
        ctx.fillStyle = COLORS.accent1;
        ctx.fillRect(arrowX + windDir * (10 + i * 3) + windAnim, 7 + wobble, 1, 1);
      }

      // === TRAIL (Color changes past Zeno target) ===
      for (const tr of state.trail) {
        const alpha = Math.max(0, 1 - tr.age / 40) * 0.8;
        // Pink before target, Cyan after passing target
        const baseColor = tr.pastTarget ? COLORS.trailPastTarget : COLORS.trailNormal;
        // Parse hex and apply alpha
        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        if (tr.x >= 0 && tr.x < W && tr.y >= 0 && tr.y < H) {
          ctx.fillRect(Math.floor(tr.x), Math.floor(tr.y), 1, 1);
          // Glow effect
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.3})`;
          ctx.fillRect(Math.floor(tr.x) - 1, Math.floor(tr.y), 3, 1);
          ctx.fillRect(Math.floor(tr.x), Math.floor(tr.y) - 1, 1, 3);
        }
      }

      // === PARTICLES (with color) ===
      for (const p of state.particles) {
        const alpha = p.life / p.maxLife;
        const color = p.color || COLORS.accent1;
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 1);
      }

      // === PLAYER (Neon Cyan with glow) ===
      let pxW = 1, pxH = 1;
      if (state.flying) {
        if (state.vy < -1) {
          pxW = 1; pxH = 2;
        } else if (state.vy > 1) {
          pxW = 1; pxH = 2;
        }
      }
      if (state.landingFrame > 4) {
        pxW = 2; pxH = 1;
      }

      const drawX = Math.max(0, Math.min(W - pxW, Math.floor(state.px)));
      const drawY = Math.max(0, Math.min(H - pxH, Math.floor(state.py) - (pxH - 1)));

      // Player glow
      if (!state.fellOff) {
        ctx.fillStyle = state.charging
          ? `rgba(255,255,0,${0.3 + Math.sin(performance.now() / 50) * 0.2})`
          : COLORS.playerGlow;
        ctx.fillRect(drawX - 1, drawY - 1, pxW + 2, pxH + 2);
      }

      // Player core
      if (state.fellOff) {
        ctx.fillStyle = '#ff0040';
      } else if (state.charging) {
        const pulse = Math.sin(performance.now() / 50) * 0.3 + 0.7;
        ctx.fillStyle = `rgb(255,255,${Math.floor(pulse * 200)})`;
      } else {
        ctx.fillStyle = COLORS.player;
      }
      ctx.fillRect(drawX, drawY, pxW, pxH);

      // === POWER/ANGLE INDICATOR (Synthwave styled) ===
      if (state.charging) {
        const angleRad = (state.angle * Math.PI) / 180;
        const lineLen = 8 + state.chargePower * 15;
        const startX = state.px;
        const startY = state.py;

        // Arc showing angle range
        ctx.fillStyle = 'rgba(191,0,255,0.3)';
        for (let a = MIN_ANGLE; a <= MAX_ANGLE; a += 5) {
          const rad = (a * Math.PI) / 180;
          ctx.fillRect(
            startX + Math.cos(rad) * 14,
            startY - Math.sin(rad) * 14,
            1, 1
          );
        }

        // Power bar line (yellow/magenta gradient effect)
        for (let i = 0; i < lineLen; i += 2) {
          const progress = i / lineLen;
          const px = startX + Math.cos(angleRad) * i;
          const py = startY - Math.sin(angleRad) * i;
          ctx.fillStyle = progress < 0.5 ? COLORS.highlight : COLORS.accent4;
          ctx.fillRect(Math.floor(px), Math.floor(py), 1, 1);
        }
        // Arrow tip glow
        const endX = startX + Math.cos(angleRad) * lineLen;
        const endY = startY - Math.sin(angleRad) * lineLen;
        ctx.fillStyle = COLORS.highlight;
        ctx.fillRect(Math.floor(endX), Math.floor(endY), 2, 2);

        // Optimal angle marker (45°)
        const optRad = (OPTIMAL_ANGLE * Math.PI) / 180;
        const optPulse = Math.sin(performance.now() / 100) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0,255,128,${optPulse * 0.8})`;
        ctx.fillRect(
          startX + Math.cos(optRad) * 18 - 1,
          startY - Math.sin(optRad) * 18 - 1,
          3, 3
        );

        // Power meter bar (synthwave styled)
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(3, 3, 42, 8);
        ctx.strokeStyle = COLORS.accent3;
        ctx.lineWidth = 1;
        ctx.strokeRect(3, 3, 42, 8);

        // Power fill
        const powerColor = state.chargePower > 0.8 ? COLORS.accent1
          : state.chargePower > 0.5 ? COLORS.highlight
          : COLORS.accent2;
        ctx.fillStyle = powerColor;
        ctx.fillRect(5, 5, Math.floor(state.chargePower * 38), 4);

        // Angle indicator dots
        ctx.fillStyle = COLORS.accent4;
        const angleDisplay = Math.round(state.angle);
        const tens = Math.floor(angleDisplay / 10);
        for (let i = 0; i < tens; i++) {
          ctx.fillRect(5 + i * 3, 13, 2, 2);
        }
      }

      // === NUDGE AVAILABLE INDICATOR ===
      if (state.flying && !state.nudgeUsed) {
        const nudgePulse = Math.sin(performance.now() / 80) * 0.4 + 0.6;
        ctx.fillStyle = `rgba(255,255,0,${nudgePulse * 0.2})`;
        ctx.fillRect(2, H - 15, 16, 12);
        ctx.fillStyle = `rgba(255,255,0,${nudgePulse})`;
        ctx.fillRect(4, H - 13, 12, 8);
        ctx.fillStyle = COLORS.highlight;
        ctx.fillRect(7, H - 11, 6, 4);
      }

      // === PHASE 2: EDGE DANGER ZONE VISUAL ===
      if ((state.flying || state.sliding) && state.px > 120) {
        const dangerIntensity = (state.px - 120) / (CLIFF_EDGE - 120);
        const pulse = Math.sin(performance.now() / 100) * 0.3 + 0.7;
        // Red vignette on edges
        ctx.fillStyle = `rgba(255,0,40,${dangerIntensity * pulse * 0.3})`;
        ctx.fillRect(0, 0, 8, H);
        ctx.fillRect(W - 8, 0, 8, H);
        ctx.fillRect(0, 0, W, 6);
        ctx.fillRect(0, H - 6, W, 6);
      }

      // === PHASE 3: MULTIPLIER UI (top left, below power bar area) ===
      if ((state.flying || state.sliding) && state.currentMultiplier > 1.01) {
        const mult = state.currentMultiplier;
        const multPulse = Math.sin(performance.now() / 80) * 0.2 + 0.8;

        // Multiplier color based on value
        let multColor = COLORS.accent2;
        if (mult > 3) multColor = COLORS.accent1;
        else if (mult > 2) multColor = COLORS.highlight;

        // Multiplier background box - top left corner
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(2, 18, 28, 10);

        // Multiplier border glow
        ctx.strokeStyle = multColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(2, 18, 28, 10);

        // Draw "x" and multiplier bars
        ctx.fillStyle = `rgba(255,255,255,${multPulse})`;
        ctx.fillRect(5, 22, 1, 1);
        ctx.fillRect(7, 22, 1, 1);
        ctx.fillRect(6, 23, 1, 1);

        // Multiplier bars (more bars = higher multiplier)
        ctx.fillStyle = multColor;
        const bars = Math.min(4, Math.floor(mult));
        for (let i = 0; i < bars; i++) {
          ctx.fillRect(10 + i * 5, 20, 3, 6);
        }
      }

      // === PHASE 2: SLOW-MO VISUAL INDICATOR ===
      if (state.slowMo > 0.1) {
        // Subtle vignette effect during slow-mo
        ctx.fillStyle = `rgba(0,255,255,${state.slowMo * 0.1})`;
        ctx.fillRect(0, 0, W, 2);
        ctx.fillRect(0, H - 2, W, 2);
      }

      // === PHASE 2: SCREEN FLASH OVERLAY ===
      if (state.screenFlash > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${state.screenFlash * 0.8})`;
        ctx.fillRect(0, 0, W, H);
      }

      // === MOBILE UX: TOUCH FEEDBACK GLOW ===
      if (state.touchFeedback > 0.05) {
        // Cyan glow pulse from center
        const gradient = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
        // Parse accent2 for touch feedback glow
        const a2 = COLORS.accent2;
        const r2 = parseInt(a2.slice(1,3), 16);
        const g2 = parseInt(a2.slice(3,5), 16);
        const b2 = parseInt(a2.slice(5,7), 16);
        gradient.addColorStop(0, `rgba(${r2},${g2},${b2},${state.touchFeedback * 0.3})`);
        gradient.addColorStop(0.5, `rgba(${r2},${g2},${b2},${state.touchFeedback * 0.15})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W, H);
      }

      // === MOBILE UX: TAP ZONE INDICATOR (shown when idle on mobile) ===
      if (state.touchActive && !state.flying && !state.sliding && !state.charging) {
        // Pulsing ring around player to indicate touch registered
        const ringPulse = Math.sin(performance.now() / 100) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(0,255,255,${ringPulse})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(state.px, state.py, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // === PHASE 5: ACHIEVEMENT NOTIFICATION ===
      if (state.newAchievement) {
        const achPulse = Math.sin(performance.now() / 100) * 0.1 + 0.9;

        // Achievement banner background
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(W / 2 - 45, 2, 90, 18);

        // Golden border
        ctx.strokeStyle = `rgba(255,215,0,${achPulse})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(W / 2 - 45, 2, 90, 18);

        // Achievement icon (star)
        ctx.fillStyle = `rgba(255,215,0,${achPulse})`;
        ctx.fillRect(W / 2 - 40, 8, 2, 2);
        ctx.fillRect(W / 2 - 39, 7, 2, 1);
        ctx.fillRect(W / 2 - 39, 11, 2, 1);
        ctx.fillRect(W / 2 - 41, 9, 1, 1);
        ctx.fillRect(W / 2 - 37, 9, 1, 1);

        // "UNLOCKED" text indicator
        ctx.fillStyle = COLORS.accent2;
        ctx.fillRect(W / 2 - 34, 6, 3, 1);
        ctx.fillRect(W / 2 - 34, 9, 3, 1);
        ctx.fillRect(W / 2 - 34, 12, 3, 1);
      }

      ctx.restore();
    };

    const loop = () => {
      const state = stateRef.current;
      if (state) {
        update(state);
        draw(state);
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [initState, resetPhysics, nextWind, playSound, spawnParticles, spawnCelebration, startChargeTone, updateChargeTone, stopChargeTone, playZenoJingle, updateEdgeWarning, stopEdgeWarning, checkAchievements, triggerHaptic, setBestScore, setLastDist, setZenoTarget, setZenoLevel]);

  const theme = THEMES[currentTheme];

  return (
    <div className="flex flex-col items-center gap-2 p-2" style={{ background: `linear-gradient(180deg, ${theme.background} 0%, ${theme.horizon} 100%)`, minHeight: '100vh' }}>
      {/* Compact header with theme picker */}
      <div className="flex items-center justify-between w-full max-w-md px-2">
        <h1 className="text-sm font-bold" style={{ color: theme.accent1 }}>One-More-Flick</h1>
        {/* Theme dots */}
        <div className="flex gap-1">
          {Object.entries(THEMES).map(([key, t]) => (
            <button
              key={key}
              onClick={() => setCurrentTheme(key)}
              className="w-4 h-4 rounded-full transition-all"
              title={t.name}
              style={{
                background: t.accent1,
                border: currentTheme === key ? '2px solid #fff' : '2px solid transparent',
                boxShadow: currentTheme === key ? `0 0 6px ${t.accent1}` : 'none',
                transform: currentTheme === key ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Canvas - maximized */}
      <div className="relative flex-1 flex items-center">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="game-canvas cursor-pointer touch-none select-none"
          style={{
            boxShadow: `0 0 15px ${theme.accent1}60`,
            border: `1px solid ${theme.accent1}`,
            width: 'min(100vw - 1rem, 480px)',
            height: 'auto',
            aspectRatio: `${W} / ${H}`,
            imageRendering: 'pixelated',
          }}
        />

        {/* Mobile hint overlay */}
        {showMobileHint && isMobileRef.current && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none animate-pulse"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: theme.accent2 }}>TAP & HOLD</p>
              <p className="text-xs" style={{ color: theme.uiText }}>Release to launch</p>
            </div>
          </div>
        )}
      </div>

      {/* Compact score row */}
      <div className="flex justify-center gap-4 text-center">
        <div>
          <p className="text-[10px] uppercase" style={{ color: theme.uiText }}>Last</p>
          <p className="text-lg font-bold font-mono">
            {fellOff ? (
              <span style={{ color: theme.danger }}>FELL</span>
            ) : lastDist !== null ? (
              <span style={{ color: theme.accent1 }}>
                {formatScore(lastDist).int}<span className="text-sm opacity-70">.{formatScore(lastDist).dec}</span>
              </span>
            ) : (
              <span style={{ color: theme.uiText }}>-</span>
            )}
          </p>
          {lastDist !== null && !fellOff && (
            <p className="text-[10px] font-mono" style={{ color: theme.accent2 }}>
              x{lastMultiplier.toFixed(1)}{perfectLanding && <span style={{ color: theme.highlight }}> ★</span>}
            </p>
          )}
        </div>
        <div>
          <p className="text-[10px] uppercase" style={{ color: theme.uiText }}>Best</p>
          <p className="text-lg font-bold font-mono" style={{ color: theme.accent2 }}>
            {formatScore(bestScore).int}<span className="text-sm opacity-70">.{formatScore(bestScore).dec}</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase" style={{ color: theme.uiText }}>Target</p>
          <p className="text-lg font-bold font-mono" style={{ color: theme.accent2 }}>
            {formatScore(zenoTarget).int}<span className="text-sm opacity-70">.{formatScore(zenoTarget).dec}</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase" style={{ color: theme.uiText }}>Lv</p>
          <p className="text-lg font-bold font-mono" style={{ color: theme.highlight }}>{zenoLevel}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase" style={{ color: theme.uiText }}>Score</p>
          <p className="text-lg font-bold font-mono" style={{ color: theme.accent4 }}>{Math.floor(totalScore).toLocaleString()}</p>
        </div>
      </div>

      {/* Minimal stats row */}
      <div className="flex gap-3 text-[10px]" style={{ color: theme.uiText }}>
        <span>{stats.totalThrows} throws</span>
        <span>{stats.totalThrows > 0 ? Math.round((stats.successfulLandings / stats.totalThrows) * 100) : 0}% success</span>
        <span>★ {achievements.size}/{Object.keys(ACHIEVEMENTS).length}</span>
      </div>

      {/* Achievement popup */}
      {newAchievement && (
        <div
          className="fixed top-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded animate-pulse"
          style={{
            background: theme.background,
            border: `1px solid ${theme.highlight}`,
            boxShadow: `0 0 10px ${theme.highlight}80`,
          }}
        >
          <p className="text-xs font-bold" style={{ color: theme.highlight }}>★ {newAchievement}</p>
        </div>
      )}
    </div>
  );
};

export default Game;
