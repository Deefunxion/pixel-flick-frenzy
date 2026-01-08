import { useState } from 'react';
import { loadJson, loadStringSet } from '@/game/storage';
import { ACHIEVEMENTS } from '@/game/engine/achievements';
import { getPersonalLeaderboard, getCurrentPrecision, getMaxAtPrecision } from '@/game/leaderboard';
import type { Stats } from '@/game/engine/types';
import type { Theme } from '@/game/themes';

type StatsOverlayProps = {
  theme: Theme;
  onClose: () => void;
};

type HistoryEntry = {
  date: string;
  bestDistance: number;
  throws: number;
  score: number;
};

export function StatsOverlay({ theme, onClose }: StatsOverlayProps) {
  const [stats] = useState<Stats>(() =>
    loadJson('stats', { totalThrows: 0, successfulLandings: 0, totalDistance: 0, perfectLandings: 0, maxMultiplier: 1 }, 'omf_stats')
  );
  const [history] = useState<HistoryEntry[]>(() =>
    loadJson('history', [], 'omf_history')
  );
  const [achievements] = useState<Set<string>>(() => loadStringSet('achievements', 'omf_achievements'));
  const [leaderboard] = useState(() => getPersonalLeaderboard());
  const precision = getCurrentPrecision();
  const maxDistance = getMaxAtPrecision(precision);

  const successRate = stats.totalThrows > 0
    ? Math.round((stats.successfulLandings / stats.totalThrows) * 100)
    : 0;

  const avgDistance = stats.successfulLandings > 0
    ? (stats.totalDistance / stats.successfulLandings).toFixed(2)
    : '0.00';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div
        className="max-w-md w-full max-h-[80vh] overflow-y-auto rounded-lg p-4"
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

        {/* Achievement list */}
        <div className="mb-4">
          <h3 className="text-sm font-bold mb-2" style={{ color: theme.accent2 }}>
            Achievements
          </h3>
          <div className="grid grid-cols-1 gap-1">
            {Object.entries(ACHIEVEMENTS).map(([id, ach]) => (
              <div
                key={id}
                className="flex items-center gap-2 text-xs p-1 rounded"
                style={{
                  background: achievements.has(id) ? `${theme.highlight}20` : 'transparent',
                  color: achievements.has(id) ? theme.highlight : theme.uiText,
                  opacity: achievements.has(id) ? 1 : 0.5,
                }}
              >
                <span>{achievements.has(id) ? '★' : '☆'}</span>
                <span className="font-bold">{ach.name}</span>
                <span className="opacity-70">— {ach.desc}</span>
              </div>
            ))}
          </div>
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
