// src/components/LeaderboardScreen.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  getLeaderboard,
  getUserRank,
  type LeaderboardEntry,
  type LeaderboardType,
} from '@/firebase/leaderboard';
import { useUser } from '@/contexts/UserContext';
import type { Theme } from '@/game/themes';

type LeaderboardScreenProps = {
  theme: Theme;
  onClose: () => void;
};

export function LeaderboardScreen({ theme, onClose }: LeaderboardScreenProps) {
  const { profile, firebaseUser } = useUser();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('totalScore');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLeaderboard = useCallback(async (type: LeaderboardType) => {
    setIsLoading(true);

    const [leaderboardData, rank] = await Promise.all([
      getLeaderboard(type),
      firebaseUser ? getUserRank(type, firebaseUser.uid) : null,
    ]);

    setEntries(leaderboardData);
    setUserRank(rank);
    setIsLoading(false);
  }, [firebaseUser]);

  useEffect(() => {
    loadLeaderboard(activeTab);
  }, [activeTab, loadLeaderboard]);

  const handleTabChange = (tab: LeaderboardType) => {
    setActiveTab(tab);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.9)' }}
      onClick={onClose}
    >
      <div
        className="max-w-md w-full max-h-[85vh] overflow-hidden rounded-lg flex flex-col"
        style={{ background: theme.uiBg, border: `2px solid ${theme.accent1}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: theme.accent3 }}>
          <h2 className="text-lg font-bold" style={{ color: theme.accent1 }}>
            Leaderboards
          </h2>
          <button
            onClick={onClose}
            className="text-xl px-2"
            style={{ color: theme.uiText }}
          >
            x
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: theme.accent3 }}>
          <button
            className="flex-1 py-2 text-sm font-bold transition-colors"
            style={{
              background: activeTab === 'totalScore' ? theme.accent1 : 'transparent',
              color: activeTab === 'totalScore' ? theme.background : theme.uiText,
            }}
            onClick={() => handleTabChange('totalScore')}
          >
            Total Score
          </button>
          <button
            className="flex-1 py-2 text-sm font-bold transition-colors"
            style={{
              background: activeTab === 'bestThrow' ? theme.accent1 : 'transparent',
              color: activeTab === 'bestThrow' ? theme.background : theme.uiText,
            }}
            onClick={() => handleTabChange('bestThrow')}
          >
            Best Throw
          </button>
        </div>

        {/* Your Rank */}
        {profile && userRank && (
          <div
            className="px-4 py-3 text-center"
            style={{ background: `${theme.highlight}20`, borderBottom: `1px solid ${theme.accent3}` }}
          >
            <span style={{ color: theme.uiText }}>Your Rank: </span>
            <span className="font-bold font-mono" style={{ color: theme.highlight }}>
              #{userRank.toLocaleString()}
            </span>
            <span style={{ color: theme.uiText }}> as </span>
            <span className="font-bold" style={{ color: theme.accent1 }}>
              {profile.nickname}
            </span>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="text-center py-8" style={{ color: theme.uiText }}>
              Loading...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8" style={{ color: theme.uiText }}>
              No entries yet. Be the first!
            </div>
          ) : (
            <div className="space-y-1">
              {entries.map((entry, index) => {
                const isCurrentUser = firebaseUser?.uid === entry.uid;
                const rank = index + 1;

                return (
                  <div
                    key={entry.uid}
                    className="flex items-center gap-3 px-3 py-2 rounded"
                    style={{
                      background: isCurrentUser ? `${theme.highlight}30` :
                                  rank <= 3 ? `${theme.accent1}10` : 'transparent',
                    }}
                  >
                    {/* Rank */}
                    <div
                      className="w-8 text-center font-bold font-mono"
                      style={{
                        color: rank === 1 ? '#FFD700' :
                               rank === 2 ? '#C0C0C0' :
                               rank === 3 ? '#CD7F32' :
                               theme.uiText,
                      }}
                    >
                      {rank <= 3 ? ['1st', '2nd', '3rd'][rank - 1] : `#${rank}`}
                    </div>

                    {/* Nickname */}
                    <div
                      className="flex-1 font-bold truncate"
                      style={{ color: isCurrentUser ? theme.highlight : theme.uiText }}
                    >
                      {entry.nickname}
                      {isCurrentUser && <span className="text-xs ml-1">(you)</span>}
                    </div>

                    {/* Score */}
                    <div
                      className="font-mono font-bold"
                      style={{ color: theme.accent1 }}
                    >
                      {activeTab === 'totalScore'
                        ? entry.score.toLocaleString()
                        : entry.score.toFixed(4)
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          className="px-4 py-2 text-xs text-center opacity-60"
          style={{ color: theme.uiText, borderTop: `1px solid ${theme.accent3}` }}
        >
          Top 100 shown. Updates on new personal bests.
        </div>
      </div>
    </div>
  );
}
