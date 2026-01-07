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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
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
  trail: { x: number; y: number; age: number }[];
  wind: number;
  seed: number;
  tryCount: number;
  fellOff: boolean;
  nudgeUsed: boolean;
  initialSpeed: number;
  particles: Particle[];
  screenShake: number;
  landingFrame: number;
}

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
    };
  }, []);

  const spawnParticles = useCallback((state: GameState, x: number, y: number, count: number, spread: number) => {
    for (let i = 0; i < count; i++) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * spread,
        vy: -Math.random() * spread * 0.8,
        life: 1,
        maxLife: 15 + Math.random() * 15,
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
  }, []);

  const playSound = useCallback((freq: number, duration: number) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.value = 0.1;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, []);

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

    // Touch controls for mobile
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      pressedRef.current = true;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      pressedRef.current = false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    const update = (state: GameState) => {
      const pressed = pressedRef.current;

      // Start charging
      if (!state.flying && !state.sliding && pressed && !state.charging) {
        state.charging = true;
        state.chargeStart = performance.now();
        setFellOff(false);
      }

      // Update charge power AND angle while holding (both increase together!)
      if (state.charging && pressed) {
        const dt = Math.min(performance.now() - state.chargeStart, CHARGE_MS) / CHARGE_MS;
        state.chargePower = dt;
        // Angle increases from MIN to MAX as you hold longer
        state.angle = MIN_ANGLE + (MAX_ANGLE - MIN_ANGLE) * dt;
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
      }

      // Mid-air nudge (single use) - press SPACE while flying
      if (state.flying && pressed && !state.nudgeUsed && state.initialSpeed > 0) {
        const nudgePower = state.initialSpeed * 0.1;
        // Apply nudge opposite to wind direction
        state.vx -= Math.sign(state.wind) * nudgePower;
        state.nudgeUsed = true;
        playSound(660, 0.03);
      }

      // Physics - flying
      if (state.flying) {
        state.vy += BASE_GRAV;

        // Gentle wind effect (subtle, not game-breaking)
        state.vx += state.wind * 0.3;

        state.px += state.vx;
        state.py += state.vy;
        
        // Record trail with age
        state.trail.push({ x: state.px, y: state.py, age: 0 });

        // Touched ground - start sliding
        if (state.py >= H - 4) {
          state.flying = false;
          state.sliding = true;
          state.py = H - 4;
          state.vx *= 0.55;
          state.vy = 0;
          state.landingFrame = 8;
          state.screenShake = 4;
          spawnParticles(state, state.px, state.py, 6, 1.5);
          playSound(440, 0.02);
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

      // Physics - sliding
      if (state.sliding) {
        const friction = 0.88;
        state.vx *= friction;
        state.px += state.vx;
        
        // Spawn dust while sliding fast
        if (Math.abs(state.vx) > 0.5 && Math.random() > 0.5) {
          spawnParticles(state, state.px, state.py, 1, 0.5);
        }
        
        state.trail.push({ x: state.px, y: state.py, age: 0 });

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
            setFellOff(true);
            playSound(220, 0.15);
          } else {
            state.dist = Math.max(0, landedAt);
            setFellOff(false);

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
              playSound(880, 0.08);
              // Extra celebration sound for leveling up
              setTimeout(() => playSound(1100, 0.05), 100);
            } else if (state.dist > state.best) {
              // Beat personal best but not the Zeno target
              state.best = state.dist;
              localStorage.setItem('omf_best', state.best.toString());
              setBestScore(state.best);
              playSound(660, 0.05);
            }
          }
          
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
      ctx.translate(shakeX, shakeY);
      
      // Clear
      ctx.fillStyle = '#000';
      ctx.fillRect(-2, -2, W + 4, H + 4);

      // Dithered background pattern
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let y = 0; y < H; y += 4) {
        for (let x = (y % 8 === 0 ? 0 : 2); x < W; x += 4) {
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Ground with texture
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, H - 3, CLIFF_EDGE + 1, 1);
      // Ground texture dots
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      for (let x = 2; x < CLIFF_EDGE; x += 4) {
        ctx.fillRect(x, H - 4, 1, 1);
      }

      // Launch pad platform
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(LAUNCH_PAD_X - 4, H - 5, 9, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(LAUNCH_PAD_X - 5, H - 4, 11, 1);
      // Launch pad stripes
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(LAUNCH_PAD_X - 2, H - 5, 1, 2);
      ctx.fillRect(LAUNCH_PAD_X + 2, H - 5, 1, 2);

      // Cliff edge danger zone
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(CLIFF_EDGE - 6, H - 3, 7, 1);
      // Animated danger stripes at edge
      const t = performance.now() / 200;
      for (let i = 0; i < 5; i++) {
        if ((Math.floor(t) + i) % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillRect(CLIFF_EDGE - 1, H - 5 - i, 1, 1);
        }
      }
      // "EDGE" warning zone highlight
      ctx.fillStyle = 'rgba(255,100,100,0.2)';
      ctx.fillRect(CLIFF_EDGE - 10, H - 3, 11, 1);

      // Best distance marker with glow effect
      if (state.best > 0 && state.best <= CLIFF_EDGE) {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(state.best - 1, H - 8, 3, 5);
        ctx.fillStyle = '#fff';
        ctx.fillRect(state.best, H - 7, 1, 4);
        ctx.fillRect(state.best - 1, H - 7, 3, 1);
      }

      // Zeno Target marker - the ever-moving goal (pulsing cyan)
      if (state.zenoTarget > 0 && state.zenoTarget <= CLIFF_EDGE) {
        const zenoPulse = Math.sin(performance.now() / 150) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0,255,255,${zenoPulse * 0.3})`;
        ctx.fillRect(Math.floor(state.zenoTarget) - 2, H - 12, 5, 9);
        ctx.fillStyle = `rgba(0,255,255,${zenoPulse * 0.8})`;
        ctx.fillRect(Math.floor(state.zenoTarget), H - 10, 1, 7);
        // Small arrow pointing down at target
        ctx.fillRect(Math.floor(state.zenoTarget) - 1, H - 11, 3, 1);
        ctx.fillRect(Math.floor(state.zenoTarget), H - 12, 1, 1);
      }

      // Wind indicator - clearer design with box
      const windDir = state.wind > 0 ? 1 : -1;
      const windStrength = Math.abs(state.wind);
      const windAnim = Math.sin(performance.now() / 150) * 0.5;

      // Wind box background
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(W - 45, 2, 42, 12);

      // Wind label area
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      // Arrow base
      const arrowX = W - 24;
      ctx.fillRect(arrowX - 8, 7, 16, 1);

      // Arrow head pointing in wind direction
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      if (windDir > 0) {
        ctx.fillRect(arrowX + 6, 6, 2, 1);
        ctx.fillRect(arrowX + 6, 8, 2, 1);
        ctx.fillRect(arrowX + 8, 7, 1, 1);
      } else {
        ctx.fillRect(arrowX - 8, 6, 2, 1);
        ctx.fillRect(arrowX - 8, 8, 2, 1);
        ctx.fillRect(arrowX - 9, 7, 1, 1);
      }

      // Wind strength dots (more dots = stronger wind)
      const numDots = Math.max(1, Math.ceil(windStrength * 60));
      for (let i = 0; i < Math.min(numDots, 5); i++) {
        const wobble = Math.sin(performance.now() / 80 + i * 0.5) * 0.5;
        ctx.fillStyle = `rgba(255,255,255,${0.5 + i * 0.1})`;
        ctx.fillRect(arrowX + windDir * (10 + i * 3) + windAnim, 7 + wobble, 1, 1);
      }

      // Trail with fading
      for (const t of state.trail) {
        const alpha = Math.max(0, 1 - t.age / 40) * 0.5;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        if (t.x >= 0 && t.x < W && t.y >= 0 && t.y < H) {
          ctx.fillRect(Math.floor(t.x), Math.floor(t.y), 1, 1);
        }
      }

      // Particles
      for (const p of state.particles) {
        const alpha = p.life / p.maxLife;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 1);
      }

      // Player pixel with squash/stretch
      let pxW = 1, pxH = 1;
      if (state.flying) {
        const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
        if (state.vy < -1) {
          pxW = 1; pxH = 2; // stretch up
        } else if (state.vy > 1) {
          pxW = 1; pxH = 2; // stretch down  
        }
      }
      if (state.landingFrame > 4) {
        pxW = 2; pxH = 1; // squash on land
      }
      
      if (state.fellOff) {
        ctx.fillStyle = '#f00';
      } else if (state.charging) {
        // Pulsing while charging
        const pulse = Math.sin(performance.now() / 50) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255,255,${Math.floor(pulse * 255)},1)`;
      } else {
        ctx.fillStyle = '#fff';
      }
      const drawX = Math.max(0, Math.min(W - pxW, Math.floor(state.px)));
      const drawY = Math.max(0, Math.min(H - pxH, Math.floor(state.py) - (pxH - 1)));
      ctx.fillRect(drawX, drawY, pxW, pxH);

      // Power/angle indicator while charging
      if (state.charging) {
        const angleRad = (state.angle * Math.PI) / 180;
        const lineLen = 8 + state.chargePower * 15;
        const startX = state.px;
        const startY = state.py;

        // Draw arc showing angle range
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        for (let a = MIN_ANGLE; a <= MAX_ANGLE; a += 5) {
          const rad = (a * Math.PI) / 180;
          ctx.fillRect(
            startX + Math.cos(rad) * 14,
            startY - Math.sin(rad) * 14,
            1, 1
          );
        }

        // Power bar line with dotted effect
        ctx.fillStyle = '#ff0';
        for (let i = 0; i < lineLen; i += 2) {
          const px = startX + Math.cos(angleRad) * i;
          const py = startY - Math.sin(angleRad) * i;
          ctx.fillRect(Math.floor(px), Math.floor(py), 1, 1);
        }
        // Arrow tip
        const endX = startX + Math.cos(angleRad) * lineLen;
        const endY = startY - Math.sin(angleRad) * lineLen;
        ctx.fillRect(Math.floor(endX), Math.floor(endY), 2, 2);

        // Optimal angle marker (45°) - pulsing green
        const optRad = (OPTIMAL_ANGLE * Math.PI) / 180;
        const optPulse = Math.sin(performance.now() / 100) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0,255,0,${optPulse * 0.8})`;
        ctx.fillRect(
          startX + Math.cos(optRad) * 18 - 1,
          startY - Math.sin(optRad) * 18 - 1,
          3, 3
        );

        // Power meter bar at TOP LEFT (away from launch pad)
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(4, 4, 40, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(5, 5, 38, 4);
        const powerColor = state.chargePower > 0.8 ? '#f00' : state.chargePower > 0.5 ? '#ff0' : '#0f0';
        ctx.fillStyle = powerColor;
        ctx.fillRect(5, 5, Math.floor(state.chargePower * 38), 4);

        // Angle indicator text area
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        const angleDisplay = Math.round(state.angle);
        // Simple angle display - dots for tens
        const tens = Math.floor(angleDisplay / 10);
        for (let i = 0; i < tens; i++) {
          ctx.fillRect(6 + i * 3, 12, 2, 2);
        }
      }

      // Nudge available indicator (animated) - bottom left, more prominent
      if (state.flying && !state.nudgeUsed) {
        const nudgePulse = Math.sin(performance.now() / 80) * 0.4 + 0.6;
        // Larger, more visible indicator
        ctx.fillStyle = 'rgba(255,255,0,0.2)';
        ctx.fillRect(3, H - 14, 14, 10);
        ctx.fillStyle = `rgba(255,255,0,${nudgePulse})`;
        ctx.fillRect(5, H - 12, 10, 6);
        ctx.fillStyle = `rgba(255,255,0,${nudgePulse * 0.8})`;
        ctx.fillRect(8, H - 10, 4, 2);
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
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [initState, resetPhysics, nextWind, playSound, spawnParticles, setBestScore, setLastDist, setZenoTarget, setZenoLevel]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center max-w-sm px-2">
        <h1 className="text-lg sm:text-xl font-bold text-foreground mb-1 sm:mb-2">One-More-Flick</h1>
        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
          <span className="hidden sm:inline">Hold </span>
          <kbd className="px-1 sm:px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">SPACE</kbd>
          <span className="sm:hidden"> or TAP</span> to charge.
          <span className="text-cyan-400"> Chase the target</span> — the edge is unreachable.
        </p>
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="game-canvas cursor-pointer"
      />

      <div className="flex flex-wrap justify-center gap-3 sm:gap-5 text-center">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Last</p>
          <p className="text-xl sm:text-2xl font-bold font-mono">
            {fellOff ? (
              <span className="text-destructive">FELL!</span>
            ) : lastDist !== null ? (
              <span className="text-foreground">
                {formatScore(lastDist).int}
                <span className="text-xs sm:text-sm text-muted-foreground">.{formatScore(lastDist).dec}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Best</p>
          <p className="text-xl sm:text-2xl font-bold text-primary font-mono">
            {formatScore(bestScore).int}
            <span className="text-xs sm:text-sm text-muted-foreground">.{formatScore(bestScore).dec}</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-cyan-500 uppercase tracking-wide">Target</p>
          <p className="text-xl sm:text-2xl font-bold text-cyan-400 font-mono">
            {formatScore(zenoTarget).int}
            <span className="text-xs sm:text-sm text-cyan-600">.{formatScore(zenoTarget).dec}</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Zeno</p>
          <p className="text-xl sm:text-2xl font-bold text-yellow-400 font-mono">Lv.{zenoLevel}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-xs px-2">
        <span className="text-cyan-500">Zeno's Paradox</span> — Target moves halfway to {CLIFF_EDGE} each level.
      </p>
    </div>
  );
};

export default Game;
