// src/components/DailyChallenge.tsx

import { useState, useEffect } from 'react';
import { loadDailyChallengeState } from '@/game/engine/dailyChallenge';
import { getDailyLeaderboard, type DailyLeaderboardEntry } from '@/firebase/dailyLeaderboard';

interface DailyChallengeProps {
  onPlay: () => void;
  onClose: () => void;
}

export function DailyChallenge({ onPlay, onClose }: DailyChallengeProps) {
  const [state] = useState(() => loadDailyChallengeState());
  const [leaderboard, setLeaderboard] = useState<DailyLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDailyLeaderboard()
      .then(setLeaderboard)
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2">
      <div
        className="rounded-lg p-4 w-full flex flex-col"
        style={{
          background: '#f5f0e1',
          border: '3px solid #1e3a5f',
          boxShadow: '4px 4px 0 rgba(0,0,0,0.2)',
          maxWidth: 'min(400px, 95vw)',
          maxHeight: 'min(500px, 85vh)',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-2 mb-3" style={{ borderBottom: '2px solid #1e3a5f' }}>
          <div>
            <h2 style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: '18px', fontWeight: 'bold', color: '#1e3a5f' }}>
              Daily Challenge
            </h2>
            <p style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: '12px', color: '#666' }}>
              {today}
            </p>
          </div>
          <button onClick={onClose} className="hover:opacity-70 px-2" style={{ color: '#1e3a5f', fontSize: '24px' }}>
            ×
          </button>
        </div>

        {/* Your stats */}
        <div className="bg-white/50 rounded p-3 mb-3">
          <div className="flex justify-between items-center">
            <div>
              <p style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: '14px', color: '#1e3a5f' }}>
                Your Best: <strong>{state.bestScore.toFixed(2)}</strong>
              </p>
              <p style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: '12px', color: '#666' }}>
                {state.attempts} attempt{state.attempts !== 1 ? 's' : ''} today
              </p>
            </div>
            <div className="flex">
              {[0, 1, 2].map(i => (
                <span key={i} style={{ color: i < state.stars ? '#d35400' : '#ccc', fontSize: '20px' }}>★</span>
              ))}
            </div>
          </div>
        </div>

        {/* Play button */}
        <button
          onClick={onPlay}
          className="w-full py-3 rounded mb-3 font-bold transition-transform hover:scale-105"
          style={{
            background: '#d35400',
            color: 'white',
            fontFamily: '"Comic Sans MS", cursive',
            fontSize: '16px',
          }}
        >
          {state.attempts === 0 ? 'Play Today\'s Challenge' : 'Try Again'}
        </button>

        {/* Leaderboard */}
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          <h3 style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: '14px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '8px' }}>
            Today's Leaderboard
          </h3>
          {loading ? (
            <p style={{ color: '#666', textAlign: 'center' }}>Loading...</p>
          ) : leaderboard.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center' }}>Be the first to play!</p>
          ) : (
            <div className="space-y-1">
              {leaderboard.slice(0, 10).map((entry, i) => (
                <div
                  key={entry.uid}
                  className="flex justify-between items-center px-2 py-1 rounded"
                  style={{ background: i === 0 ? '#FFD70030' : 'transparent' }}
                >
                  <span style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: '12px', color: '#1e3a5f' }}>
                    #{i + 1} {entry.nickname}
                  </span>
                  <span style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: '12px', color: '#d35400' }}>
                    {entry.score.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
