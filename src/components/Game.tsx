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
import { getTheme, DEFAULT_THEME_ID, THEME_IDS, type ThemeId } from '@/game/themes';
import { useUser } from '@/contexts/UserContext';
import { NicknameModal } from './NicknameModal';
import {
  loadDailyStats,
  loadJson,
  loadNumber,
  loadString,
  loadStringSet,
  saveJson,
  saveNumber,
  saveString,
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
  unlockAudioForIOS,
  getAudioState,
  startChargeTone,
  stopChargeTone,
  stopEdgeWarning,
  updateChargeTone,
  updateEdgeWarning,
  type AudioRefs,
  type AudioSettings,
  type AudioState,
} from '@/game/audio';
import { newSessionGoals, type SessionGoal } from '@/game/goals';
import { ACHIEVEMENTS } from '@/game/engine/achievements';
import { renderFrame } from '@/game/engine/render';
import { createInitialState, resetPhysics } from '@/game/engine/state';
import { updateFrame, type GameAudio, type GameUI } from '@/game/engine/update';
import type { GameState } from '@/game/engine/types';
import { StatsOverlay } from './StatsOverlay';
import { LeaderboardScreen } from './LeaderboardScreen';
import { loadDailyChallenge, type DailyChallenge } from '@/game/dailyChallenge';
import { FIREBASE_ENABLED } from '@/firebase/flags';

const Game = () => {
  const { firebaseUser, profile, isLoading, needsOnboarding, completeOnboarding } = useUser();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputPadRef = useRef<HTMLDivElement>(null);
  const extraInputPadRef = useRef<HTMLDivElement>(null); // Extra touch area below stats
  const stateRef = useRef<GameState | null>(null);
  const pressedRef = useRef(false);
  const audioRefs = useRef<AudioRefs>({ ctx: null, chargeOsc: null, chargeGain: null, edgeOsc: null, edgeGain: null, unlocked: false, stateChangeHandler: null });
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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const stored = loadString('theme_id', DEFAULT_THEME_ID, 'omf_theme_id');
    // Validate stored value is a valid ThemeId
    return (stored === 'flipbook' || stored === 'noir') ? stored : DEFAULT_THEME_ID;
  });
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
  const [audioContextState, setAudioContextState] = useState<AudioState>('unavailable');
  const [showAudioWarning, setShowAudioWarning] = useState(false);
  const themeRef = useRef(getTheme(themeId));

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

  // Persist theme selection and update ref
  useEffect(() => {
    saveString('theme_id', themeId);
    themeRef.current = getTheme(themeId);
  }, [themeId]);

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

  // Sync new personal best to Firebase
  const handleNewPersonalBest = useCallback(async (totalScore: number, bestThrow: number) => {
    if (firebaseUser && profile) {
      if (!FIREBASE_ENABLED) return;
      const { syncScoreToFirebase } = await import('@/firebase/scoreSync');
      await syncScoreToFirebase(firebaseUser.uid, profile.nickname, totalScore, bestThrow);
    }
  }, [firebaseUser, profile]);

  // Sync falls to Firebase
  const handleFall = useCallback(async (totalFalls: number) => {
    if (firebaseUser && profile) {
      if (!FIREBASE_ENABLED) return;
      const { syncFallsToFirebase } = await import('@/firebase/scoreSync');
      await syncFallsToFirebase(firebaseUser.uid, profile.nickname, totalFalls);
    }
  }, [firebaseUser, profile]);

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

    const extraInputPad = extraInputPadRef.current; // May be null, that's ok

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
      onNewPersonalBest: handleNewPersonalBest,
      onFall: handleFall,
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
        // Unlock audio on first gesture (iOS compatible)
        await unlockAudioForIOS(audioRefs.current);
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

      // iOS requires aggressive audio unlock on first touch
      const unlocked = await unlockAudioForIOS(audioRefs.current);
      const state = getAudioState(audioRefs.current);
      setAudioContextState(state);

      // Show warning on iOS if audio isn't running after unlock attempt
      if (!unlocked && e.pointerType === 'touch' && !audioSettingsRef.current.muted) {
        setShowAudioWarning(true);
        // Auto-hide warning after 5 seconds
        setTimeout(() => setShowAudioWarning(false), 5000);
      }

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

    // Extra touch area below stats (for comfortable thumb reach on mobile)
    if (extraInputPad) {
      extraInputPad.addEventListener('pointerdown', handlePointerDown);
      extraInputPad.addEventListener('pointermove', handlePointerMove);
      extraInputPad.addEventListener('pointerup', handlePointerUp);
      extraInputPad.addEventListener('pointercancel', handlePointerCancel);
    }

    const loop = () => {
      const state = stateRef.current;
      if (state) {
        const now = performance.now();
        const currentTheme = themeRef.current;
        updateFrame(state, {
          theme: currentTheme,
          nowMs: now,
          pressed: pressedRef.current,
          audio,
          ui,
          triggerHaptic,
          scheduleReset,
          getDailyStats: () => dailyStatsRef.current,
        });
        renderFrame(ctx, state, currentTheme, now);
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
      if (extraInputPad) {
        extraInputPad.removeEventListener('pointerdown', handlePointerDown);
        extraInputPad.removeEventListener('pointermove', handlePointerMove);
        extraInputPad.removeEventListener('pointerup', handlePointerUp);
        extraInputPad.removeEventListener('pointercancel', handlePointerCancel);
      }
      window.clearInterval(hudInterval);
      cancelAnimationFrame(animFrameRef.current);
      stopChargeTone(audioRefs.current);
      stopEdgeWarning(audioRefs.current);
    };
  }, [initState, playZenoJingle, triggerHaptic, handleNewPersonalBest]);

  const theme = getTheme(themeId);

  const controlsLabel = isMobileRef.current ? 'TAP & HOLD' : 'SPACE / CLICK (hold) — drag up/down to aim';

  // Loading state while checking auth
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: theme.background }}
      >
        <p style={{ color: theme.uiText }}>Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="w-full min-h-[100svh] flex justify-center"
      style={{ background: `linear-gradient(180deg, ${theme.background} 0%, ${theme.horizon} 100%)` }}
    >
      <div
        className={`w-full max-w-md flex flex-col items-center ${isMobileRef.current ? 'gap-1 p-1' : 'gap-2 p-2'}`}
      >
      {/* Header - compact */}
      <div className="flex items-center justify-between w-full max-w-md px-2">
        <h1 className="text-sm font-bold" style={{ color: theme.accent1 }}>One-More-Flick</h1>
        {profile && (
          <span className="text-xs font-mono" style={{ color: theme.highlight }}>
            {profile.nickname}
          </span>
        )}
      </div>

      {/* Controls microcopy - hidden in landscape to save space */}
      <div className="w-full max-w-md px-2 text-xs landscape:hidden" style={{ color: theme.uiText, opacity: 0.8 }}>
        <span>{controlsLabel}</span>
      </div>

      {/* Canvas - no flex-1, just natural size */}
      <div className="relative w-full flex justify-center">
        {/* Visual canvas - minimal padding */}
        <div className="relative flex items-center justify-center" style={{ padding: isMobileRef.current ? '2px' : '6px' }}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="game-canvas cursor-pointer touch-none select-none"
            style={{
              boxShadow: themeId === 'noir'
                ? '0 2px 8px rgba(0,0,0,0.4)'
                : '2px 3px 8px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(0,0,0,0.05)',
              border: themeId === 'noir'
                ? `1.5px solid ${theme.accent3}`  // Noir: thin, stark contrast
                : `2.5px solid ${theme.accent3}`, // Flipbook: thicker, warmer
              borderRadius: themeId === 'noir' ? '1px' : '3px',
              width: isMobileRef.current ? 'min(calc(100vw - 0.5rem), 520px)' : 'min(calc(100vw - 1rem), 480px)',
              height: 'auto',
              aspectRatio: `${W} / ${H}`,
              imageRendering: 'pixelated',
              // @ts-expect-error - vendor prefixes for cross-browser crisp rendering
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


      {/* Settings row - theme-aware styling */}
      {(() => {
        // Theme-specific button styles
        const isNoir = themeId === 'noir';
        const buttonStyle: React.CSSProperties = isNoir
          ? {
              // Noir: minimal ink UI - thin borders, stark contrast
              background: 'transparent',
              border: `1px solid ${theme.accent3}`,
              color: theme.uiText,
              padding: '4px 8px',
              minHeight: '32px', // Touch-friendly minimum
            }
          : {
              // Flipbook: sticker label feel - rounded, paper-like
              background: theme.uiBg,
              border: `1.5px solid ${theme.accent3}`,
              color: theme.uiText,
              padding: '4px 10px',
              boxShadow: '1px 1px 0 rgba(0,0,0,0.1)',
              minHeight: '32px', // Touch-friendly minimum
            };
        const buttonClass = isNoir
          ? 'rounded-sm focus-visible:outline-none focus-visible:ring-1 hover:opacity-80 active:opacity-70 transition-opacity'
          : 'rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 hover:opacity-90 active:translate-y-px transition-all';

        return (
          <div className="w-full max-w-md flex items-center justify-between gap-2 text-xs px-2" style={{ color: theme.uiText }}>
            {/* Left: Theme picker */}
            <button
              className={buttonClass}
              style={{
                ...buttonStyle,
                borderColor: theme.accent1,
              }}
              onClick={() => {
                const currentIndex = THEME_IDS.indexOf(themeId);
                const nextIndex = (currentIndex + 1) % THEME_IDS.length;
                setThemeId(THEME_IDS[nextIndex]);
              }}
              aria-label="Switch theme"
            >
              {isNoir ? 'Noir' : 'Flipbook'}
            </button>

            {/* Center: Leaderboard */}
            <button
              className={buttonClass}
              style={{
                ...buttonStyle,
                borderColor: theme.highlight,
              }}
              onClick={() => setShowLeaderboard(true)}
              aria-label="View leaderboard"
            >
              Leaderboard
            </button>

            {/* Right: Stats + Sound */}
            <div className="flex items-center gap-2">
              <button
                className={buttonClass}
                style={buttonStyle}
                onClick={() => setShowStats(true)}
                aria-label="View stats"
              >
                Stats
              </button>
              <button
                className={buttonClass}
                style={buttonStyle}
                onClick={async () => {
                  ensureAudioContext(audioRefs.current);
                  await resumeIfSuspended(audioRefs.current);
                  setAudioSettings((s) => ({ ...s, muted: !s.muted }));
                  // Also dismiss warning if user toggles sound
                  setShowAudioWarning(false);
                }}
                aria-label="Toggle sound"
              >
                {audioSettings.muted ? '🔇' : '🔊'}
              </button>
            </div>
            {/* iOS audio warning */}
            {showAudioWarning && (
              <div
                className="mt-2 px-3 py-2 rounded text-xs text-center"
                style={{ backgroundColor: theme.danger + '33', color: theme.danger, maxWidth: '200px' }}
              >
                No sound? Check your silent switch or tap 🔊 again
              </div>
            )}
          </div>
        );
      })()}

      {/* Hero row: LAST, LV, TARGET - primary focus */}
      <div className="w-full max-w-md flex justify-center items-end gap-6 text-center">
        <div>
          <p className="text-xs uppercase tracking-wide" style={{ color: theme.uiText, opacity: 0.7 }}>Last</p>
          <p className="text-2xl font-bold font-mono">
            {fellOff ? (
              <span style={{ color: theme.danger }}>FELL</span>
            ) : lastDist !== null ? (
              <span style={{ color: theme.accent1 }}>
                {formatScore(lastDist).int}<span className="text-sm opacity-60">.{formatScore(lastDist).dec}</span>
                {perfectLanding && <span style={{ color: theme.highlight }}> ★</span>}
              </span>
            ) : (
              <span style={{ color: theme.uiText, opacity: 0.4 }}>-</span>
            )}
          </p>
          {lastDist !== null && !fellOff && (
            <p className="text-xs font-mono" style={{ color: theme.accent2, opacity: 0.8 }}>
              x{lastMultiplier.toFixed(1)}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide" style={{ color: theme.uiText, opacity: 0.7 }}>Lv</p>
          <p className="text-2xl font-bold font-mono" style={{ color: theme.highlight }}>{zenoLevel}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide" style={{ color: theme.uiText, opacity: 0.7 }}>Target</p>
          <p className="text-xl font-bold font-mono" style={{ color: theme.accent2 }}>
            {formatScore(zenoTarget).int}<span className="text-sm opacity-60">.{formatScore(zenoTarget).dec}</span>
          </p>
        </div>
      </div>

      {/* Secondary row: SCORE, BEST */}
      <div className="w-full max-w-md flex justify-center gap-6 text-center">
        <div>
          <p className="text-xs uppercase" style={{ color: theme.uiText, opacity: 0.6 }}>Score</p>
          <p className="text-base font-bold font-mono" style={{ color: theme.accent4 }}>{Math.floor(totalScore).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs uppercase" style={{ color: theme.uiText, opacity: 0.6 }}>Best</p>
          <p className="text-base font-bold font-mono" style={{ color: theme.accent2 }}>
            {formatScore(bestScore).int}<span className="text-xs opacity-60">.{formatScore(bestScore).dec}</span>
          </p>
        </div>
      </div>

      {/* Extra touch area for comfortable thumb reach on mobile */}
      <div
        ref={extraInputPadRef}
        className="flex-1 w-full min-h-[100px] flex items-center justify-center"
        style={{
          touchAction: 'none',
          cursor: 'pointer',
          // Subtle visual hint
          background: `radial-gradient(ellipse at center, ${theme.accent1}08 0%, transparent 70%)`,
        }}
        aria-label="Tap area - hold to charge, release to launch"
      >
        <p className="text-xs opacity-30 pointer-events-none select-none" style={{ color: theme.uiText }}>
          TAP HERE
        </p>
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

      {/* Stats overlay */}
      {showStats && (
        <StatsOverlay theme={theme} onClose={() => setShowStats(false)} />
      )}

      {/* Leaderboard screen */}
      {showLeaderboard && (
        <LeaderboardScreen theme={theme} onClose={() => setShowLeaderboard(false)} />
      )}

      {/* Onboarding modal for first-time users */}
      {needsOnboarding && (
        <NicknameModal theme={theme} onComplete={completeOnboarding} />
      )}
      </div>
    </div>
  );
};

export default Game;
