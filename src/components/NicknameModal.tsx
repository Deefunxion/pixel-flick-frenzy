// src/components/NicknameModal.tsx
import { useState, useCallback } from 'react';
import { type UserProfile } from '@/firebase/auth';
import type { Theme } from '@/game/themes';
import { FIREBASE_ENABLED } from '@/firebase/flags';

type NicknameModalProps = {
  theme: Theme;
  onComplete: (profile: UserProfile) => void;
  onSkip?: () => void; // For dev mode - skip onboarding
  // New props for Google users
  isGoogleUser?: boolean;
  googleDisplayName?: string;
  googleUid?: string;
};

const isDev = import.meta.env.DEV;

export function NicknameModal({
  theme,
  onComplete,
  onSkip,
  isGoogleUser = false,
  googleDisplayName,
  googleUid,
}: NicknameModalProps) {
  // For Google users, pre-fill with sanitized display name
  const defaultNickname = isGoogleUser && googleDisplayName
    ? googleDisplayName.replace(/[^a-zA-Z]/g, '').slice(0, 12)
    : '';

  const [nickname, setNickname] = useState(defaultNickname);
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

  // Google user: Use display name directly (skip nickname)
  const handleUseGoogleName = useCallback(async () => {
    if (!isGoogleUser || !googleUid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { createProfileFromGoogle } = await import('@/firebase/auth');
      const { auth } = await import('@/firebase/config');

      if (!auth.currentUser) {
        setError('Not signed in');
        setIsSubmitting(false);
        return;
      }

      const profile = await createProfileFromGoogle(auth.currentUser);

      if (profile) {
        setTimeout(() => onComplete(profile), 0);
      } else {
        setError('Failed to create profile');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  }, [isGoogleUser, googleUid, onComplete]);

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
      if (isGoogleUser && googleUid) {
        // Google user with custom nickname
        const { createProfileFromGoogle } = await import('@/firebase/auth');
        const { auth } = await import('@/firebase/config');

        if (!auth.currentUser) {
          setError('Not signed in');
          setIsChecking(false);
          return;
        }

        setIsChecking(false);
        setIsSubmitting(true);

        const profile = await createProfileFromGoogle(auth.currentUser, nickname);

        if (profile) {
          didComplete = true;
          setTimeout(() => onComplete(profile), 0);
        } else {
          setError('Failed to create profile');
          setIsSubmitting(false);
        }
      } else {
        // Anonymous user flow (existing logic)
        const { isNicknameAvailable, createAnonymousUser } = await import('@/firebase/auth');

        const available = await isNicknameAvailable(nickname);
        if (!available) {
          setError('Nickname is already taken');
          setIsChecking(false);
          return;
        }

        setIsChecking(false);
        setIsSubmitting(true);

        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const profile = await Promise.race([
          createAnonymousUser(nickname),
          new Promise<null>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error('Request timed out. Please try again.'));
            }, 15000);
          }),
        ]);

        if (timeoutId) clearTimeout(timeoutId);

        if (profile) {
          didComplete = true;
          setTimeout(() => onComplete(profile), 0);
        } else {
          setError('Failed to create profile. Please try again.');
          setIsSubmitting(false);
        }
      }
    } catch (err) {
      console.error('Nickname creation error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      if (!didComplete) {
        setIsSubmitting(false);
        setIsChecking(false);
      }
    }
  }, [nickname, onComplete, isGoogleUser, googleUid]);

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
          {isGoogleUser ? 'Choose Your Nickname' : 'Welcome to One More Flick'}
        </h1>

        <p
          className="text-sm mb-6 opacity-80"
          style={{ color: theme.uiText }}
        >
          {isGoogleUser
            ? 'Pick a nickname for the leaderboards, or use your Google name'
            : 'Choose a nickname to join the leaderboards'
          }
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

          {/* Google user: Skip with Google name */}
          {isGoogleUser && googleDisplayName && (
            <button
              type="button"
              onClick={handleUseGoogleName}
              disabled={isSubmitting}
              className="w-full py-2 mt-3 rounded text-sm transition-opacity"
              style={{
                background: 'transparent',
                color: theme.accent2,
                border: `1px solid ${theme.accent2}`,
                opacity: isSubmitting ? 0.5 : 1,
              }}
            >
              Use "{googleDisplayName.split(' ')[0]}" instead
            </button>
          )}

          {/* Dev mode skip button */}
          {isDev && onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="w-full py-2 mt-3 rounded text-sm opacity-60 hover:opacity-100 transition-opacity"
              style={{
                background: 'transparent',
                color: theme.uiText,
                border: `1px solid ${theme.accent3}`,
              }}
            >
              Skip (Dev Mode)
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
