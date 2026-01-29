// src/contexts/UserContext.tsx
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { type User } from 'firebase/auth';
import { type UserProfile } from '@/firebase/auth';
import { loadNumber, loadString, saveString } from '@/game/storage';
import { FIREBASE_ENABLED } from '@/firebase/flags';
import { captureError } from '@/lib/sentry';

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

type AuthPath = 'splash' | 'nickname' | 'nickname-google' | 'ready';

type UserContextType = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  needsOnboarding: boolean; // Kept for backwards compatibility
  authPath: AuthPath;
  isGoogleUser: boolean;
  setProfile: (profile: UserProfile) => void;
  completeOnboarding: (profile: UserProfile) => void;
  skipOnboarding: () => void;
  refreshProfile: () => Promise<void>;
  // New auth flow functions
  signInWithGoogle: () => Promise<void>;
  continueAsGuest: () => void;
  linkGoogleAccount: () => Promise<{ success: boolean; error?: string }>;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authPath, setAuthPath] = useState<AuthPath>('splash');
  const [pendingGoogleUser, setPendingGoogleUser] = useState<User | null>(null);

  // Derived state
  const needsOnboarding = authPath === 'nickname' || authPath === 'nickname-google';
  const isGoogleUser = authPath === 'nickname-google' || (profile?.googleLinked ?? false);

  useEffect(() => {
    let unsubscribe: null | (() => void) = null;
    let cancelled = false;

    async function init() {
      console.log('[UserContext] init, FIREBASE_ENABLED:', FIREBASE_ENABLED);

      if (!FIREBASE_ENABLED) {
        console.log('[UserContext] Firebase disabled, skipping auth');
        setFirebaseUser(null);
        setProfile(null);
        setAuthPath('ready'); // Skip splash in offline mode
        setIsLoading(false);
        return;
      }

      const cachedOnboarding = loadString(ONBOARDING_COMPLETE_KEY, '', 'onboarding_complete');
      const hasCompletedBefore = cachedOnboarding === 'true';

      const [{ subscribeToAuthState, getUserProfile, hasUserProfile }, { syncScoreToFirebase }] =
        await Promise.all([import('@/firebase/auth'), import('@/firebase/scoreSync')]);

      if (cancelled) return;

      unsubscribe = subscribeToAuthState(async (user) => {
        setFirebaseUser(user);

        if (user) {
          const hasProfile = await hasUserProfile(user.uid);

          if (hasProfile) {
            // User has profile - load it and go to game
            const userProfile = await getUserProfile(user.uid);
            setProfile(userProfile);
            setAuthPath('ready');
            saveString(ONBOARDING_COMPLETE_KEY, 'true');

            // Sync local scores to Firebase
            if (userProfile) {
              const localTotalScore = loadNumber('total_score', 0, 'omf_total_score');
              const localBestThrow = loadNumber('best', 0, 'omf_best');
              if (localTotalScore > 0 || localBestThrow > 0) {
                syncScoreToFirebase(
                  user.uid,
                  userProfile.nickname,
                  localTotalScore,
                  localBestThrow
                );
              }
            }
          } else if (user.isAnonymous) {
            // Anonymous user without profile - needs nickname
            if (hasCompletedBefore) {
              // Edge case: cached as complete but no profile (shouldn't happen)
              // Show nickname modal anyway
              setAuthPath('nickname');
            } else {
              setAuthPath('nickname');
            }
          } else {
            // Google user without profile - needs optional nickname
            setPendingGoogleUser(user);
            setAuthPath('nickname-google');
          }
        } else {
          // No user - show splash screen (unless cached as complete)
          if (hasCompletedBefore) {
            // User completed before but session lost - show splash to re-auth
            setAuthPath('splash');
          } else {
            setAuthPath('splash');
          }
          setProfile(null);
        }

        setIsLoading(false);
      });
    }

    init().catch((err) => {
      captureError(err instanceof Error ? err : new Error(String(err)), {
        action: 'initUserContext',
      });
      setFirebaseUser(null);
      setProfile(null);
      setAuthPath('splash');
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const refreshProfile = async () => {
    if (!FIREBASE_ENABLED) return;
    if (!firebaseUser) return;

    const { getUserProfile } = await import('@/firebase/auth');
    const userProfile = await getUserProfile(firebaseUser.uid);
    setProfile(userProfile);
  };

  const completeOnboarding = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setAuthPath('ready');
    setPendingGoogleUser(null);
    saveString(ONBOARDING_COMPLETE_KEY, 'true');
  };

  const skipOnboarding = () => {
    setAuthPath('ready');
    saveString(ONBOARDING_COMPLETE_KEY, 'true');
  };

  // New: Sign in with Google from splash screen
  const signInWithGoogle = useCallback(async () => {
    if (!FIREBASE_ENABLED) return;

    const { signInWithGoogle: googleSignIn } = await import('@/firebase/auth');

    const result = await googleSignIn();
    if (!result) {
      throw new Error('Sign in cancelled');
    }

    const { user, isNewUser } = result;

    if (isNewUser) {
      // New Google user - show optional nickname modal
      setPendingGoogleUser(user);
      setAuthPath('nickname-google');
    }
    // Returning Google user - profile already loaded by auth state listener
  }, []);

  // New: Continue as guest from splash screen
  const continueAsGuest = useCallback(() => {
    setAuthPath('nickname');
  }, []);

  // New: Link Google account (for existing guest users)
  const linkGoogleAccount = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!FIREBASE_ENABLED) {
      return { success: false, error: 'Firebase not enabled' };
    }

    const { linkGoogleAccount: linkGoogle } = await import('@/firebase/auth');
    const result = await linkGoogle();

    if (result.success) {
      // Refresh profile to get updated googleLinked status
      await refreshProfile();
    }

    return result;
  }, []);

  return (
    <UserContext.Provider
      value={{
        firebaseUser,
        profile,
        isLoading,
        needsOnboarding,
        authPath,
        isGoogleUser,
        setProfile,
        completeOnboarding,
        skipOnboarding,
        refreshProfile,
        signInWithGoogle,
        continueAsGuest,
        linkGoogleAccount,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
