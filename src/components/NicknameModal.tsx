// src/components/NicknameModal.tsx
import { useState, useCallback } from 'react';
import { type UserProfile } from '@/firebase/auth';
import type { Theme } from '@/game/themes';
import { FIREBASE_ENABLED } from '@/firebase/flags';

type NicknameModalProps = {
  theme: Theme;
  onComplete: (profile: UserProfile) => void;
};

export function NicknameModal({ theme, onComplete }: NicknameModalProps) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateNickname = (value: string): string | null => {
    if (value.length < 3) return 'At least 3 characters';
    if (value.length > 12) return 'Maximum 12 characters';
    if (!/^[a-zA-Z]+$/.test(value)) return 'Letters only (a-z)';
    return null;
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    setError(validateNickname(value));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!FIREBASE_ENABLED) {
      setError('Online features are disabled in this build.');
      return;
    }

    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsChecking(true);
    setError(null);

    let didComplete = false;

    try {
      const { isNicknameAvailable, createAnonymousUser } = await import('@/firebase/auth');

      // Quick availability check (non-authoritative, just for UX)
      const available = await isNicknameAvailable(nickname);
      if (!available) {
        setError('Nickname is already taken');
        setIsChecking(false);
        return;
      }

      setIsChecking(false);
      setIsSubmitting(true);

      // Create user with timeout (uses transaction for race-safe reservation)
      // Use AbortController pattern for cleaner timeout handling on iOS
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const profile = await Promise.race([
        createAnonymousUser(nickname),
        new Promise<null>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Request timed out. Please try again.'));
          }, 15000);
        }),
      ]);

      // Clear timeout if we got a response
      if (timeoutId) clearTimeout(timeoutId);

      if (profile) {
        didComplete = true;
        // Use setTimeout(0) to ensure state updates flush before callback on iOS Safari
        setTimeout(() => onComplete(profile), 0);
      } else {
        setError('Failed to create profile. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Nickname creation error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      // Always reset states if we didn't complete successfully
      if (!didComplete) {
        setIsSubmitting(false);
        setIsChecking(false);
      }
    }
  }, [nickname, onComplete]);

  const isValid = nickname.length >= 3 && nickname.length <= 12 && /^[a-zA-Z]+$/.test(nickname);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div
        className="max-w-sm w-full rounded-lg p-6 text-center"
        style={{ background: theme.uiBg, border: `2px solid ${theme.accent1}` }}
      >
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: theme.accent1 }}
        >
          Welcome to One More Flick
        </h1>

        <p
          className="text-sm mb-6 opacity-80"
          style={{ color: theme.uiText }}
        >
          Choose a nickname to join the leaderboards
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={nickname}
            onChange={handleChange}
            placeholder="Enter nickname"
            maxLength={12}
            autoFocus
            className="w-full px-4 py-3 rounded text-center text-lg font-mono mb-2"
            style={{
              background: theme.background,
              color: theme.uiText,
              border: `2px solid ${error ? theme.danger : theme.accent3}`,
            }}
          />

          <div className="h-5 mb-4">
            {error && (
              <p className="text-xs" style={{ color: theme.danger }}>
                {error}
              </p>
            )}
            {!error && nickname.length > 0 && (
              <p className="text-xs opacity-60" style={{ color: theme.uiText }}>
                {nickname.length}/12 characters
              </p>
            )}
            {nickname.length === 0 && (
              <p className="text-xs opacity-60" style={{ color: theme.uiText }}>
                3-12 letters only
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid || isChecking || isSubmitting}
            className="w-full py-3 rounded font-bold text-lg transition-opacity"
            style={{
              background: theme.accent1,
              color: theme.background,
              opacity: isValid && !isChecking && !isSubmitting ? 1 : 0.5,
            }}
          >
            {isChecking ? 'Checking...' : isSubmitting ? 'Creating...' : 'Join the Leaderboards'}
          </button>
        </form>
      </div>
    </div>
  );
}
