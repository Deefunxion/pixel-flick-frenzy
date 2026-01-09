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
import { LeaderboardScreen } from './LeaderboardScreen';
import { loadDailyChallenge, type DailyChallenge } from '@/game/dailyChallenge';
import { syncScoreToFirebase } from '@/firebase/scoreSync';

const Game = () => {
  const { firebaseUser, profile, isLoading, needsOnboarding, completeOnboarding } = useUser();

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