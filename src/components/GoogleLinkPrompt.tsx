// src/components/GoogleLinkPrompt.tsx
import { useState } from 'react';
import type { Theme } from '@/game/themes';
import type { LinkPromptMilestone } from '@/game/storage';

type GoogleLinkPromptProps = {
  theme: Theme;
  milestone: LinkPromptMilestone;
  totalThrows: number;
  bestScore: number;
  achievementCount: number;
  onLink: () => Promise<{ success: boolean; error?: string }>;
  onDismiss: () => void;
};

export function GoogleLinkPrompt({
  theme,
  milestone,
  totalThrows,
  bestScore,
  achievementCount,
  onLink,
  onDismiss,
}: GoogleLinkPromptProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLink = async () => {
    setError(null);
    setIsLinking(true);
    try {
      const result = await onLink();
      if (!result.success) {
        setError(result.error || 'Failed to link account');
      }
      // On success, the parent will close this modal
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLinking(false);
    }
  };

  const isLastReminder = milestone === 50;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div
        className="max-w-sm w-full rounded-lg p-6 text-center animate-in zoom-in-95 duration-200"
        style={{
          background: theme.uiBg,
          border: `2px solid ${theme.highlight}`
        }}
      >
        {/* Header */}
        <div className="text-4xl mb-3">🎮</div>
        <h2
          className="text-xl font-bold mb-2"
          style={{ color: theme.highlight }}
        >
          {milestone === 5 && "Nice throwing!"}
          {milestone === 20 && "You're on a roll!"}
          {milestone === 50 && "Last chance!"}
        </h2>

        {/* Stats at risk */}
        <div
          className="rounded-lg p-4 mb-4"
          style={{ background: theme.background }}
        >
          <p className="text-sm mb-2" style={{ color: theme.uiText }}>
            Progress at risk:
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-2xl font-bold" style={{ color: theme.accent1 }}>
                {totalThrows}
              </p>
              <p className="text-xs opacity-60" style={{ color: theme.uiText }}>
                throws
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: theme.accent2 }}>
                {bestScore.toFixed(1)}
              </p>
              <p className="text-xs opacity-60" style={{ color: theme.uiText }}>
                best
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: theme.highlight }}>
                {achievementCount}
              </p>
              <p className="text-xs opacity-60" style={{ color: theme.uiText }}>
                🏆
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        <p
          className="text-sm mb-4"
          style={{ color: theme.uiText }}
        >
          {isLastReminder
            ? "This is your last reminder. Link Google to save your progress forever!"
            : "Link your Google account to save progress across devices and never lose it."
          }
        </p>

        {/* Error */}
        {error && (
          <p className="text-sm mb-3" style={{ color: theme.danger }}>
            {error}
          </p>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleLink}
            disabled={isLinking}
            className="w-full py-3 rounded-lg font-bold text-lg transition-opacity
                       flex items-center justify-center gap-2"
            style={{
              background: '#4285f4',
              color: 'white',
              opacity: isLinking ? 0.6 : 1,
            }}
          >
            {isLinking ? 'Linking...' : 'Link Google Account'}
          </button>

          <button
            onClick={onDismiss}
            disabled={isLinking}
            className="w-full py-2 rounded text-sm transition-opacity"
            style={{
              background: 'transparent',
              color: theme.uiText,
              opacity: 0.7,
            }}
          >
            {isLastReminder ? "I'll risk it" : "Maybe later"}
          </button>
        </div>

        {/* Reminder count */}
        {!isLastReminder && (
          <p
            className="text-xs mt-4 opacity-40"
            style={{ color: theme.uiText }}
          >
            Reminder {milestone === 5 ? '1' : '2'} of 3
          </p>
        )}
      </div>
    </div>
  );
}
