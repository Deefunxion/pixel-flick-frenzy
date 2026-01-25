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
import { getTheme, DEFAULT_THEME_ID, type ThemeId } from '@/game/themes';
import { useUser } from '@/contexts/UserContext';
import { NicknameModal } from './NicknameModal';
import { ThrowScore } from './ThrowScore';
import { LandingGrade } from './LandingGrade';
import { calculateGrade, type GradeResult } from '@/game/engine/gradeSystem';
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
  playAirBrakeTap,
  playAirBrakeHold,
  playSlideExtend,
  playSlideBrake,
  playStaminaLow,
  playActionDenied,
  startAmbient,
  updateAmbient,
  startPrecisionDrone,
  stopPrecisionDrone,
  playPbDing,
  playNewRecord,
  playCloseCall,
  playPaperFlip,
  playPaperSettle,
  playRingCollect,
  playFailImpact,
  playGradeSound,
  playStreakBreakSound,
  playSweetSpotClick,
  startTensionDrone,
  updateTensionDrone,
  stopTensionDrone,
  type AudioRefs,
  type AudioSettings,
  type AudioState,
} from '@/game/audio';
import { AudioWarningToast } from './game/AudioWarningToast';
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
import { bufferInput, isBuffering } from '@/game/engine/inputBuffer';
import { backgroundRenderer } from '@/game/engine/backgroundRenderer';
import { noirBackgroundRenderer } from '@/game/engine/noirBackgroundRenderer';
import { UI_ASSETS } from '@/game/engine/uiAssets';
import { renderPageFlip } from '@/game/engine/pageFlipRender';
import { StatsOverlay } from './StatsOverlay';
import { LeaderboardScreen } from './LeaderboardScreen';
import { TutorialOverlay } from './TutorialOverlay';
// NearMissOverlay removed - feedback consolidated in LandingGrade
import { StreakCounter } from './StreakCounter';
import { StreakBreak } from './StreakBreak';
import { MiniGoalHUD } from './MiniGoalHUD';
import { ToastQueue, useToastQueue } from './ToastQueue';
// ThrowCounter removed - throw info displayed on canvas
import { PracticeModeOverlay } from './PracticeModeOverlay';
import { SlideOutMenu } from './SlideOutMenu';
import { RotateScreen } from './RotateScreen';
import { LevelEditor } from './LevelEditor';
import { ArcadeHUD } from './ArcadeHUD';
import { loadArcadeLevel } from '@/game/engine/state';
import {
  createDoodlesFromLevel,
  createSpringsFromLevel,
  createPortalFromPair,
  getLevel,
  checkStarObjectives,
  isLevelPassed,
  recordStars,
  advanceLevel,
} from '@/game/engine/arcade';
import { useIsPortrait } from '@/hooks/useIsPortrait';
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
import { claimAchievement, getUnclaimedCount } from '@/game/engine/achievementClaim';
import { getClosestGoal } from '@/game/engine/achievementProgress';
import { FIREBASE_ENABLED } from '@/firebase/flags';
import { captureError } from '@/lib/sentry';

const Game = () => {
  const { firebaseUser, profile, isLoading, needsOnboarding, completeOnboarding, skipOnboarding } = useUser();
  console.log('[Game] Render, isLoading:', isLoading, 'needsOnboarding:', needsOnboarding);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputPadRef = useRef<HTMLDivElement>(null);
  const extraInputPadRef = useRef<HTMLDivElement>(null); // Extra touch area below stats
  const stateRef = useRef<GameState | null>(null);
  const pressedRef = useRef(false);
  const audioRefs = useRef<AudioRefs>({ ctx: null, chargeOsc: null, chargeGain: null, edgeOsc: null, edgeGain: null, tensionOsc: null, tensionGain: null, unlocked: false, stateChangeHandler: null });
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
    return loadJson('stats', {
      totalThrows: 0,
      successfulLandings: 0,
      totalDistance: 0,
      perfectLandings: 0,
      maxMultiplier: 1,
      totalRingsPassed: 0,
      maxRingsInThrow: 0,
      perfectRingThrows: 0,
    }, 'omf_stats');
  });
  const [achievements, setAchievements] = useState<Set<string>>(() => {
    return loadStringSet('achievements', 'omf_achievements');
  });
  const [newAchievement, setNewAchievement] = useState<string | null>(null);
  const [showMobileHint, setShowMobileHint] = useState(true);
  const [spritesLoaded, setSpritesLoaded] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  // Arcade HUD state (synced from stateRef)
  const [arcadeHudState, setArcadeHudState] = useState<{
    arcadeState: import('@/game/engine/arcade/types').ArcadeState | null;
    doodlesCollected: number;
    totalDoodles: number;
    inOrderSoFar: boolean;
  }>({ arcadeState: null, doodlesCollected: 0, totalDoodles: 0, inOrderSoFar: true });
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
  const [ringMultiplier, setRingMultiplier] = useState(1.0);
  const [ringsCollected, setRingsCollected] = useState(0);
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

  // Landing grade state
  const [showGrade, setShowGrade] = useState(false);
  const [lastGradeResult, setLastGradeResult] = useState<GradeResult | null>(null);

  // Near-miss overlay state
  const [nearMissState, setNearMissState] = useState<{
    visible: boolean;
    distance: number;
    intensity: 'extreme' | 'close' | 'near';
  } | null>(null);

  // Streak break feedback state
  const [streakBreakState, setStreakBreakState] = useState<{
    visible: boolean;
    lostStreak: number;
  }>({ visible: false, lostStreak: 0 });
  const prevHotStreakRef = useRef(0);

  // Mini goal HUD state
  const [miniGoal, setMiniGoal] = useState<{
    text: string;
    progress: number;
    current: number;
    target: number;
  } | null>(null);

  // Toast queue for progress notifications
  const { toasts, addToast, dismissToast } = useToastQueue();

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

  // Milestones claimed state (for achievement rewards)
  const [milestonesClaimed, setMilestonesClaimed] = useState<MilestonesClaimed>(() =>
    loadJson<MilestonesClaimed>('milestones_claimed', {
      achievements: [],
      milestones: [],
      newPlayerBonus: false,
    })
  );

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

  // Claim achievement reward
  const handleClaimAchievement = useCallback((achievementId: string) => {
    if (stateRef.current) {
      const success = claimAchievement(stateRef.current, achievementId, { setThrowState });
      if (success) {
        setMilestonesClaimed({ ...stateRef.current.milestonesClaimed });
      }
    }
  }, []);

  // Handle landing - calculate and display grade
  const handleLanding = useCallback((
    landingX: number,
    targetX: number,
    ringsPassedThisThrow: number,
    landingVelocity: number,
    fellOff: boolean
  ) => {
    const gradeResult = calculateGrade(
      landingX,
      targetX,
      ringsPassedThisThrow,
      landingVelocity,
      fellOff
    );
    setLastGradeResult(gradeResult);
    setShowGrade(true);
    // Play grade-specific sound
    playGradeSound(audioRefs.current, audioSettingsRef.current, gradeResult.grade);

    // Arcade mode: Check stars after landing
    const state = stateRef.current;
    if (state?.arcadeMode && state.arcadeState && !fellOff) {
      const level = getLevel(state.arcadeState.currentLevelId);
      if (level) {
        const stars = checkStarObjectives(state.arcadeState, level, landingX);
        if (isLevelPassed(stars)) {
          recordStars(state.arcadeState, level.id, stars);
          // Advance to next level after page flip completes
          setTimeout(() => {
            if (state.arcadeState && state.arcadeState.currentLevelId < 10) {
              advanceLevel(state.arcadeState);
              loadArcadeLevel(state, state.arcadeState.currentLevelId);
            }
          }, 500); // After page flip animation
        }
      }
    }
  }, []);

  // Mobile UX: Detect if user is on mobile
  const isMobileRef = useRef(
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );

  // Portrait detection for horizontal-only mode
  const isPortrait = useIsPortrait();

  useEffect(() => {
    console.log('[Game] useEffect running');

    // Don't run game loop when in portrait mode on mobile - canvas won't exist
    if (isPortrait && isMobileRef.current) {
      console.log('[Game] Portrait mode, skipping game loop');
      return;
    }

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
      setHotStreak: (current, best) => {
        // Detect streak loss
        if (current === 0 && prevHotStreakRef.current >= 2) {
          // Streak was lost!
          const lostStreak = prevHotStreakRef.current;
          setStreakBreakState({ visible: true, lostStreak });
          playStreakBreakSound(audioRefs.current, audioSettingsRef.current);
          // Auto-hide after 2 seconds
          setTimeout(() => setStreakBreakState({ visible: false, lostStreak: 0 }), 2000);
        }
        prevHotStreakRef.current = current;
        setHotStreakState({ current, best });
      },
      onNewPersonalBest: handleNewPersonalBest,
      onFall: handleFall,
      onLanding: handleLanding,
      onChargeStart: () => setShowGrade(false), // Dismiss grade immediately on new throw
      onPbPassed: () => addToast('NEW PERSONAL BEST!', 'complete', 'high'),
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
      // Page flip sounds
      playPaperFlip: () => playPaperFlip(audioRefs.current, audioSettingsRef.current),
      playPaperSettle: () => playPaperSettle(audioRefs.current, audioSettingsRef.current),
      // Ring sounds (with stereo pan based on ring X position)
      ringCollect: (ringIndex: number, ringX?: number) => playRingCollect(audioRefs.current, audioSettingsRef.current, ringIndex, ringX),
      // Fail juice
      failImpact: () => playFailImpact(audioRefs.current, audioSettingsRef.current),
      // Charge sweet spot
      sweetSpotClick: () => playSweetSpotClick(audioRefs.current, audioSettingsRef.current),
      // Charge tension audio
      startTensionDrone: () => startTensionDrone(audioRefs.current, audioSettingsRef.current),
      updateTensionDrone: (power01: number) => updateTensionDrone(audioRefs.current, audioSettingsRef.current, power01),
      stopTensionDrone: () => stopTensionDrone(audioRefs.current),
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
      // Sync ring multiplier and count for HUD
      setRingMultiplier(s.ringMultiplier);
      setRingsCollected(s.ringsPassedThisThrow);
      // Sync tutorial state
      setTutorialPhase(s.tutorialState.phase);
      setTutorialActive(s.tutorialState.active);
      setTutorialTimeRemaining(s.tutorialState.timeRemaining);
      // Sync near-miss state
      if (s.nearMissActive && s.nearMissIntensity) {
        setNearMissState({
          visible: true,
          distance: s.nearMissDistance,
          intensity: s.nearMissIntensity,
        });
      } else if (!s.nearMissActive) {
        setNearMissState(null);
      }
      // Update mini goal HUD
      const goal = getClosestGoal(stats, s, achievements);
      setMiniGoal(goal);
      // Sync arcade HUD state
      if (s.arcadeMode && s.arcadeState) {
        setArcadeHudState({
          arcadeState: s.arcadeState,
          doodlesCollected: s.arcadeDoodles.filter(d => d.collected).length,
          totalDoodles: s.arcadeDoodles.length,
          inOrderSoFar: s.arcadeState.streakCount === s.arcadeState.doodlesCollected.length,
        });
      }
    };

    const hudInterval = window.setInterval(syncHud, 120);

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Dev mode: Ctrl+E toggles level editor
      if (import.meta.env.DEV && e.ctrlKey && (e.key === 'e' || e.key === 'E' || e.code === 'KeyE')) {
        e.preventDefault();
        e.stopPropagation();
        setShowEditor(prev => !prev);
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        // Buffer input if we're in slow-mo/freeze
        if (isBuffering()) {
          bufferInput('press');
        }
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
        // Buffer input if we're in slow-mo/freeze
        if (isBuffering()) {
          bufferInput('release');
        }
        pressedRef.current = false;
      }
    };

    const handlePointerDown = async (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType !== 'touch') return;
      e.preventDefault();

      // Check if clicking hamburger menu area (circle at 18,18 with radius 20 for touch)
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = W / rect.width;
        const scaleY = H / rect.height;
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;

        // Hamburger hit area: circle at (18, 18) with radius 20 (slightly larger for touch)
        const hamburgerX = 18;
        const hamburgerY = 18;
        const hamburgerRadius = 20;
        const dx = canvasX - hamburgerX;
        const dy = canvasY - hamburgerY;
        if (dx * dx + dy * dy < hamburgerRadius * hamburgerRadius) {
          setMenuOpen(true);
          return; // Don't start charging
        }
      }

      // Buffer input if we're in slow-mo/freeze
      if (isBuffering()) {
        bufferInput('press', { x: e.clientX, y: e.clientY });
      }

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
      // Drag up -> higher angle (0.4 = high sensitivity)
      const nextAngle = angleStartRef.current + (-dy * 0.4);
      s.angle = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, nextAngle));
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (pointerIdRef.current != null && e.pointerId === pointerIdRef.current) {
        pointerIdRef.current = null;
      }

      // Buffer input if we're in slow-mo/freeze
      if (isBuffering()) {
        bufferInput('release');
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
            canvas: canvasRef.current!,
          });
          // Pass devicePixelRatio for high-res rendering
          if (!errorRef.current) {
            // Check if page flip transition should consume the frame
            const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
            const pageFlipConsumed = renderPageFlip(
              ctx,
              state,
              currentTheme,
              now,
              dpr,
              () => {
                // Page flip complete callback - reset physics
                resetPhysics(state);
                audio.playPaperSettle?.();
              }
            );

            // Only render normal game frame if page flip didn't consume it
            if (!pageFlipConsumed) {
              renderFrame(ctx, state, currentTheme, now, dpr);
            }
          }
        } catch (err: unknown) {
          const error = err as Error;
          // Derive phase from existing state properties for error context
          const derivedPhase = state.flying ? 'flying' : state.sliding ? 'sliding' : state.charging ? 'charging' : 'idle';
          captureError(error, {
            phase: derivedPhase,
            px: state.px,
            py: state.py,
            flying: state.flying,
          });
          errorRef.current = error.message;
          // Render error to canvas for debugging
          ctx.save();
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#f00';
          ctx.font = '16px monospace';
          ctx.fillText('CRASH: ' + error.message.slice(0, 40), 10, 30);
          ctx.fillText(error.message.slice(40, 80), 10, 50);
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
  }, [initState, playZenoJingle, triggerHaptic, handleNewPersonalBest, isLoading, isPortrait]);

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

  // Show rotate screen for mobile portrait visitors
  if (isPortrait && isMobileRef.current) {
    return <RotateScreen />;
  }

  return (
    <div
      className="w-full h-[100svh] flex items-center justify-center"
      style={{ background: `linear-gradient(180deg, ${theme.background} 0%, ${theme.horizon} 100%)` }}
    >
      <div
        className={`w-full max-w-md flex flex-col items-center ${isMobileRef.current ? 'gap-1 p-1' : 'gap-2 p-2'}`}
      >
        {/* Slide-out Menu - Only for landscape mode */}
        <SlideOutMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          theme={theme}
          themeId={themeId}
          lastDist={lastDist}
          best={bestScore}
          zenoTarget={zenoTarget}
          zenoLevel={zenoLevel}
          totalScore={totalScore}
          onOpenStats={() => setShowStats(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onToggleSound={async () => {
            ensureAudioContext(audioRefs.current);
            await resumeIfSuspended(audioRefs.current);
            setAudioContextState(getAudioState(audioRefs.current));
            setAudioSettings((s) => ({ ...s, muted: !s.muted }));
          }}
          onReplayTutorial={() => {
            resetTutorialProgress();
            if (stateRef.current) {
              stateRef.current.tutorialState.hasSeenCharge = false;
              stateRef.current.tutorialState.hasSeenAir = false;
              stateRef.current.tutorialState.hasSeenSlide = false;
            }
          }}
          isMuted={audioSettings.muted}
          throwState={throwState}
          arcadeState={arcadeHudState.arcadeState}
          onSelectLevel={(levelId) => {
            const state = stateRef.current;
            if (state) {
              loadArcadeLevel(state, levelId);
            }
          }}
        />

        {/* Header removed - horizontal-only full screen mode */}

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
                  ? `1.5px solid ${theme.accent3}`
                  : `2.5px solid ${theme.accent3}`,
                borderRadius: themeId === 'noir' ? '1px' : '3px',
                imageRendering: 'auto',
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

          {/* Game HUD Overlays - positioned relative to canvas */}
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {/* Throw Score HUD */}
            <ThrowScore
              distance={hudPx}
              ringMultiplier={ringMultiplier}
              ringsCollected={ringsCollected}
              isFlying={hudFlying}
            />

            {/* Arcade HUD */}
            {arcadeHudState.arcadeState && (
              <ArcadeHUD
                arcadeState={arcadeHudState.arcadeState}
                currentDistance={hudPx}
                doodlesCollected={arcadeHudState.doodlesCollected}
                totalDoodles={arcadeHudState.totalDoodles}
                inOrderSoFar={arcadeHudState.inOrderSoFar}
              />
            )}

            {/* Landing Grade */}
            <LandingGrade
              result={lastGradeResult}
              visible={showGrade}
              onDismiss={() => setShowGrade(false)}
            />

            {/* Streak Counter HUD */}
            <StreakCounter
              streak={hotStreak.current}
              bestStreak={hotStreak.best}
              visible={hotStreak.current >= 1}
            />

            {/* Streak Break Feedback */}
            <StreakBreak
              lostStreak={streakBreakState.lostStreak}
              visible={streakBreakState.visible}
            />

            {/* Mini Goal HUD */}
            {miniGoal && (
              <MiniGoalHUD
                goalText={miniGoal.text}
                progress={miniGoal.progress}
                current={miniGoal.current}
                target={miniGoal.target}
                visible={true}
              />
            )}
          </div>
        </div>


        {/* Settings row removed - buttons moved to hamburger menu */}

        {/* External UI removed - all info now displayed on canvas */}

        {/* Achievement popup - fully transparent, stacked cascade */}
        {newAchievement && (() => {
          const parts = newAchievement.split(' - ');
          const achievementName = parts[0];
          const achievement = Object.values(ACHIEVEMENTS).find(a => a.name === achievementName);
          const hasMore = newAchievement.includes('+');

          return (
            <div
              key={newAchievement} // Force re-mount for animation
              className="fixed top-16 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg z-50
                         animate-in slide-in-from-bottom-4 fade-in duration-300"
              style={{
                backgroundColor: 'transparent',
                border: `2px solid ${theme.highlight}`,
                // NO backdropFilter - fully transparent
              }}
            >
              <p className="text-base font-bold text-center" style={{ color: theme.highlight }}>
                🏆 {achievementName}
              </p>
              {achievement && (
                <p className="text-sm text-center mt-1" style={{ color: theme.accent2 }}>
                  {achievement.desc}
                </p>
              )}
              <p className="text-xs text-center mt-1 opacity-70" style={{ color: theme.uiText }}>
                Claim in Stats!
              </p>
              {hasMore && (
                <p className="text-xs text-center mt-2 animate-pulse" style={{ color: theme.accent1 }}>
                  {newAchievement.split('🏆')[1]}
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

        {/* Toast Queue */}
        <ToastQueue toasts={toasts} onDismiss={dismissToast} />

        {/* Stats overlay */}
        {showStats && (
          <StatsOverlay
            theme={theme}
            onClose={() => setShowStats(false)}
            dailyTasks={dailyTasks}
            onClaimTask={handleClaimTask}
            milestonesClaimed={milestonesClaimed}
            onClaimAchievement={handleClaimAchievement}
            achievements={achievements}
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

        {/* Level Editor (Dev Mode Only) */}
        {import.meta.env.DEV && showEditor && (
          <LevelEditor
            onClose={() => setShowEditor(false)}
            onTestLevel={(level) => {
              // Load custom level for testing
              const state = stateRef.current;
              if (state && state.arcadeState) {
                loadArcadeLevel(state, level.id);
                // Override with custom level data
                state.arcadeDoodles = createDoodlesFromLevel(level.doodles);
                state.arcadeSprings = createSpringsFromLevel(level.springs);
                state.arcadePortal = level.portal ? createPortalFromPair(level.portal) : null;
              }
              setShowEditor(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Game;
