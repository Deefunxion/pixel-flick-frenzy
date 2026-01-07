import { useEffect, useRef, useCallback, useState } from 'react';

const W = 64;
const H = 64;
const CLIFF_EDGE = 58;
const BASE_GRAV = 0.35;
const CHARGE_MS = 900;
const MIN_POWER = 2.5;
const MAX_POWER = 7.5;
const MIN_ANGLE = 20;
const MAX_ANGLE = 70;
const OPTIMAL_ANGLE = 45;

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
  const [bestScore, setBestScore] = useState(+(localStorage.getItem('omf_best') || '0'));
  const [lastDist, setLastDist] = useState<number | null>(null);
  const [fellOff, setFellOff] = useState(false);

  const initState = useCallback((): GameState => {
    const best = +(localStorage.getItem('omf_best') || '0');
    const seed = +(localStorage.getItem('omf_seed') || '0');
    
    return {
      px: 4,
      py: H - 2,
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
      trail: [],
      wind: (Math.sin(seed) * 0.35) - 0.15,
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
    state.wind = (Math.sin(state.seed) * 0.3) - 0.1;
    localStorage.setItem('omf_seed', state.seed.toString());
  }, []);

  const resetPhysics = useCallback((state: GameState) => {
    state.px = 4;
    state.py = H - 2;
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

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

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
        
        // Dynamic wind resistance: stronger effect at higher speeds
        const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
        const dynamicWind = state.wind * (speed / MAX_POWER);
        state.vx += dynamicWind;

        state.px += state.vx;
        state.py += state.vy;
        
        // Record trail with age
        state.trail.push({ x: state.px, y: state.py, age: 0 });

        // Touched ground - start sliding
        if (state.py >= H - 2) {
          state.flying = false;
          state.sliding = true;
          state.py = H - 2;
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
          
          const landedAt = Math.round(state.px);
          
          if (landedAt > CLIFF_EDGE) {
            state.fellOff = true;
            state.dist = 0;
            setFellOff(true);
            playSound(220, 0.15);
          } else {
            state.dist = Math.max(0, landedAt);
            setFellOff(false);
            
            if (state.dist > state.best) {
              state.best = state.dist;
              localStorage.setItem('omf_best', state.best.toString());
              setBestScore(state.best);
              playSound(880, 0.05);
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
        if (state.px > CLIFF_EDGE && state.sliding) {
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
      ctx.fillRect(0, H - 1, CLIFF_EDGE + 1, 1);
      // Ground texture dots
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      for (let x = 2; x < CLIFF_EDGE; x += 3) {
        ctx.fillRect(x, H - 2, 1, 1);
      }
      
      // Cliff edge danger zone
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(CLIFF_EDGE - 4, H - 1, 5, 1);
      // Animated danger stripes at edge
      const t = performance.now() / 200;
      for (let i = 0; i < 3; i++) {
        if ((Math.floor(t) + i) % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillRect(CLIFF_EDGE - 1, H - 3 - i, 1, 1);
        }
      }

      // Best distance marker with glow effect
      if (state.best > 0 && state.best <= CLIFF_EDGE) {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(state.best - 1, H - 6, 3, 5);
        ctx.fillStyle = '#fff';
        ctx.fillRect(state.best, H - 5, 1, 4);
        ctx.fillRect(state.best - 1, H - 5, 3, 1);
      }

      // Wind indicator with animation
      const windDir = state.wind > 0 ? 1 : -1;
      const windAnim = Math.sin(performance.now() / 150) * 0.5;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      const arrowX = W / 2;
      ctx.fillRect(arrowX - 4, 3, 8, 1);
      // Arrow head
      ctx.fillRect(arrowX + windDir * 3, 2, 2, 1);
      ctx.fillRect(arrowX + windDir * 3, 4, 2, 1);
      ctx.fillRect(arrowX + windDir * 4, 3, 1, 1);
      // Wind particles
      const windStrength = Math.abs(state.wind);
      for (let i = 0; i < Math.round(windStrength * 10); i++) {
        const wobble = Math.sin(performance.now() / 100 + i) * 0.5;
        ctx.fillRect(arrowX + windDir * (6 + i * 2) + windAnim, 3 + wobble, 1, 1);
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
        const lineLen = 6 + state.chargePower * 10;
        const startX = state.px;
        const startY = state.py;
        
        // Draw arc showing angle range
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        for (let a = MIN_ANGLE; a <= MAX_ANGLE; a += 5) {
          const rad = (a * Math.PI) / 180;
          ctx.fillRect(
            startX + Math.cos(rad) * 10,
            startY - Math.sin(rad) * 10,
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
          startX + Math.cos(optRad) * 14 - 1,
          startY - Math.sin(optRad) * 14 - 1,
          3, 3
        );
        
        // Power meter bar at bottom
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(2, H - 4, 20, 2);
        const powerColor = state.chargePower > 0.8 ? '#f00' : state.chargePower > 0.5 ? '#ff0' : '#0f0';
        ctx.fillStyle = powerColor;
        ctx.fillRect(2, H - 4, Math.floor(state.chargePower * 20), 2);
      }

      // Nudge available indicator (animated)
      if (state.flying && !state.nudgeUsed) {
        const nudgePulse = Math.sin(performance.now() / 80) * 0.4 + 0.6;
        ctx.fillStyle = `rgba(255,255,0,${nudgePulse})`;
        ctx.fillRect(2, 2, 3, 3);
        ctx.fillStyle = 'rgba(255,255,0,0.3)';
        ctx.fillRect(1, 1, 5, 5);
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
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [initState, resetPhysics, nextWind, playSound, spawnParticles, setBestScore, setLastDist]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center max-w-xs">
        <h1 className="text-xl font-bold text-foreground mb-2">One-More-Flick</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Hold <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">SPACE</kbd> — power &amp; angle rise together.
          <br />
          Release at <span className="text-green-500">45°</span> for max distance. Green dot = sweet spot.
          <br />
          <span className="text-foreground font-medium">Land close to the edge — don't fall off!</span>
          <br />
          <span className="text-yellow-500 text-xs">Yellow dot = press SPACE mid-air for 1 nudge</span>
        </p>
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="game-canvas cursor-pointer"
      />

      <div className="flex gap-8 text-center">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Last</p>
          <p className="text-2xl font-bold font-mono">
            {fellOff ? (
              <span className="text-destructive">FELL!</span>
            ) : lastDist !== null ? (
              <span className="text-foreground">{lastDist}</span>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Best</p>
          <p className="text-2xl font-bold text-primary font-mono">{bestScore}</p>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Wind changes every 5 tries. Max: {CLIFF_EDGE}
      </p>
    </div>
  );
};

export default Game;
