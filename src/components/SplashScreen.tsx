// src/components/SplashScreen.tsx
import { useState } from 'react';
import type { Theme } from '@/game/themes';

type SplashScreenProps = {
  theme: Theme;
  onGoogleSignIn: () => Promise<void>;
  onGuestSignIn: () => void;
  isLoading: boolean;
};

export function SplashScreen({
  theme,
  onGoogleSignIn,
  onGuestSignIn,
  isLoading
}: SplashScreenProps) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleClick = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await onGoogleSignIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: theme.background }}
    >
      <div
        className="max-w-sm w-full rounded-lg p-8 text-center"
        style={{
          background: theme.uiBg,
          border: `3px solid ${theme.accent1}`,
          boxShadow: '4px 4px 0 rgba(0,0,0,0.1)'
        }}
      >
        {/* Title */}
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: theme.accent1 }}
        >
          One More Flick
        </h1>

        <p
          className="text-sm mb-8 opacity-70"
          style={{ color: theme.uiText }}
        >
          Flick Zeno across the cliff!
        </p>

        {/* Buttons */}
        <div className="space-y-4">
          {/* Google Sign In - Primary */}
          <button
            onClick={handleGoogleClick}
            disabled={isLoading || googleLoading}
            className="w-full py-4 rounded-lg font-bold text-lg transition-all
                       flex items-center justify-center gap-3
                       hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: '#4285f4',
              color: 'white',
              opacity: isLoading || googleLoading ? 0.6 : 1,
            }}
          >
            {/* Google Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {googleLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: theme.accent3 }} />
            <span className="text-xs opacity-50" style={{ color: theme.uiText }}>or</span>
            <div className="flex-1 h-px" style={{ background: theme.accent3 }} />
          </div>

          {/* Guest - Secondary */}
          <button
            onClick={onGuestSignIn}
            disabled={isLoading || googleLoading}
            className="w-full py-3 rounded-lg font-medium transition-all
                       hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'transparent',
              color: theme.uiText,
              border: `2px solid ${theme.accent3}`,
              opacity: isLoading || googleLoading ? 0.6 : 1,
            }}
          >
            Play as Guest
          </button>
        </div>

        {/* Warning */}
        <p
          className="text-xs mt-6 opacity-60"
          style={{ color: theme.uiText }}
        >
          Guest progress is lost if you clear browser data
        </p>

        {/* Error */}
        {error && (
          <p
            className="text-sm mt-4"
            style={{ color: theme.danger }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
