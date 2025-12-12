import { useEffect, useRef, useCallback, useState } from 'react';

const W = 64;
const H = 64;
const CLIFF_EDGE = 58;
const BASE_GRAV = 0.4;
const CHARGE_MS = 600;
const MIN_POWER = 3;
const MAX_POWER = 7;
const DEFAULT_ANGLE = 35; // degrees
const MIN_ANGLE = 10;
const MAX_ANGLE = 75;
const ANGLE_STEP = 1.5;

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
  trail: number[];
  wind: number;
  seed: number;
  tryCount: number;
  fellOff: boolean;
  nudgeUsed: boolean;
  initialSpeed: number;
}

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const pressedRef = useRef(false);
  const leftRef = useRef(false);
  const rightRef = useRef(false);
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
      angle: DEFAULT_ANGLE,
      dist: 0,
      best,
      trail: [],
      wind: (Math.sin(seed) * 0.3) - 0.1,
      seed,
      tryCount: 0,
      fellOff: false,
      nudgeUsed: false,
      initialSpeed: 0,
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
    state.sliding = false;
    state.charging = false;
    state.chargePower = 0;
    state.angle = DEFAULT_ANGLE;
    state.trail = [];
    state.fellOff = false;
    state.nudgeUsed = false;
    state.initialSpeed = 0;
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
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        leftRef.current = true;
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        rightRef.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        pressedRef.current = false;
      }
      if (e.code === 'ArrowLeft') {
        leftRef.current = false;
      }
      if (e.code === 'ArrowRight') {
        rightRef.current = false;
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
      const leftPressed = leftRef.current;
      const rightPressed = rightRef.current;

      // Start charging
      if (!state.flying && !state.sliding && pressed && !state.charging) {
        state.charging = true;
        state.chargeStart = performance.now();
        setFellOff(false);
      }

      // Adjust angle while charging with arrow keys
      if (state.charging) {
        if (leftPressed && state.angle < MAX_ANGLE) {
          state.angle = Math.min(MAX_ANGLE, state.angle + ANGLE_STEP);
        }
        if (rightPressed && state.angle > MIN_ANGLE) {
          state.angle = Math.max(MIN_ANGLE, state.angle - ANGLE_STEP);
        }
      }

      // Update charge power while holding
      if (state.charging && pressed) {
        const dt = Math.min(performance.now() - state.chargeStart, CHARGE_MS) / CHARGE_MS;
        state.chargePower = dt;
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
        
        // Record trail
        state.trail.push(state.px, state.py);

        // Touched ground - start sliding
        if (state.py >= H - 2) {
          state.flying = false;
          state.sliding = true;
          state.py = H - 2;
          state.vx *= 0.6;
          state.vy = 0;
        }
      }

      // Physics - sliding
      if (state.sliding) {
        const friction = 0.85;
        state.vx *= friction;
        state.px += state.vx;
        
        state.trail.push(state.px, state.py);

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
      // Clear
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      // Ground (only until cliff edge)
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, H - 1, CLIFF_EDGE + 1, 1);
      
      // Cliff edge marker
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(CLIFF_EDGE - 2, H - 1, 3, 1);

      // Best distance marker
      if (state.best > 0 && state.best <= CLIFF_EDGE) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(state.best, H - 4, 1, 3);
        ctx.fillRect(state.best - 1, H - 4, 3, 1);
      }

      // Wind indicator
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
      const windStrength = Math.abs(state.wind);
      for (let i = 0; i < Math.round(windStrength * 8); i++) {
        ctx.fillRect(arrowX + windDir * (5 + i * 2), 3, 1, 1);
      }

      // Trail
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

      // Player pixel
      if (state.fellOff) {
        ctx.fillStyle = '#f00';
      } else {
        ctx.fillStyle = '#fff';
      }
      const drawX = Math.max(0, Math.min(W - 1, Math.floor(state.px)));
      const drawY = Math.max(0, Math.min(H - 1, Math.floor(state.py)));
      ctx.fillRect(drawX, drawY, 1, 1);

      // Angle indicator while charging
      if (state.charging) {
        const angleRad = (state.angle * Math.PI) / 180;
        const lineLen = 10;
        const startX = state.px;
        const startY = state.py;
        const endX = startX + Math.cos(angleRad) * lineLen;
        const endY = startY - Math.sin(angleRad) * lineLen;

        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      // Power bar while charging
      if (state.charging) {
        const barWidth = Math.floor(state.chargePower * (W - 8));
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(4, H - 8, W - 8, 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(4, H - 8, barWidth, 2);
      }

      // Nudge available indicator (yellow dot top-left when flying)
      if (state.flying && !state.nudgeUsed) {
        ctx.fillStyle = '#ff0';
        ctx.fillRect(2, 2, 2, 2);
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
          Hold <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">SPACE</kbd> to charge,{' '}
          <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">←</kbd>
          <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">→</kbd> to aim.
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
