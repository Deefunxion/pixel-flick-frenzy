import { useEffect, useRef, useCallback } from 'react';

const W = 64;
const H = 64;
const BASE_GRAV = 0.35;
const CHARGE_MS = 80;
const ANGLE = Math.PI / 4;

// 3×5 pixel font patterns for digits and symbols
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
  '+': [0b000, 0b010, 0b111, 0b010, 0b000],
  '-': [0b000, 0b000, 0b111, 0b000, 0b000],
};

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
  wind: number;
  grav: number;
  seed: number;
  tryCount: number;
  nearMissFrame: number;
  showInstructions: boolean;
  hasPlayed: boolean;
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
    const hasPlayed = localStorage.getItem('omf_played') === '1';
    
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
      wind: Math.sin(seed) * 0.15,
      grav: BASE_GRAV + Math.cos(seed) * 0.05,
      seed,
      tryCount: 0,
      nearMissFrame: 0,
      showInstructions: !hasPlayed,
      hasPlayed,
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
    state.chargePower = 0;
    state.trail = [];
    state.nearMissFrame = 0;
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

  const drawChar = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, char: string) => {
    const pattern = DIGIT_PATTERNS[char];
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

  const drawNumber = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, num: number, showSign: boolean = false) => {
    ctx.fillStyle = '#fff';
    let offsetX = x;
    
    if (showSign) {
      drawChar(ctx, offsetX, y, num >= 0 ? '+' : '-');
      offsetX += 4;
    }
    
    const str = Math.abs(num).toString().padStart(2, '0');
    for (let i = 0; i < str.length; i++) {
      drawChar(ctx, offsetX + i * 4, y, str[i]);
    }
  }, [drawChar]);

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

      // Dismiss instructions on first press
      if (state.showInstructions && pressed) {
        state.showInstructions = false;
        state.hasPlayed = true;
        localStorage.setItem('omf_played', '1');
      }

      // Start charging
      if (!state.flying && pressed && !state.charging && !state.showInstructions) {
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
        const power = 6 + 6 * state.chargePower;
        state.vx = power * Math.cos(ANGLE) + state.wind;
        state.vy = -power * Math.sin(ANGLE);
        state.trail = [];
        state.chargePower = 0;
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

          const delta = state.dist - state.best;

          // Check for new best
          if (state.dist > state.best) {
            state.best = state.dist;
            localStorage.setItem('omf_best', state.best.toString());
            state.ghost = [...state.trail];
            localStorage.setItem('omf_ghost', JSON.stringify(state.ghost));
          }

          // Near-miss detection
          if (Math.abs(delta) < 5 && Math.abs(delta) > 0) {
            state.nearMissFrame = 6;
            playTick();
          }

          state.tryCount++;
          
          // Change wind/gravity every 7 tries
          if (state.tryCount % 7 === 0) {
            nextSeed(state);
          }

          // Auto reset after landing
          setTimeout(() => {
            if (stateRef.current) {
              resetPhysics(stateRef.current);
            }
          }, 800);
        }
      }

      // Decrement near-miss flash
      if (state.nearMissFrame > 0) {
        state.nearMissFrame--;
      }
    };

    const draw = (state: GameState) => {
      // Clear to black
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      // Ground line
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, H - 1, W, 1);

      // Wind indicator (top right) - arrow showing direction
      const windDir = state.wind > 0 ? 1 : -1;
      const windStrength = Math.abs(state.wind) / 0.15;
      ctx.fillStyle = '#fff';
      const windX = W - 8;
      const windY = 3;
      // Arrow base
      ctx.fillRect(windX, windY, 5, 1);
      // Arrow head
      if (windDir > 0) {
        ctx.fillRect(windX + 4, windY - 1, 1, 1);
        ctx.fillRect(windX + 4, windY + 1, 1, 1);
      } else {
        ctx.fillRect(windX, windY - 1, 1, 1);
        ctx.fillRect(windX, windY + 1, 1, 1);
      }
      // Wind strength dots
      for (let i = 0; i < Math.ceil(windStrength * 3); i++) {
        ctx.fillRect(windX + 2 + (windDir > 0 ? -i * 2 : i * 2), windY + 3, 1, 1);
      }

      // Ghost trail (best attempt)
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      for (let i = 0; i < state.ghost.length; i += 2) {
        ctx.fillRect(Math.floor(state.ghost[i]), Math.floor(state.ghost[i + 1]), 1, 1);
      }

      // Best distance marker on ground
      if (state.best > 0 && state.best < W) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(Math.floor(state.best), H - 3, 1, 2);
      }

      // Current trail
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < state.trail.length; i += 2) {
        ctx.fillRect(Math.floor(state.trail[i]), Math.floor(state.trail[i + 1]), 1, 1);
      }

      // Player pixel
      if (state.nearMissFrame > 0 && state.nearMissFrame % 2 === 0) {
        ctx.fillStyle = '#f00';
      } else {
        ctx.fillStyle = '#fff';
      }
      ctx.fillRect(Math.floor(state.px), Math.floor(state.py), 1, 1);

      // Power meter (when charging) - vertical bar on left
      if (state.charging) {
        const meterHeight = Math.floor(state.chargePower * 20);
        ctx.fillStyle = '#fff';
        // Meter outline
        ctx.fillRect(1, H - 25, 1, 22);
        ctx.fillRect(1, H - 25, 3, 1);
        ctx.fillRect(1, H - 3, 3, 1);
        // Meter fill
        for (let i = 0; i < meterHeight; i++) {
          ctx.fillRect(2, H - 4 - i, 1, 1);
        }
      }

      // Distance delta (when landed and not flying)
      if (!state.flying && !state.charging && state.dist > 0) {
        const delta = state.dist - state.best;
        drawNumber(ctx, 2, 2, delta, true);
      }

      // Instructions overlay
      if (state.showInstructions) {
        // Darken background
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        
        // Simple pixel art instructions
        ctx.fillStyle = '#fff';
        
        // "HOLD" text (simplified)
        // H
        ctx.fillRect(20, 20, 1, 5);
        ctx.fillRect(24, 20, 1, 5);
        ctx.fillRect(21, 22, 3, 1);
        // O
        ctx.fillRect(26, 20, 3, 1);
        ctx.fillRect(26, 24, 3, 1);
        ctx.fillRect(26, 21, 1, 3);
        ctx.fillRect(28, 21, 1, 3);
        // L
        ctx.fillRect(30, 20, 1, 5);
        ctx.fillRect(31, 24, 2, 1);
        // D
        ctx.fillRect(34, 20, 1, 5);
        ctx.fillRect(35, 20, 2, 1);
        ctx.fillRect(35, 24, 2, 1);
        ctx.fillRect(37, 21, 1, 3);

        // Spacebar icon
        ctx.fillRect(22, 30, 20, 1);
        ctx.fillRect(22, 36, 20, 1);
        ctx.fillRect(22, 31, 1, 5);
        ctx.fillRect(41, 31, 1, 5);
        
        // "RELEASE" indicator - arrow up
        ctx.fillRect(31, 42, 1, 4);
        ctx.fillRect(30, 43, 1, 1);
        ctx.fillRect(32, 43, 1, 1);
        
        // Flashing "CLICK" indicator
        if (Math.floor(performance.now() / 500) % 2 === 0) {
          ctx.fillRect(28, 50, 8, 1);
        }
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
