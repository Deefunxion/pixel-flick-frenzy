import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import {
  CLIFF_EDGE,
  FREE_THROWS_CAP,
  H,
  LAUNCH_PAD_X,
  MAX_ANGLE,
  MIN_ANGLE,
  OPTIMAL_ANGLE,
  W,
} from '@/game/constants';
import { assetPath } from '@/lib/assetPath';
import { getTheme, DEFAULT_THEME_ID, THEME_IDS, type ThemeId } from '@/game/themes';
import { useUser } from '@/contexts/UserContext';
import { NicknameModal } from './NicknameModal';
import { MultiplierLadder } from './MultiplierLadder';
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
import { getZenoPrecision } from '@/game/leaderboard';
import {
  ensureAudioContext,
  playTone,
  playHeartbeat,
  playWilhelmScream,
  resumeIfSuspended,
  unlockAudioForIOS,
  getAudioState,
  stopEdgeWarning,
  updateEdgeWarning,
  // Hybrid functions (file-based with synth fallback)
  playWhooshHybrid,
  playImpactHybrid,
  startChargeToneHybrid,
  stopChargeToneHybrid,
  updateChargeToneHybrid,
  playRecordBreakHybrid,
  playFailureSoundHybrid,
  startFly,
  stopFly,
  playSlide,
  stopSlide,
  playWin,
  // Precision control sounds
  playAirBrakeTap,
  playAirBrakeHold,
  playSlideExtend,
  playSlideBrake,
  playStaminaLow,
  playActionDenied,
  // Background ambient
  startAmbient,
  stopAmbient,
  updateAmbient,
  // Precision bar sounds
  startPrecisionDrone,
  stopPrecisionDrone,
  playPbDing,
  playNewRecord,
  playCloseCall,
  // Ring sounds
  playRingCollect,
  type AudioRefs,
  type AudioSettings,
  type AudioState,
} from '@/game/audio';
import { loadAudioFiles } from '@/game/audioFiles';
import { newSessionGoals, type SessionGoal } from '@/game/goals';
import { ACHIEVEMENTS } from '@/game/engine/achievements';
import { renderFrame } from '@/game/engine/render';
import { createInitialState, resetPhysics } from '@/game/engine/state';
import { updateFrame, type GameAudio, type GameUI } from '@/game/engine/update';
import type { GameState } from '@/game/engine/types';
import { assetLoader } from '@/game/engine/assets';
import { Animator } from '@/game/engine/animator';
import { SPRITE_SHEETS } from '@/game/engine/spriteConfig';
import { backgroundRenderer } from '@/game/engine/backgroundRenderer';
import { noirBackgroundRenderer } from '@/game/engine/noirBackgroundRenderer';
import { UI_ASSETS } from '@/game/engine/uiAssets';
import { StatsOverlay } from './StatsOverlay';
import { LeaderboardScreen } from './LeaderboardScreen';
import { TutorialOverlay } from './TutorialOverlay';
import { ThrowCounter } from './ThrowCounter';
import { PracticeModeOverlay } from './PracticeModeOverlay';
import type { ThrowState, DailyTasks, MilestonesClaimed } from '@/game/engine/types';
import { calculateThrowRegen, formatRegenTime, getMsUntilNextThrow } from '@/game/engine/throws';
import { resetTutorialProgress } from '@/game/engine/tutorial';
import {
  hasHapticSupport,
  getHapticsEnabled,
  setHapticsEnabled,
  hapticRingCollect,
  hapticFail,
  hapticRelease,
  hapticLandingImpact,
} from '@/game/engine/haptics';
import { loadRingSprites } from '@/game/engine/ringsRender';
import { loadDailyChallenge, type DailyChallenge } from '@/game/dailyChallenge';
import { claimDailyTask } from '@/game/engine/dailyTasks';
import { FIREBASE_ENABLED } from '@/firebase/flags';
import { captureError } from '@/lib/sentry';
import type { Theme } from '@/game/themes';

// iOS Audio Warning Toast Component
type AudioWarningToastProps = {
  show: boolean;
  theme: Theme;
  onDismiss: () => void;
  onRetry: () => void;
};

function AudioWarningToast({ show, theme, onDismiss, onRetry }: AudioWarningToastProps) {
  if (!show) return null;

  return (
    <div
      className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50
                 px-4 py-3 rounded-lg shadow-lg max-w-xs animate-bounce"
      style={{
        backgroundColor: theme.uiBg,
        border: `2px solid ${theme.danger}`,
        boxShadow: `0 4px 20px ${theme.danger}40`
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔇</span>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: theme.danger }}>
            Sound Blocked
          </p>
          <p className="text-xs mt-1" style={{ color: theme.uiText, opacity: 0.8 }}>
            iOS requires a tap to enable audio
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={onRetry}
              className="px-3 py-1 rounded text-xs font-bold"
              style={{ backgroundColor: theme.accent1, color: theme.background }}
            >
              Enable Sound
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1 rounded text-xs"
              style={{ color: theme.uiText, opacity: 0.7 }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Game = () => {
  const { firebaseUser, profile, isLoading, needsOnboarding, completeOnboarding, skipOnboarding } = useUser();
  console.log('[Game] Render, isLoading:', isLoading, 'needsOnboarding:', needsOnboarding);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputPadRef = useRef<HTMLDivElement>(null);
  const extraInputPadRef = useRef<HTMLDivElement>(null); // Extra touch area below stats
  const stateRef = useRef<GameState | null>(null);
  const pressedRef = useRef(false);
  const audioRefs = useRef<AudioRefs>({ ctx: null, chargeOsc: null, chargeGain: null, edgeOsc: null, edgeGain: null, unlocked: false, stateChangeHandler: null });
  const animFrameRef = useRef<number>(0);
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const errorRef = useRef<string | null>(null);
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
  const [spritesLoaded, setSpritesLoaded] = useState(false);
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
  const [combinedMultiplier, setCombinedMultiplier] = useState(1.0);
  // Tutorial overlay state (synced from stateRef)
  const [tutorialPhase, setTutorialPhase] = useState<'none' | 'idle' | 'charge' | 'air' | 'slide'>('none');
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialTimeRemaining, setTutorialTimeRemaining] = useState(0);

  // Throw/Energy system state
  const [throwState, setThrowState] = useState<ThrowState>(() => {
    const saved = loadJson<ThrowState>('throw_state', {
      freeThrows: FREE_THROWS_CAP,
      permanentThrows: 0,
      lastRegenTimestamp: Date.now(),
      isPremium: false,
    });
    return calculateThrowRegen(saved);
  });
  const [practiceMode, setPracticeMode] = useState(false);

  // Haptics state (for Android vibration feedback)
  const [hapticsEnabled, setHapticsEnabledState] = useState(() => getHapticsEnabled());

  // Daily tasks state
  const [dailyTasks, setDailyTasks] = useState<DailyTasks>(() => {
    const today = new Date().toISOString().split('T')[0];
    const defaultTasks: DailyTasks = {
      date: today,
      landCount: 0,
      zenoTargetCount: 0,
      landed400: false,
      airTime3s: false,
      airTime4s: false,
      airTime5s: false,
      claimed: [],
    };
    const saved = loadJson<DailyTasks>('daily_tasks', defaultTasks);
    // Reset if it's a new day
    return saved.date === today ? saved : defaultTasks;
  });

  useEffect(() => {
    saveJson('reduce_fx', reduceFx);
    if (stateRef.current) stateRef.current.reduceFx = reduceFx;
  }, [reduceFx]);

  useEffect(() => {
    saveJson('audio_muted', audioSettings.muted);
    saveNumber('audio_volume', audioSettings.volume);
    audioSettingsRef.current = audioSettings;
    // Update ambient volume when settings change
    updateAmbient(audioSettings);
  }, [audioSettings]);

  // Persist theme selection and update ref
  useEffect(() => {
    saveString('theme_id', themeId);
    themeRef.current = getTheme(themeId);

    // Update animator theme when theme changes
    if (stateRef.current?.zenoAnimator) {
      stateRef.current.zenoAnimator.setTheme(themeId === 'noir' ? 'noir' : 'flipbook');
    }
  }, [themeId]);

  // Keep daily stats fresh (date rollover)
  useEffect(() => {
    const today = todayLocalISODate();
    if (dailyStats.date !== today) {
      const next = loadDailyStats();
      setDailyStats(next);
    }
  }, [dailyStats.date]);

  // Format score with Zeno-adaptive decimals (more precision closer to edge)
  const formatScore = (score: number) => {
    const intPart = Math.floor(score);
    const precision = getZenoPrecision(score);
    const decPart = (score - intPart).toFixed(precision).substring(2); // Get decimals without "0."
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

  // Mobile UX: Haptic feedback helper (uses haptics module with user preferences)
  const triggerHaptic = useCallback((pattern: number | number[] = 10) => {
    if (!getHapticsEnabled() || !hasHapticSupport()) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Vibration not supported or blocked
    }
  }, []);

  // Haptics toggle handler
  const toggleHaptics = useCallback(() => {
    const newValue = !hapticsEnabled;
    setHapticsEnabled(newValue);
    setHapticsEnabledState(newValue);
    // Give feedback on toggle
    if (newValue && hasHapticSupport()) {
      navigator.vibrate(30);
    }
  }, [hapticsEnabled]);

  // iOS Audio: Retry handler for blocked audio
  const handleAudioRetry = useCallback(async () => {
    const unlocked = await unlockAudioForIOS(audioRefs.current);
    setAudioContextState(getAudioState(audioRefs.current));
    if (unlocked) {
      setShowAudioWarning(false);
      // Play a test tone to confirm audio is working
      playTone(audioRefs.current, audioSettingsRef.current, 440, 0.1, 'sine', 0.05);
      // Start ambient sound
      startAmbient(audioRefs.current, audioSettingsRef.current);
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

  // Claim daily task reward
  const handleClaimTask = useCallback((taskId: string) => {
    if (stateRef.current) {
      const success = claimDailyTask(stateRef.current, taskId, { setThrowState });
      if (success) {
        setDailyTasks({ ...stateRef.current.dailyTasks });
      }
    }
  }, []);

  // Mobile UX: Detect if user is on mobile
  const isMobileRef = useRef(
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );

  useEffect(() => {
    console.log('[Game] useEffect running');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('[Game] No canvas ref');
      return;
    }

    const inputPad = inputPadRef.current;
    if (!inputPad) {
      console.log('[Game] No inputPad ref');
      return;
    }

    const extraInputPad = extraInputPadRef.current; // May be null, that's ok

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('[Game] No canvas context');
      return;
    }

    console.log('[Game] Canvas ready, initializing state');
    ctx.imageSmoothingEnabled = false;
    stateRef.current = initState();

    // Preload sprite sheets, background assets, audio files, and initialize animator
    const loadAssets = async () => {
      try {
        // Load sprites and backgrounds in parallel
        await Promise.all([
          assetLoader.preloadAll(Object.values(SPRITE_SHEETS)),
          backgroundRenderer.preload(),
          noirBackgroundRenderer.preload(),
        ]);
        console.log('[Game] Sprite sheets and backgrounds loaded');

        // Load audio files (non-blocking, will fallback to synth if fails)
        loadAudioFiles(audioRefs.current).then((loaded) => {
          console.log('[Game] Audio files loaded:', loaded);
          // Start ambient sound if audio is already unlocked
          if (loaded && audioRefs.current.unlocked) {
            startAmbient(audioRefs.current, audioSettingsRef.current);
          }
        }).catch((err) => {
          console.warn('[Game] Audio files failed to load, using synth fallback:', err);
        });

        // Load ring sprites (non-blocking, will fallback to procedural if fails)
        loadRingSprites().then(() => {
          console.log('[Game] Ring sprites loaded');
        }).catch((err) => {
          console.warn('[Game] Ring sprites failed to load, using procedural fallback:', err);
        });

        // Create animator based on current theme
        const theme = themeId === 'noir' ? 'noir' : 'flipbook';
        const animator = new Animator(theme);

        if (animator.initialize()) {
          animator.play('idle');
          if (stateRef.current) {
            stateRef.current.zenoAnimator = animator;
          }
          console.log('[Game] Animator initialized for theme:', theme);
        }
        setSpritesLoaded(true);
      } catch (error) {
        console.warn('[Game] Asset loading failed, using procedural fallback:', error);
        setSpritesLoaded(true); // Still mark as "loaded" since we fallback gracefully
      }
    };

    loadAssets();

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
      setThrowState,
      setPracticeMode,
      setDailyTasks,
    };

    const audio: GameAudio = {
      startCharge: () => startChargeToneHybrid(audioRefs.current, audioSettingsRef.current),
      updateCharge: (p) => updateChargeToneHybrid(audioRefs.current, audioSettingsRef.current, p),
      stopCharge: () => stopChargeToneHybrid(audioRefs.current),
      whoosh: () => playWhooshHybrid(audioRefs.current, audioSettingsRef.current),
      impact: (i) => playImpactHybrid(audioRefs.current, audioSettingsRef.current, i),
      edgeWarning: (p) => updateEdgeWarning(audioRefs.current, audioSettingsRef.current, p),
      stopEdgeWarning: () => stopEdgeWarning(audioRefs.current),
      tone: (freq, dur, type = 'square', vol = 0.1) => playTone(audioRefs.current, audioSettingsRef.current, freq, dur, type, vol),
      zenoJingle: () => playZenoJingle(),
      heartbeat: (i) => playHeartbeat(audioRefs.current, audioSettingsRef.current, i),
      recordBreak: () => playRecordBreakHybrid(audioRefs.current, audioSettingsRef.current),
      failureSound: (type) => playFailureSoundHybrid(audioRefs.current, audioSettingsRef.current, type),
      wilhelmScream: () => playWilhelmScream(audioRefs.current, audioSettingsRef.current),
      // New file-based sounds
      startFly: () => startFly(audioRefs.current, audioSettingsRef.current),
      stopFly: () => stopFly(),
      slide: () => playSlide(audioRefs.current, audioSettingsRef.current),
      stopSlide: () => stopSlide(),
      win: () => playWin(audioRefs.current, audioSettingsRef.current),
      // Precision control sounds
      airBrakeTap: () => playAirBrakeTap(audioRefs.current, audioSettingsRef.current),
      airBrakeHold: () => playAirBrakeHold(audioRefs.current, audioSettingsRef.current),
      slideExtend: () => playSlideExtend(audioRefs.current, audioSettingsRef.current),
      slideBrake: () => playSlideBrake(audioRefs.current, audioSettingsRef.current),
      staminaLow: () => playStaminaLow(audioRefs.current, audioSettingsRef.current),
      actionDenied: () => playActionDenied(audioRefs.current, audioSettingsRef.current),
      // Precision bar sounds
      precisionDrone: () => startPrecisionDrone(audioRefs.current, audioSettingsRef.current),
      stopPrecisionDrone: () => stopPrecisionDrone(),
      pbDing: () => playPbDing(audioRefs.current, audioSettingsRef.current),
      newRecordJingle: () => playNewRecord(audioRefs.current, audioSettingsRef.current),
      closeCall: () => playCloseCall(audioRefs.current, audioSettingsRef.current),
      // Ring sounds (with stereo pan based on ring X position)
      ringCollect: (ringIndex: number, ringX?: number) => playRingCollect(audioRefs.current, audioSettingsRef.current, ringIndex, ringX),
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
      // Sync combined multiplier for HUD
      const combined = s.currentMultiplier * s.ringMultiplier;
      setCombinedMultiplier(combined);
      // Sync tutorial state
      setTutorialPhase(s.tutorialState.phase);
      setTutorialActive(s.tutorialState.active);
      setTutorialTimeRemaining(s.tutorialState.timeRemaining);
    };

    const hudInterval = window.setInterval(syncHud, 120);

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        pressedRef.current = true;
        // Unlock audio on first gesture (iOS compatible)
        const wasUnlocked = audioRefs.current.unlocked;
        await unlockAudioForIOS(audioRefs.current);
        // Start ambient on first unlock
        if (!wasUnlocked && audioRefs.current.unlocked) {
          startAmbient(audioRefs.current, audioSettingsRef.current);
        }
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
      const wasUnlocked = audioRefs.current.unlocked;
      const unlocked = await unlockAudioForIOS(audioRefs.current);
      const state = getAudioState(audioRefs.current);
      setAudioContextState(state);

      // Start ambient on first successful unlock
      if (!wasUnlocked && unlocked) {
        startAmbient(audioRefs.current, audioSettingsRef.current);
      }

      // Show warning on iOS if audio isn't running after unlock attempt
      if (!unlocked && e.pointerType === 'touch' && !audioSettingsRef.current.muted) {
        setShowAudioWarning(true);
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
          stopChargeToneHybrid(audioRefs.current);
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

    console.log('[Game] Starting game loop, state:', !!stateRef.current, 'ctx:', !!ctx);

    const loop = () => {
      const state = stateRef.current;
      if (state) {
        try {
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
          // Pass devicePixelRatio for high-res rendering
          if (!errorRef.current) {
            renderFrame(ctx, state, currentTheme, now, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
          }
        } catch (err: any) {
          // Derive phase from existing state properties for error context
          const derivedPhase = state.flying ? 'flying' : state.sliding ? 'sliding' : state.charging ? 'charging' : 'idle';
          captureError(err, {
            phase: derivedPhase,
            px: state.px,
            py: state.py,
            flying: state.flying,
          });
          errorRef.current = err.message;
          // Render error to canvas for debugging
          ctx.save();
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#f00';
          ctx.font = '16px monospace';
          ctx.fillText('CRASH: ' + err.message.slice(0, 40), 10, 30);
          ctx.fillText(err.message.slice(40, 80), 10, 50);
          ctx.restore();
        }
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
      stopChargeToneHybrid(audioRefs.current);
      stopEdgeWarning(audioRefs.current);
    };
  }, [initState, playZenoJingle, triggerHaptic, handleNewPersonalBest, isLoading]);

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
          <img src={assetPath('/assets/icons/logo.png')} alt="one more flick." className="h-8" />
          <div className="flex items-center gap-2">
            {/* Precision control tips - hand-drawn */}
            <img
              src={UI_ASSETS.directions}
              alt="Controls: TAP FLOAT | HOLD BRAKE"
              className="h-12 object-contain"
              style={{ filter: themeId === 'noir' ? 'invert(1)' : 'none' }}
            />
            {profile && (
              <span className="text-xs font-mono" style={{ color: theme.highlight }}>
                {profile.nickname}
              </span>
            )}
          </div>
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
              width={W * (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)}
              height={H * (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)}
              className="game-canvas cursor-pointer touch-none select-none"
              style={{
                boxShadow: themeId === 'noir'
                  ? '0 2px 8px rgba(0,0,0,0.4)'
                  : '2px 3px 8px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(0,0,0,0.05)',
                border: themeId === 'noir'
                  ? `1.5px solid ${theme.accent3}`  // Noir: thin, stark contrast
                  : `2.5px solid ${theme.accent3}`, // Flipbook: thicker, warmer
                borderRadius: themeId === 'noir' ? '1px' : '3px',
                width: '100%',
                maxWidth: isMobileRef.current ? '520px' : '480px',
                aspectRatio: `${W} / ${H}`,
                // Auto image rendering for smooth ink (Noir) AND smooth pencil (Flipbook)
                imageRendering: 'auto',
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

          {/* Tutorial overlay */}
          <TutorialOverlay

            phase={tutorialPhase}
            active={tutorialActive}
            timeRemaining={tutorialTimeRemaining}
          />
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
            <div className="w-full max-w-md flex items-center justify-center gap-3 text-xs px-2" style={{ color: theme.uiText }}>
              {/* Left: Tutorial + Sound */}
              <div className="flex items-center gap-1">
                <button
                  className={buttonClass}
                  style={{
                    ...buttonStyle,
                    padding: '2px 4px',
                  }}
                  onClick={() => {
                    resetTutorialProgress();
                    if (stateRef.current) {
                      stateRef.current.tutorialState.hasSeenCharge = false;
                      stateRef.current.tutorialState.hasSeenAir = false;
                      stateRef.current.tutorialState.hasSeenSlide = false;
                    }
                  }}
                  aria-label="Replay tutorial"
                  title="Replay tutorial"
                >
                  <img
                    src={UI_ASSETS.helpIcon}
                    alt="Help"
                    className="h-8 object-contain"
                    style={{ filter: themeId === 'noir' ? 'invert(1)' : 'none' }}
                  />
                </button>
                <button
                  className={buttonClass}
                  style={{
                    ...buttonStyle,
                    padding: '4px',
                    // Highlight if audio is blocked
                    borderColor: audioContextState === 'suspended' && !audioSettings.muted
                      ? theme.danger
                      : buttonStyle.borderColor,
                  }}
                  onClick={async () => {
                    ensureAudioContext(audioRefs.current);
                    await resumeIfSuspended(audioRefs.current);
                    setAudioContextState(getAudioState(audioRefs.current));
                    setAudioSettings((s) => ({ ...s, muted: !s.muted }));
                    setShowAudioWarning(false);
                  }}
                  aria-label="Toggle sound"
                >
                  <img
                    src={audioSettings.muted ? UI_ASSETS.volumeOff : UI_ASSETS.volumeOn}
                    alt={audioSettings.muted ? 'Sound off' : 'Sound on'}
                    className="w-6 h-6"
                    style={{ filter: themeId === 'noir' ? 'invert(1)' : 'none' }}
                  />
                </button>
                {/* Haptics toggle - only show if device supports haptics */}
                {hasHapticSupport() && (
                  <button
                    className={buttonClass}
                    style={{
                      ...buttonStyle,
                      padding: '4px 6px',
                      fontSize: '16px',
                    }}
                    onClick={toggleHaptics}
                    aria-label="Toggle haptic feedback"
                    title={hapticsEnabled ? 'Haptics on' : 'Haptics off'}
                  >
                    {hapticsEnabled ? '📳' : '📴'}
                  </button>
                )}
              </div>

              {/* Center: Leaderboard */}
              <button
                className={buttonClass}
                style={{
                  ...buttonStyle,
                  padding: '2px 4px',
                  borderColor: theme.highlight,
                }}
                onClick={() => setShowLeaderboard(true)}
                aria-label="View leaderboard"
              >
                <img
                  src={UI_ASSETS.leaderboard}
                  alt="Leaderboard"
                  className="h-8 object-contain"
                  style={{ filter: themeId === 'noir' ? 'invert(1)' : 'none' }}
                />
              </button>

              {/* Right: Stats */}
              <button
                className={buttonClass}
                style={{
                  ...buttonStyle,
                  padding: '2px 4px',
                }}
                onClick={() => setShowStats(true)}
                aria-label="View stats"
              >
                <img
                  src={UI_ASSETS.statsLabel}
                  alt="Stats"
                  className="h-8 object-contain"
                  style={{ filter: themeId === 'noir' ? 'invert(1)' : 'none' }}
                />
              </button>
            </div>
          );
        })()}

        {/* Hero row: LAST, LV, TARGET - primary focus */}
        <div className="w-full max-w-md flex justify-center items-start gap-6 text-center">
          <div className="flex flex-col items-center min-w-[80px]">
            <img
              src={UI_ASSETS.lastLabel}
              alt="Last"
              className="h-5 object-contain"
              style={{ filter: themeId === 'noir' ? 'invert(1)' : 'none' }}
            />
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
            <p className="text-xs font-mono h-4" style={{ color: theme.accent2, opacity: lastDist !== null && !fellOff ? 0.8 : 0 }}>
              x{lastMultiplier.toFixed(1)}
            </p>
          </div>
          <div className="flex flex-col items-center min-w-[50px]">
            <img
              src={UI_ASSETS.lvLabel}
              alt="Level"
              className="h-5 object-contain"
              style={{ filter: themeId === 'noir' ? 'invert(1)' : 'none' }}
            />
            <p className="text-2xl font-bold font-mono" style={{ color: theme.highlight }}>{zenoLevel}</p>
            <p className="text-xs h-4">&nbsp;</p>
          </div>
          <div className="flex flex-col items-center min-w-[80px]">
            <img
              src={UI_ASSETS.targetLabel}
              alt="Target"
              className="h-5 object-contain"
              style={{ filter: themeId === 'noir' ? 'invert(1)' : 'none' }}
            />
            <p className="text-2xl font-bold font-mono" style={{ color: theme.accent2 }}>
              {formatScore(zenoTarget).int}<span className="text-sm opacity-60">.{formatScore(zenoTarget).dec}</span>
            </p>
            <p className="text-xs h-4">&nbsp;</p>
          </div>
        </div>

        {/* Secondary row: SCORE, BEST */}
        <div className="w-full max-w-md flex justify-center gap-6 text-center">
          <div className="flex flex-col items-center">
            <img
              src={UI_ASSETS.scoreLabel}
              alt="Score"
              className="h-4 object-contain"
              style={{ filter: themeId === 'noir' ? 'invert(1)' : 'none' }}
            />
            <p className="text-base font-bold font-mono" style={{ color: theme.accent4 }}>{Math.floor(totalScore).toLocaleString()}</p>
          </div>
          <div className="flex flex-col items-center">
            <img
              src={UI_ASSETS.bestLabel}
              alt="Best"
              className="h-4 object-contain"
              style={{ filter: themeId === 'noir' ? 'invert(1)' : 'none' }}
            />
            <p className="text-base font-bold font-mono" style={{ color: theme.accent2 }}>
              {formatScore(bestScore).int}<span className="text-xs opacity-60">.{formatScore(bestScore).dec}</span>
            </p>
          </div>
        </div>

        {/* Throw Counter Row */}
        <div className="flex justify-center mt-1">
          <ThrowCounter
            throwState={throwState}
            practiceMode={practiceMode}
            onShopClick={() => {/* TODO: Open shop modal */}}
          />
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
        {newAchievement && (() => {
          const achievementName = newAchievement.split(' (+')[0];
          const achievement = Object.values(ACHIEVEMENTS).find(a => a.name === achievementName);
          return (
            <div
              className="fixed top-16 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg z-50 animate-in slide-in-from-top-4 duration-300"
              style={{
                backgroundColor: '#1e3a5f',
                border: '3px solid #F5A623',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 15px rgba(245,166,35,0.4)',
              }}
            >
              <p className="text-base font-bold text-center" style={{ color: '#2563eb' }}>
                ★ {newAchievement}
              </p>
              {achievement && (
                <p className="text-sm text-center mt-1" style={{ color: '#f08c1d' }}>
                  {achievement.desc}
                </p>
              )}
            </div>
          );
        })()}

        {/* Practice Mode Overlay */}
        <PracticeModeOverlay
          visible={practiceMode && !hudFlying}
          regenTime={formatRegenTime(getMsUntilNextThrow(throwState))}
          onBuyThrows={() => {/* TODO: Open shop modal */}}
        />

        {/* Multiplier Ladder HUD */}
        <MultiplierLadder
          currentMultiplier={combinedMultiplier}
          isFlying={hudFlying}
          reduceFx={reduceFx}
        />

        {/* Stats overlay */}
        {showStats && (
          <StatsOverlay
            theme={theme}
            onClose={() => setShowStats(false)}
            dailyTasks={dailyTasks}
            onClaimTask={handleClaimTask}
          />
        )}

        {/* Leaderboard screen */}
        {showLeaderboard && (
          <LeaderboardScreen theme={theme} onClose={() => setShowLeaderboard(false)} />
        )}

        {/* Onboarding modal for first-time users */}
        {needsOnboarding && (
          <NicknameModal theme={theme} onComplete={completeOnboarding} onSkip={skipOnboarding} />
        )}

        {/* iOS Audio Warning Toast - positioned as fixed overlay */}
        <AudioWarningToast
          show={showAudioWarning}
          theme={theme}
          onDismiss={() => setShowAudioWarning(false)}
          onRetry={handleAudioRetry}
        />
      </div>
    </div>
  );
};

export default Game;
