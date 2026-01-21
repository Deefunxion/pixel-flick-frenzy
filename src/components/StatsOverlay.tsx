import { useState } from 'react';
import { loadJson } from '@/game/storage';
import { ACHIEVEMENTS } from '@/game/engine/achievements';
import { getClosestAchievements } from '@/game/engine/achievementProgress';
import { getPersonalLeaderboard, getCurrentPrecision, getMaxAtPrecision } from '@/game/leaderboard';
import { useUser } from '@/contexts/UserContext';
import type { DailyTasks, MilestonesClaimed, Stats } from '@/game/engine/types';
import type { Theme } from '@/game/themes';
import { FIREBASE_ENABLED } from '@/firebase/flags';
import { DailyTasksPanel } from './DailyTasksPanel';
import { AchievementsPanel } from './AchievementsPanel';

type StatsOverlayProps = {
  theme: Theme;
  onClose: () => void;
  dailyTasks: DailyTasks;
  onClaimTask: (taskId: string) => void;
  milestonesClaimed: MilestonesClaimed;
  onClaimAchievement: (achievementId: string) => void;
  achievements: Set<string>;  // Pass from Game.tsx to stay in sync with badge
};

type HistoryEntry = {
  date: string;
  bestDistance: number;
  throws: number;
  score: number;
};

export function StatsOverlay({ theme, onClose, dailyTasks, onClaimTask, milestonesClaimed, onClaimAchievement, achievements }: StatsOverlayProps) {
  const { profile, firebaseUser, refreshProfile } = useUser();
  const [stats] = useState<Stats>(() =>
    loadJson('stats', {
      totalThrows: 0,
      successfulLandings: 0,
      totalDistance: 0,
      perfectLandings: 0,
      maxMultiplier: 1,
      totalRingsPassed: 0,
      maxRingsInThrow: 0,
      perfectRingThrows: 0,
    }, 'omf_stats')
  );
  const [history] = useState<HistoryEntry[]>(() =>
    loadJson('history', [], 'omf_history')
  );
  const [leaderboard] = useState(() => getPersonalLeaderboard());
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const precision = getCurrentPrecision();
  const maxDistance = getMaxAtPrecision(precision);

  // Get closest achievements for guidance section
  const [closestAchievements] = useState(() => {
    // Minimal state reconstruction for progress calculation
    const savedState = {
      zenoLevel: Number(localStorage.getItem('omf_zeno_level') || '0'),
      best: Number(localStorage.getItem('omf_best') || '0'),
      totalScore: Number(localStorage.getItem('omf_total_score') || '0'),
      hotStreak: Number(localStorage.getItem('omf_best_hot_streak') || '0'),
      landingsWithoutFall: 0,  // Session-only, can't restore
      sessionThrows: 0,        // Session-only, can't restore
    };
    return getClosestAchievements(
      stats,
      savedState as any,  // Partial GameState is fine for progress calc
      achievements,
      3
    );
  });

  const handleLinkGoogle = async () => {
    if (!firebaseUser) return;

    if (!FIREBASE_ENABLED) {
      setLinkError('Cloud sync is disabled in the itch build.');
      return;
    }

    setIsLinking(true);
    setLinkError(null);

    try {
      const [{ linkGoogleAccount }, { syncAfterGoogleLink }] = await Promise.all([
        import('@/firebase/auth'),
        import('@/firebase/sync'),
      ]);
      const success = await linkGoogleAccount();
      if (success) {
        await syncAfterGoogleLink(firebaseUser.uid);
        await refreshProfile();
      } else {
        setLinkError('Failed to link account');
      }
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : 'Failed to link account');
    } finally {
      setIsLinking(false);
    }
  };

  const successRate = stats.totalThrows > 0
    ? Math.round((stats.successfulLandings / stats.totalThrows) * 100)
    : 0;

  const avgDistance = stats.successfulLandings > 0
    ? (stats.totalDistance / stats.successfulLandings).toFixed(2)
    : '0.00';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div
        className="max-w-md w-full max-h-[85vh] overflow-y-auto rounded-lg p-4"
        style={{ background: theme.uiBg, border: `2px solid ${theme.accent1}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold" style={{ color: theme.accent1 }}>
            Your Stats
          </h2>
          <button
            onClick={onClose}
            className="text-xl px-2"
            style={{ color: theme.uiText }}
          >
            ×
          </button>
        </div>

        {/* Google Account Link Section */}
        <div
          className="mb-4 p-3 rounded"
          style={{ background: `${theme.accent3}10`, border: `1px solid ${theme.accent3}` }}
        >
          {profile && !profile.googleLinked ? (
            <>
              <button
                onClick={handleLinkGoogle}
                disabled={isLinking}
                className="w-full py-2 rounded text-sm font-bold transition-opacity"
                style={{
                  background: theme.accent2,
                  color: theme.background,
                  opacity: isLinking ? 0.6 : 1,
                }}
              >
                {isLinking ? 'Linking...' : 'Link Google Account for Cloud Sync'}
              </button>
              <p className="text-xs mt-2 text-center opacity-70" style={{ color: theme.uiText }}>
                Sync your progress across devices
              </p>
              {linkError && (
                <p className="text-xs mt-1 text-center" style={{ color: theme.danger }}>
                  {linkError}
                </p>
              )}
            </>
          ) : profile?.googleLinked ? (
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: theme.highlight }}>
                Google Account Linked
              </p>
              <p className="text-xs opacity-70" style={{ color: theme.uiText }}>
                Your progress syncs across devices
              </p>
            </div>
          ) : (
            <p className="text-xs text-center opacity-70" style={{ color: theme.uiText }}>
              Sign in to enable cloud sync
            </p>
          )}
        </div>

        {/* Daily Tasks */}
        <div className="mb-4">
          <DailyTasksPanel dailyTasks={dailyTasks} onClaimTask={onClaimTask} />
        </div>

        {/* Main stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatBox label="Total Throws" value={stats.totalThrows} theme={theme} />
          <StatBox label="Success Rate" value={`${successRate}%`} theme={theme} />
          <StatBox label="Perfect Landings" value={stats.perfectLandings} theme={theme} />
          <StatBox label="Avg Distance" value={avgDistance} theme={theme} />
          <StatBox label="Max Multiplier" value={`${stats.maxMultiplier.toFixed(1)}x`} theme={theme} />
          <StatBox label="Achievements" value={`${achievements.size}/${Object.keys(ACHIEVEMENTS).length}`} theme={theme} />
        </div>

        {/* Personal Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-bold mb-2" style={{ color: theme.accent2 }}>
              Personal Leaderboard
              <span className="text-xs font-normal opacity-70 ml-2">
                (Precision: {precision} decimals)
              </span>
            </h3>
            <div className="text-xs" style={{ color: theme.uiText }}>
              {leaderboard.map((entry, i) => (
                <div
                  key={i}
                  className="flex justify-between py-1"
                  style={{ color: i === 0 ? theme.highlight : theme.uiText }}
                >
                  <span>#{i + 1}</span>
                  <span className="font-mono">{entry.displayDistance}</span>
                  <span className="opacity-50">{new Date(entry.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
            <div className="text-xs mt-2 opacity-70" style={{ color: theme.uiText }}>
              Next decimal unlocks at: {maxDistance.toFixed(precision)}
            </div>
          </div>
        )}

        {/* Closest to Unlock - Achievement Guidance */}
        {closestAchievements.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-bold mb-2" style={{ color: theme.accent2 }}>
              Almost There!
            </h3>
            <div className="space-y-2">
              {closestAchievements.map((ach) => (
                <div
                  key={ach.id}
                  className="p-2 rounded text-xs"
                  style={{ background: `${theme.highlight}15`, border: `1px solid ${theme.highlight}40` }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold" style={{ color: theme.highlight }}>{ach.name}</span>
                    <span style={{ color: theme.uiText }}>
                      {ach.current}/{ach.target}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${theme.accent3}40` }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${ach.progress * 100}%`,
                        background: theme.highlight,
                      }}
                    />
                  </div>
                  <div className="mt-1 opacity-70" style={{ color: theme.uiText }}>
                    {ach.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements Panel with Claim Buttons */}
        <div className="mb-4">
          <AchievementsPanel
            achievements={achievements}
            claimedAchievements={milestonesClaimed.achievements}
            onClaimAchievement={onClaimAchievement}
          />
        </div>

        {/* History (last 7 days) */}
        {history.length > 0 && (
          <div>
            <h3 className="text-sm font-bold mb-2" style={{ color: theme.accent2 }}>
              Recent History
            </h3>
            <div className="text-xs" style={{ color: theme.uiText }}>
              {history.slice(-7).reverse().map((entry, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-opacity-20" style={{ borderColor: theme.accent3 }}>
                  <span>{entry.date}</span>
                  <span>Best: {entry.bestDistance.toFixed(2)}</span>
                  <span>{entry.throws} throws</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, theme }: { label: string; value: string | number; theme: Theme }) {
  return (
    <div
      className="p-2 rounded text-center"
      style={{ background: `${theme.accent3}20`, border: `1px solid ${theme.accent3}` }}
    >
      <div className="text-xs opacity-70" style={{ color: theme.uiText }}>{label}</div>
      <div className="text-lg font-bold font-mono" style={{ color: theme.accent1 }}>{value}</div>
    </div>
  );
}
