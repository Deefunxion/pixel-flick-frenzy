import { useEffect, useRef, useCallback, useState } from 'react';

const W = 64;
const H = 64;
const CLIFF_EDGE = 58; // Land before this or fall off!
const BASE_GRAV = 0.4;
const CHARGE_MS = 500;
const ANGLE = Math.PI / 4;

interface GameState {
  px: number;
  py: number;
  vx: number;
  vy: number;
  flying: boolean;
  charging: boolean;
  chargeStart: number;
  chargePower: number;
  dist: number;
  best: number;
  trail: number[];
  wind: number;
  seed: number;
  tryCount: number;
  fellOff: boolean;
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
      charging: false,
      chargeStart: 0,
      chargePower: 0,
      dist: 0,
      best,
      trail: [],
      wind: (Math.sin(seed) * 0.3) - 0.1, // Wind between -0.4 and 0.2
      seed,
      tryCount: 0,
      fellOff: false,
    };
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
    state.charging = false;
    state.chargePower = 0;
    state.trail = [];
    state.fellOff = false;
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

    const handlePress = (down: boolean) => {
      pressedRef.current = down;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handlePress(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handlePress(false);
      }
    };

    const handleMouseDown = () => handlePress(true);
    const handleMouseUp = () => handlePress(false);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    const update = (state: GameState) => {
      const pressed = pressedRef.current;

      // Start charging
      if (!state.flying && pressed && !state.charging) {
        state.charging = true;
        state.chargeStart = performance.now();
        setFellOff(false);
      }

      // Update charge power while holding
      if (state.charging) {
        const dt = Math.min(performance.now() - state.chargeStart, CHARGE_MS) / CHARGE_MS;
        state.chargePower = dt;
      }

      // Launch on release
      if (state.charging && !pressed) {
        state.charging = false;
        state.flying = true;
        // Power gives speed 3-7, making max distance around 50-60px
        const power = 3 + 4 * state.chargePower;
        state.vx = power * Math.cos(ANGLE) + state.wind;
        state.vy = -power * Math.sin(ANGLE);
        state.trail = [];
        state.chargePower = 0;
      }

      // Physics
      if (state.flying) {
        state.vy += BASE_GRAV;
        state.px += state.vx;
        state.py += state.vy;
        
        // Record trail
        state.trail.push(state.px, state.py);

        // Landed or fell off
        if (state.py >= H - 2) {
          state.flying = false;
          state.py = H - 2;
          
          const landedAt = Math.round(state.px);
          
          // Did they fall off the cliff?
          if (landedAt > CLIFF_EDGE) {
            state.fellOff = true;
            state.dist = 0;
            setFellOff(true);
            playSound(220, 0.15); // Low buzz = fail
          } else {
            state.dist = Math.max(0, landedAt);
            setFellOff(false);
            
            // New best?
            if (state.dist > state.best) {
              state.best = state.dist;
              localStorage.setItem('omf_best', state.best.toString());
              setBestScore(state.best);
              playSound(880, 0.05); // High beep = success
            }
          }
          
          setLastDist(state.fellOff ? null : state.dist);

          state.tryCount++;
          
          // Change wind every 5 tries
          if (state.tryCount % 5 === 0) {
            nextWind(state);
          }

          // Auto reset
          setTimeout(() => {
            if (stateRef.current) {
              resetPhysics(stateRef.current);
            }
          }, 1200);
        }
      }
    };

    const draw = (state: GameState) => {
      // Clear
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      // Ground (only until cliff edge)
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, H - 1, CLIFF_EDGE + 1, 1);
      
      // Cliff edge marker (danger zone)
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(CLIFF_EDGE - 2, H - 1, 3, 1);

      // Best distance marker
      if (state.best > 0 && state.best <= CLIFF_EDGE) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(state.best, H - 4, 1, 3);
        ctx.fillRect(state.best - 1, H - 4, 3, 1);
      }

      // Wind indicator - simple arrow at top
      const windStrength = Math.abs(state.wind);
      const windDir = state.wind > 0 ? 1 : -1;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      const arrowX = W / 2;
      ctx.fillRect(arrowX - 3, 3, 6, 1);
      if (windDir > 0) {
        ctx.fillRect(arrowX + 2, 2, 1, 1);
        ctx.fillRect(arrowX + 2, 4, 1, 1);
      } else {
        ctx.fillRect(arrowX - 3, 2, 1, 1);
        ctx.fillRect(arrowX - 3, 4, 1, 1);
      }
      // Dots showing strength
      for (let i = 0; i < Math.round(windStrength * 8); i++) {
        ctx.fillRect(arrowX + windDir * (5 + i * 2), 3, 1, 1);
      }

      // Current trail
      if (state.flying || state.trail.length > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for (let i = 0; i < state.trail.length; i += 2) {
          const tx = state.trail[i];
          const ty = state.trail[i + 1];
          if (tx >= 0 && tx < W && ty >= 0 && ty < H) {
            ctx.fillRect(Math.floor(tx), Math.floor(ty), 1, 1);
          }
        }
      }

      // Player pixel (red if fell off)
      if (state.fellOff) {
        ctx.fillStyle = '#f00';
      } else {
        ctx.fillStyle = '#fff';
      }
      const drawX = Math.max(0, Math.min(W - 1, Math.floor(state.px)));
      const drawY = Math.max(0, Math.min(H - 1, Math.floor(state.py)));
      ctx.fillRect(drawX, drawY, 1, 1);

      // Power bar while charging
      if (state.charging) {
        const barWidth = Math.floor(state.chargePower * (W - 8));
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(4, H - 8, W - 8, 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(4, H - 8, barWidth, 2);
      }
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
  }, [initState, resetPhysics, nextWind, playSound, setBestScore, setLastDist]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center max-w-xs">
        <h1 className="text-xl font-bold text-foreground mb-2">One-More-Flick</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Hold <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">SPACE</kbd> to charge, release to launch.
          <br />
          <span className="text-foreground font-medium">Land as close to the edge as possible — but don't fall off!</span>
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
