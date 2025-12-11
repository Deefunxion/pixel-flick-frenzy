import { useEffect, useRef, useCallback, useState } from 'react';

const W = 64;
const H = 64;
const BASE_GRAV = 0.35;
const CHARGE_MS = 600; // Much slower - 600ms to fully charge
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
  ghost: number[];
  trail: number[];
  seed: number;
  tryCount: number;
}

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const pressedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const [bestScore, setBestScore] = useState(+(localStorage.getItem('omf_best') || '0'));
  const [lastDist, setLastDist] = useState<number | null>(null);

  const initState = useCallback((): GameState => {
    const best = +(localStorage.getItem('omf_best') || '0');
    const ghost = JSON.parse(localStorage.getItem('omf_ghost') || '[]');
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
      ghost,
      trail: [],
      seed,
      tryCount: 0,
    };
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
  }, []);

  const playTick = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 880;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
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
        const power = 4 + 8 * state.chargePower; // 4-12 px/frame based on charge
        state.vx = power * Math.cos(ANGLE);
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
        if (state.trail.length > 120) {
          state.trail = state.trail.slice(2);
        }

        // Landed
        if (state.py >= H - 2) {
          state.flying = false;
          state.py = H - 2;
          state.dist = Math.max(0, Math.round(state.px));

          // Check for new best
          if (state.dist > state.best) {
            state.best = state.dist;
            localStorage.setItem('omf_best', state.best.toString());
            state.ghost = [...state.trail];
            localStorage.setItem('omf_ghost', JSON.stringify(state.ghost));
            setBestScore(state.best);
            playTick(); // Play sound on new record!
          }
          setLastDist(state.dist);

          state.tryCount++;

          // Auto reset after landing
          setTimeout(() => {
            if (stateRef.current) {
              resetPhysics(stateRef.current);
            }
          }, 1000);
        }
      }
    };

    const draw = (state: GameState) => {
      // Clear to black
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      // Ground line
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, H - 1, W, 1);

      // Best distance marker on ground (flag)
      if (state.best > 0) {
        const markerX = Math.min(state.best, W - 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(markerX, H - 6, 1, 5); // Pole
        ctx.fillRect(markerX + 1, H - 6, 2, 2); // Flag
      }

      // Ghost trail (best attempt) - very faint
      if (state.ghost.length > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        for (let i = 0; i < state.ghost.length; i += 4) {
          ctx.fillRect(Math.floor(state.ghost[i]), Math.floor(state.ghost[i + 1]), 1, 1);
        }
      }

      // Current trail while flying
      if (state.flying) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        for (let i = 0; i < state.trail.length; i += 2) {
          ctx.fillRect(Math.floor(state.trail[i]), Math.floor(state.trail[i + 1]), 1, 1);
        }
      }

      // Player pixel
      ctx.fillStyle = '#fff';
      ctx.fillRect(Math.floor(state.px), Math.floor(state.py), 1, 1);

      // Power bar while charging (simple horizontal bar at top)
      if (state.charging) {
        const barWidth = Math.floor(state.chargePower * (W - 4));
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(2, 2, W - 4, 3); // Background
        ctx.fillStyle = '#fff';
        ctx.fillRect(2, 2, barWidth, 3); // Fill
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
  }, [initState, resetPhysics, playTick, setBestScore, setLastDist]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Clear instructions */}
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-bold text-foreground mb-2">One-More-Flick</h1>
        <p className="text-muted-foreground text-sm">
          Hold <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">SPACE</kbd> to charge power, release to launch.
          <br />
          <span className="text-foreground font-medium">Goal: Launch the pixel as far as you can!</span>
        </p>
      </div>

      {/* Game canvas */}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="game-canvas cursor-pointer"
      />

      {/* Score display - clear and simple */}
      <div className="flex gap-8 text-center">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Last</p>
          <p className="text-2xl font-bold text-foreground font-mono">
            {lastDist !== null ? `${lastDist}` : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Best</p>
          <p className="text-2xl font-bold text-primary font-mono">{bestScore}</p>
        </div>
      </div>
    </div>
  );
};

export default Game;
