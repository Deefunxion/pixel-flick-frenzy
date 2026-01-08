import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import {
  CLIFF_EDGE,
  H,
  LAUNCH_PAD_X,
  MAX_ANGLE,
  MIN_ANGLE,
  OPTIMAL_ANGLE,
  W,
} from '@/game/constants';
import { THEME } from '@/game/themes';
import {
  loadDailyStats,
  loadJson,
  loadNumber,
  loadStringSet,
  saveJson,
  saveNumber,
  todayLocalISODate,
} from '@/game/storage';
import {
  ensureAudioContext,
  playImpact,
  playTone,
  playWhoosh,
  playHeartbeat,
  playRecordBreak,
  playFailureSound,
  playWilhelmScream,
  resumeIfSuspended,
  startChargeTone,
  stopChargeTone,
  stopEdgeWarning,
  updateChargeTone,
  updateEdgeWarning,
  type AudioRefs,
  type AudioSettings,
} from '@/game/audio';
import { newSessionGoals, type SessionGoal } from '@/game/goals';
import { ACHIEVEMENTS } from '@/game/engine/achievements';
import { renderFrame } from '@/game/engine/render';
import { createInitialState, resetPhysics } from '@/game/engine/state';
import { updateFrame, type GameAudio, type GameUI } from '@/game/engine/update';
import type { GameState } from '@/game/engine/types';
import { StatsOverlay } from './StatsOverlay';
import { loadDailyChallenge, type DailyChallenge } from '@/game/dailyChallenge';

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputPadRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const pressedRef = useRef(false);
  const audioRefs = useRef<AudioRefs>({ ctx: null, chargeOsc: null, chargeGain: null, edgeOsc: null, edgeGain: null });
  const animFrameRef = useRef<number>(0);
  const pointerIdRef = useRef<number | null>(null);
  const pointerStartYRef = useRef<number>(0);
  const angleStartRef = useRef<number>(OPTIMAL_ANGLE);

  const [bestScore, setBestScore] = useState(loadNumber('best', 0, 'omf_best'));
  const [zenoTarget, setZenoTarget] = useState(loadNumber('zeno_target', CLIFF_EDGE / 2, 'omf_zeno_target'));
  const [zenoLevel, setZenoLevel] = useState(loadNumber('zeno_level', 0, 'omf_zeno_level'));
  const [lastDist, setLastDist] = useState<number | null>(null);
  const [fellOff, setFellOff] = useState(false);
  // Phase 3: Risk/Reward states
  const [lastMultiplier, setLastMultiplier] = useState(1);
  const [totalScore, setTotalScore] = useState(loadNumber('total_score', 0, 'omf_total_score'));
  const [perfectLanding, setPerfectLanding] = useState(false);
  // Phase 5: Meta Progression states
  const [stats, setStats] = useState(() => {
    return loadJson('stats', { totalThrows: 0, successfulLandings: 0, totalDistance: 0, perfectLandings: 0, maxMultiplier: 1 }, 'omf_stats');
  });
  const [achievements, setAchievements] = useState<Set<string>>(() => {
    return loadStringSet('achievements', 'omf_achievements');
  });
  const [newAchievement, setNewAchievement] = useState<string | null>(null);
  const [showMobileHint, setShowMobileHint] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge>(() => loadDailyChallenge());
  const [hotStreak, setHotStreakState] = useState({ current: 0, best: loadNumber('best_hot_streak', 0, 'omf_best_hot_streak') });

  const [dailyStats, setDailyStats] = useState(() => loadDailyStats());
  const dailyStatsRef = useRef(dailyStats);
  useEffect(() => {
    dailyStatsRef.current = dailyStats;
  }, [dailyStats]);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  }, []);
  const [reduceFx, setReduceFx] = useState(() => loadJson('reduce_fx', prefersReducedMotion, 'omf_reduce_fx'));

  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => {
    const muted = loadJson('audio_muted', false, 'omf_audio_muted');
    const volume = loadNumber('audio_volume', 0.9, 'omf_audio_volume');
    return { muted, volume: Math.max(0, Math.min(1, volume)) };
  });
  const audioSettingsRef = useRef(audioSettings);

  const [sessionGoals, setSessionGoals] = useState<SessionGoal[]>(() => newSessionGoals());

  const [hudPx, setHudPx] = useState(LAUNCH_PAD_X);
  const [hudFlying, setHudFlying] = useState(false);

  useEffect(() => {
    saveJson('reduce_fx', reduceFx);
    if (stateRef.current) stateRef.current.reduceFx = reduceFx;
  }, [reduceFx]);

  useEffect(() => {
    saveJson('audio_muted', audioSettings.muted);
    saveNumber('audio_volume', audioSettings.volume);
    audioSettingsRef.current = audioSettings;
  }, [audioSettings]);

  // Keep daily stats fresh (date rollover)
  useEffect(() => {
    const today = todayLocalISODate();
    if (dailyStats.date !== today) {
      const next = loadDailyStats();
      setDailyStats(next);
    }
  }, [dailyStats.date]);

  // Format score with small decimals
  const formatScore = (score: number) => {
    const intPart = Math.floor(score);
    const decPart = (score - intPart).toFixed(4).substring(2); // Get 4 decimals without "0."
    return { int: intPart, dec: decPart };
  };

  const initState = useCallback((): GameState => {
    return createInitialState({ reduceFx });
  }, [reduceFx]);

  // Phase 4: Zeno level-up arpeggio
  const playZenoJingle = useCallback(() => {
    const settings = audioSettingsRef.current;
    if (settings.muted || settings.volume <= 0) return;
    const ctx = ensureAudioContext(audioRefs.current);
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

    const inputPad = inputPadRef.current;
    if (!inputPad) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    stateRef.current = initState();

    const ui: GameUI = {
      setFellOff,
      setLastMultiplier,
      setPerfectLanding,
      setTotalScore,
      setBestScore,
      setZenoTarget,
      setZenoLevel,
      setStats,
      setAchievements,
      setNewAchievement,
      setLastDist,
      setSessionGoals,
      setDailyStats,
      setDailyChallenge,
      setHotStreak: (current, best) => setHotStreakState({ current, best }),
    };

    const audio: GameAudio = {
      startCharge: () => startChargeTone(audioRefs.current, audioSettingsRef.current),
      updateCharge: (p) => updateChargeTone(audioRefs.current, audioSettingsRef.current, p),
      stopCharge: () => stopChargeTone(audioRefs.current),
      whoosh: () => playWhoosh(audioRefs.current, audioSettingsRef.current),
      impact: (i) => playImpact(audioRefs.current, audioSettingsRef.current, i),
      edgeWarning: (p) => updateEdgeWarning(audioRefs.current, audioSettingsRef.current, p),
      stopEdgeWarning: () => stopEdgeWarning(audioRefs.current),
      tone: (freq, dur, type = 'square', vol = 0.1) => playTone(audioRefs.current, audioSettingsRef.current, freq, dur, type, vol),
      zenoJingle: () => playZenoJingle(),
      heartbeat: (i) => playHeartbeat(audioRefs.current, audioSettingsRef.current, i),
      recordBreak: () => playRecordBreak(audioRefs.current, audioSettingsRef.current),
      failureSound: (type) => playFailureSound(audioRefs.current, audioSettingsRef.current, type),
      wilhelmScream: () => playWilhelmScream(audioRefs.current, audioSettingsRef.current),
    };

    const scheduleReset = (ms: number) => {
      setTimeout(() => {
        if (stateRef.current) resetPhysics(stateRef.current);
      }, ms);
    };

    const syncHud = () => {
      const s = stateRef.current;
      if (!s) return;
      setHudPx(s.px);
      setHudFlying(s.flying || s.sliding || s.charging);
    };

    const hudInterval = window.setInterval(syncHud, 120);

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        pressedRef.current = true;
        // Resume audio context on first gesture
        ensureAudioContext(audioRefs.current);
        await resumeIfSuspended(audioRefs.current);
      }
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        const s = stateRef.current;
        if (!s) return;
        if (!s.flying && !s.sliding) {
          e.preventDefault();
          const step = e.code === 'ArrowUp' ? 2 : -2;
          s.angle = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, s.angle + step));
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        pressedRef.current = false;
      }
    };

    const handlePointerDown = async (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType !== 'touch') return;
      e.preventDefault();
      pressedRef.current = true;
      pointerIdRef.current = e.pointerId;
      pointerStartYRef.current = e.clientY;
      const s = stateRef.current;
      if (s) angleStartRef.current = s.angle;

      try {
        inputPad.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      ensureAudioContext(audioRefs.current);
      await resumeIfSuspended(audioRefs.current);

      // Hide mobile hint after first touch/click
      setShowMobileHint(false);

      // Touch UX flags + haptics
      if (e.pointerType === 'touch') {
        markTouchActive(true);
        triggerHaptic(15);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (pointerIdRef.current == null || e.pointerId !== pointerIdRef.current) return;
      const s = stateRef.current;
      if (!s) return;
      if (!s.charging) return;

      const dy = e.clientY - pointerStartYRef.current;
      // Drag up -> higher angle
      const nextAngle = angleStartRef.current + (-dy * 0.18);
      s.angle = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, nextAngle));
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (pointerIdRef.current != null && e.pointerId === pointerIdRef.current) {
        pointerIdRef.current = null;
      }
      pressedRef.current = false;

      markTouchActive(false);
      if (stateRef.current?.charging) {
        triggerHaptic([10, 30, 20]);
      }
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (pointerIdRef.current != null && e.pointerId === pointerIdRef.current) {
        pointerIdRef.current = null;
      }
      pressedRef.current = false;

      markTouchActive(false);
    };

    // Touch UX flags (still used for visual feedback)
    const markTouchActive = (active: boolean) => {
      const s = stateRef.current;
      if (!s) return;
      s.touchActive = active;
      if (active) s.touchFeedback = 1;
    };

    // Mobile UX: Pause when tab/app goes to background (battery saver)
    const handleVisibilityChange = () => {
      if (stateRef.current) {
        stateRef.current.paused = document.hidden;
        // Stop any audio when going to background
        if (document.hidden) {
          stopChargeTone(audioRefs.current);
          stopEdgeWarning(audioRefs.current);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    inputPad.addEventListener('pointerdown', handlePointerDown);
    inputPad.addEventListener('pointermove', handlePointerMove);
    inputPad.addEventListener('pointerup', handlePointerUp);
    inputPad.addEventListener('pointercancel', handlePointerCancel);

    const loop = () => {
      const state = stateRef.current;
      if (state) {
        const now = performance.now();
        updateFrame(state, {
          theme: THEME,
          nowMs: now,
          pressed: pressedRef.current,
          audio,
          ui,
          triggerHaptic,
          scheduleReset,
          getDailyStats: () => dailyStatsRef.current,
        });
        renderFrame(ctx, state, THEME, now);
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      inputPad.removeEventListener('pointerdown', handlePointerDown);
      inputPad.removeEventListener('pointermove', handlePointerMove);
      inputPad.removeEventListener('pointerup', handlePointerUp);
      inputPad.removeEventListener('pointercancel', handlePointerCancel);
      window.clearInterval(hudInterval);
      cancelAnimationFrame(animFrameRef.current);
      stopChargeTone(audioRefs.current);
      stopEdgeWarning(audioRefs.current);
    };
  }, [initState, playZenoJingle, triggerHaptic]);

  const theme = THEME;

  const distToTarget = Math.round((zenoTarget - hudPx) * 10000) / 10000;
  const distToEdge = Math.round((CLIFF_EDGE - hudPx) * 10000) / 10000;

  const controlsLabel = isMobileRef.current ? 'TAP & HOLD' : 'SPACE / CLICK (hold) — drag up/down to aim';

  return (
    <div
      className={`flex flex-col items-center gap-2 ${isMobileRef.current ? 'p-1' : 'p-2'}`}
      style={{ background: `linear-gradient(180deg, ${theme.background} 0%, ${theme.horizon} 100%)`, minHeight: '100vh' }}
    >
      {/* Header */}
      <div className="flex items-center justify-center w-full max-w-md px-2">
        <h1 className="text-sm font-bold" style={{ color: theme.accent1 }}>One-More-Flick</h1>
      </div>

      {/* Controls microcopy */}
      <div className="w-full max-w-md px-2 text-[10px]" style={{ color: theme.uiText, opacity: 0.8 }}>
        <span>{controlsLabel}</span>
      </div>

      {/* Canvas - maximized */}
      <div className="relative flex-1 w-full flex items-stretch justify-center">
        {/* Visual canvas centered within the available space */}
        <div className="relative flex items-center justify-center" style={{ padding: isMobileRef.current ? '6px 6px 10px 6px' : '10px' }}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="game-canvas cursor-pointer touch-none select-none"
            style={{
              boxShadow: '2px 3px 8px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(0,0,0,0.05)',
              border: '2px solid #374151',
              borderRadius: '2px',
              width: isMobileRef.current ? 'min(calc(100vw - 0.5rem), 520px)' : 'min(calc(100vw - 1rem), 480px)',
              height: 'auto',
              aspectRatio: `${W} / ${H}`,
              imageRendering: 'pixelated',
              // @ts-ignore - vendor prefixes for cross-browser crisp rendering
              WebkitImageRendering: 'pixelated',
              MozImageRendering: 'crisp-edges',
              msInterpolationMode: 'nearest-neighbor',
              // Ensure the input overlay receives the pointer events
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Full-area input overlay so you can tap/hold outside the canvas on mobile */}
        <div
          ref={inputPadRef}
          className="absolute inset-0 z-10"
          style={{ touchAction: 'none', cursor: 'pointer' }}
          aria-label="Game input area"
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

      {/* Distances line */}
      <div className="text-[10px] font-mono" style={{ color: theme.uiText, opacity: hudFlying ? 0.95 : 0.75 }}>
        Δtarget: <span style={{ color: theme.accent2 }}>{distToTarget.toFixed(4)}</span>
        {'  '}|{'  '}
        Δedge: <span style={{ color: distToEdge < 5 ? theme.danger : theme.highlight }}>{distToEdge.toFixed(4)}</span>
      </div>

      {/* Settings row */}
      <div className="flex items-center gap-3 text-[10px]" style={{ color: theme.uiText }}>
        <button
          className="px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: theme.uiBg, border: `1px solid ${theme.accent3}` }}
          onClick={async () => {
            ensureAudioContext(audioRefs.current);
            await resumeIfSuspended(audioRefs.current);
            setAudioSettings((s) => ({ ...s, muted: !s.muted }));
          }}
          aria-label="Toggle mute"
        >
          {audioSettings.muted ? 'Muted' : 'Sound'}
        </button>
        <label className="flex items-center gap-2" aria-label="Volume">
          <span>Vol</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(audioSettings.volume * 100)}
            onChange={(e) => setAudioSettings((s) => ({ ...s, volume: Number(e.target.value) / 100 }))}
          />
        </label>
        <button
          className="px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: theme.uiBg, border: `1px solid ${theme.accent3}` }}
          onClick={() => setReduceFx((v) => !v)}
          aria-label="Toggle reduce effects"
        >
          {reduceFx ? 'FX: Low' : 'FX: On'}
        </button>
        <button
          className="px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: theme.uiBg, border: `1px solid ${theme.accent3}` }}
          onClick={() => setShowStats(true)}
          aria-label="View stats"
        >
          Stats
        </button>
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
        <span>Daily {dailyStats.bestDistance.toFixed(2)}</span>
        {(hotStreak.current > 0 || hotStreak.best > 0) && (
          <span style={{ color: hotStreak.current > 0 ? theme.highlight : theme.uiText }}>
            {hotStreak.current > 0 ? '🔥' : ''} {hotStreak.current > 0 ? hotStreak.current : hotStreak.best} streak
          </span>
        )}
      </div>

      {/* Session goals */}
      <div className="text-[10px] text-center max-w-md" style={{ color: theme.uiText, opacity: 0.85 }}>
        {sessionGoals.map((g) => (
          <span key={g.id} style={{ marginRight: 10, color: g.done ? theme.highlight : theme.uiText }}>
            {g.label}: {Math.min(g.target, g.progress)}/{g.target}
          </span>
        ))}
      </div>

      {/* Daily Challenge */}
      <div
        className="text-[10px] text-center max-w-md p-2 rounded"
        style={{
          background: dailyChallenge.completed ? `${theme.highlight}20` : `${theme.accent3}10`,
          border: `1px solid ${dailyChallenge.completed ? theme.highlight : theme.accent3}`,
          color: theme.uiText,
        }}
      >
        <span className="font-bold" style={{ color: theme.accent1 }}>
          Daily Challenge:{' '}
        </span>
        <span className={dailyChallenge.completed ? 'line-through opacity-50' : ''}>
          {dailyChallenge.description}
        </span>
        {dailyChallenge.completed && (
          <span style={{ color: theme.highlight }}> Complete!</span>
        )}
        {!dailyChallenge.completed && dailyChallenge.progress > 0 && (
          <span style={{ color: theme.accent2 }}> ({Math.floor(dailyChallenge.progress)}/{dailyChallenge.target})</span>
        )}
      </div>

      {/* Game info */}
      <p className="text-[9px] text-center max-w-xs opacity-60" style={{ color: theme.uiText }}>
        Hold SPACE to charge, release to flick. Get as close to 145 as possible without falling off. Beat the target to level up!
      </p>

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

      {/* Stats overlay */}
      {showStats && (
        <StatsOverlay theme={theme} onClose={() => setShowStats(false)} />
      )}
    </div>
  );
};

export default Game;
