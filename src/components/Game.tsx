import { useEffect, useRef, useCallback } from 'react';

/**
 * ONE-MORE-FLICK
 * ══════════════════════════════════════════════════════════════════════
 * ADDICTION MECHANICS (documented for ethical awareness):
 * 
 * 1. VARIABLE RATIO REINFORCEMENT
 *    - Friend record delta always shows "so close" feeling
 *    - Random wind/gravity every 7 tries breaks muscle memory
 * 
 * 2. NEAR-MISS PSYCHOLOGY  
 *    - Within 5px of best = red flash + 880Hz tick
 *    - Creates dopamine spike even on "failure"
 * 
 * 3. ZERO FRICTION
 *    - No menus, no death screens, instant restart
 *    - ~4s per attempt = 900 tries/hour potential
 * 
 * 4. SOCIAL COMPARISON (ghost trail)
 *    - Grey dot trail of best attempt during flight
 *    - "I was so close to my best" feeling
 * 
 * 5. ENDLESS CLIFF (optional, see TWIST below)
 *    - Beating record generates fake +5px higher target
 * ══════════════════════════════════════════════════════════════════════
 */

const W = 64;
const H = 64;
const BASE_GRAV = 0.35;
const CHARGE_MS = 80;
const ANGLE = Math.PI / 4;

// 3×5 pixel font patterns for digits 0-9
const DIGIT_PATTERNS: Record<string, number[]> = {
  '0': [0b111, 0b101, 0b101, 0b101, 0b111],
  '1': [0b010, 0b110, 0b010, 0b010, 0b111],
  '2': [0b111, 0b001, 0b111, 0b100, 0b111],
  '3': [0b111, 0b001, 0b111, 0b001, 0b111],
  '4': [0b101, 0b101, 0b111, 0b001, 0b001],
  '5': [0b111, 0b100, 0b111, 0b001, 0b111],
  '6': [0b111, 0b100, 0b111, 0b101, 0b111],
  '7': [0b111, 0b001, 0b001, 0b001, 0b001],
  '8': [0b111, 0b101, 0b111, 0b101, 0b111],
  '9': [0b111, 0b101, 0b111, 0b001, 0b111],
};

interface GameState {
  px: number;
  py: number;
  vx: number;
  vy: number;
  flying: boolean;
  charging: boolean;
  chargeStart: number;
  dist: number;
  best: number;
  ghost: number[];
  trail: number[];
  wind: number;
  grav: number;
  seed: number;
  tryCount: number;
  nearMissFrame: number;
  showAgain: boolean;
  againBlink: boolean;
  replayTrail: number[];
  replayIndex: number;
  replayActive: boolean;
}

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const pressedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);

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
      dist: 0,
      best,
      ghost,
      trail: [],
      wind: Math.sin(seed) * 0.15,
      grav: BASE_GRAV + Math.cos(seed) * 0.05,
      seed,
      tryCount: 0,
      nearMissFrame: 0,
      showAgain: false,
      againBlink: false,
      replayTrail: [],
      replayIndex: 0,
      replayActive: false,
    };
  }, []);

  const nextSeed = useCallback((state: GameState) => {
    state.seed++;
    state.wind = Math.sin(state.seed) * 0.15;
    state.grav = BASE_GRAV + Math.cos(state.seed) * 0.05;
    localStorage.setItem('omf_seed', state.seed.toString());
  }, []);

  const resetPhysics = useCallback((state: GameState) => {
    state.px = 4;
    state.py = H - 2;
    state.vx = 0;
    state.vy = 0;
    state.flying = false;
    state.charging = false;
    state.trail = [];
    state.nearMissFrame = 0;
    state.showAgain = false;
    state.replayActive = false;
    state.replayIndex = 0;
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

  const drawDigit = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, digit: string) => {
    const pattern = DIGIT_PATTERNS[digit];
    if (!pattern) return;
    
    for (let row = 0; row < 5; row++) {
      const bits = pattern[row];
      for (let col = 0; col < 3; col++) {
        if (bits & (1 << (2 - col))) {
          ctx.fillRect(x + col, y + row, 1, 1);
        }
      }
    }
  }, []);

  const drawNumber = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, num: number) => {
    const str = num.toString().padStart(2, '0');
    ctx.fillStyle = '#fff';
    for (let i = 0; i < str.length; i++) {
      drawDigit(ctx, x + i * 4, y, str[i]);
    }
  }, [drawDigit]);

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

    let lastBlinkTime = 0;

    const update = (state: GameState) => {
      const pressed = pressedRef.current;

      // Handle replay
      if (state.replayActive) {
        state.replayIndex += 2;
        if (state.replayIndex >= state.replayTrail.length - 2) {
          state.showAgain = true;
          state.replayActive = false;
        }
        return;
      }

      // Handle "AGAIN" state - restart on any press
      if (state.showAgain && pressed) {
        resetPhysics(state);
        return;
      }

      // Start charging
      if (!state.flying && pressed && !state.charging && !state.showAgain) {
        state.charging = true;
        state.chargeStart = performance.now();
      }

      // Launch on release
      if (state.charging && !pressed) {
        state.charging = false;
        state.flying = true;
        const dt = Math.min(performance.now() - state.chargeStart, CHARGE_MS) / CHARGE_MS;
        const power = 6 + 6 * dt;
        state.vx = power * Math.cos(ANGLE) + state.wind;
        state.vy = -power * Math.sin(ANGLE);
        state.trail = [];
      }

      // Physics
      if (state.flying) {
        state.vy += state.grav;
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

          const delta = Math.abs(state.dist - state.best);

          // Check for new best
          if (state.dist > state.best) {
            state.best = state.dist;
            localStorage.setItem('omf_best', state.best.toString());
            state.ghost = [...state.trail];
            localStorage.setItem('omf_ghost', JSON.stringify(state.ghost));
            
            /* ═══════════════════════════════════════════════════════════
             * OPTIONAL TWIST (endless cliff):
             * Uncomment to make victory impossible - beating friend 
             * immediately generates a fake record +5 px higher.
             * 
             * state.best += 5;
             * localStorage.setItem('omf_best', state.best.toString());
             * ═══════════════════════════════════════════════════════════ */
          }

          // Near-miss detection
          if (delta < 5 && delta > 0) {
            state.nearMissFrame = 6;
            playTick();
          }

          // Missed - show instant replay
          if (state.dist < state.best) {
            state.replayTrail = [...state.trail];
            state.replayIndex = 0;
            state.replayActive = true;
          }

          state.tryCount++;
          
          // Change wind/gravity every 7 tries
          if (state.tryCount % 7 === 0) {
            nextSeed(state);
          }
        }
      }

      // Decrement near-miss flash
      if (state.nearMissFrame > 0) {
        state.nearMissFrame--;
      }
    };

    const draw = (state: GameState, time: number) => {
      // Clear to black
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      // Ground line
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, H - 1, W, 1);

      // Ghost trail (best attempt)
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      for (let i = 0; i < state.ghost.length; i += 2) {
        ctx.fillRect(Math.floor(state.ghost[i]), Math.floor(state.ghost[i + 1]), 1, 1);
      }

      // Current trail
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < state.trail.length; i += 2) {
        ctx.fillRect(Math.floor(state.trail[i]), Math.floor(state.trail[i + 1]), 1, 1);
      }

      // Replay visualization
      if (state.replayActive && state.replayTrail.length > 0) {
        const idx = Math.min(state.replayIndex, state.replayTrail.length - 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(
          Math.floor(state.replayTrail[idx]),
          Math.floor(state.replayTrail[idx + 1]),
          1, 1
        );
      }

      // Player pixel
      if (!state.replayActive) {
        // Near-miss red flash
        if (state.nearMissFrame > 0 && state.nearMissFrame % 2 === 0) {
          ctx.fillStyle = '#f00';
        } else {
          ctx.fillStyle = '#fff';
        }
        ctx.fillRect(Math.floor(state.px), Math.floor(state.py), 1, 1);
      }

      // Charging indicator (subtle pulse on pixel)
      if (state.charging) {
        const pulse = Math.sin(performance.now() / 50) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255,255,255,${pulse})`;
        ctx.fillRect(Math.floor(state.px), Math.floor(state.py), 1, 1);
      }

      // Distance delta (only when landed and not flying)
      if (!state.flying && !state.charging && state.dist > 0) {
        const delta = Math.abs(state.dist - state.best);
        drawNumber(ctx, 2, 2, delta);
      }

      // "AGAIN" blink (2 fps)
      if (state.showAgain) {
        if (time - lastBlinkTime > 250) {
          state.againBlink = !state.againBlink;
          lastBlinkTime = time;
        }
        if (state.againBlink) {
          // Draw simple "A" pattern at center
          ctx.fillStyle = '#fff';
          // Minimalist arrow/retry indicator
          const cx = W / 2 - 2;
          const cy = H / 2 - 2;
          ctx.fillRect(cx, cy, 1, 1);
          ctx.fillRect(cx + 2, cy, 1, 1);
          ctx.fillRect(cx + 1, cy - 1, 1, 1);
          ctx.fillRect(cx + 1, cy + 1, 1, 1);
        }
      }
    };

    const loop = (time: number) => {
      const state = stateRef.current;
      if (state) {
        update(state);
        draw(state, time);
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
  }, [initState, resetPhysics, nextSeed, playTick, drawNumber]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="game-canvas"
    />
  );
};

export default Game;
