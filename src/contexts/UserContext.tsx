// src/contexts/UserContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User } from 'firebase/auth';
import { type UserProfile } from '@/firebase/auth';
import { loadNumber, loadString, saveString } from '@/game/storage';
import { FIREBASE_ENABLED } from '@/firebase/flags';
import { captureError } from '@/lib/sentry';

// Cache key for onboarding completion (survives page refresh)
const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

type UserContextType = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  needsOnboarding: boolean;
  setProfile: (profile: UserProfile) => void;
  completeOnboarding: (profile: UserProfile) => void;
  skipOnboarding: () => void; // Dev mode - skip without creating profile
  refreshProfile: () => Promise<void>;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let unsubscribe: null | (() => void) = null;
    let cancelled = false;

    async function init() {
      console.log('[UserContext] init, FIREBASE_ENABLED:', FIREBASE_ENABLED);
      if (!FIREBASE_ENABLED) {
        console.log('[UserContext] Firebase disabled, skipping auth');
        setFirebaseUser(null);
        setProfile(null);
        // In offline builds we don't show onboarding / nickname UI.
        setNeedsOnboarding(false);
        setIsLoading(false);
        return;
      }

      // Check if user already completed onboarding (survives page refresh)
      const cachedOnboarding = loadString(ONBOARDING_COMPLETE_KEY, '');
      const hasCompletedBefore = cachedOnboarding === 'true';

      const [{ subscribeToAuthState, getUserProfile, hasUserProfile }, { syncScoreToFirebase }] =
        await Promise.all([import('@/firebase/auth'), import('@/firebase/scoreSync')]);

      if (cancelled) return;

      unsubscribe = subscribeToAuthState(async (user) => {
        setFirebaseUser(user);

        if (user) {
          const hasProfile = await hasUserProfile(user.uid);
          if (hasProfile) {
            const userProfile = await getUserProfile(user.uid);
            setProfile(userProfile);
            setNeedsOnboarding(false);
            // Mark as completed in cache
            saveString(ONBOARDING_COMPLETE_KEY, 'true');

            // One-time sync: upload existing local scores to Firebase
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
          } else {
            // Only show onboarding if user hasn't completed it before
            // This prevents the modal from showing during auth loading
            setNeedsOnboarding(!hasCompletedBefore);
          }
        } else {
          // Only show onboarding if user hasn't completed it before
          setNeedsOnboarding(!hasCompletedBefore);
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
      setNeedsOnboarding(false);
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

  // Complete onboarding - sets profile AND closes the modal
  // This fixes the race condition where auth state fires before profile creation completes
  const completeOnboarding = (profile: UserProfile) => {
    setProfile(profile);
    setNeedsOnboarding(false);
    // Cache that onboarding is complete (survives page refresh)
    saveString(ONBOARDING_COMPLETE_KEY, 'true');
  };

  // Skip onboarding (dev mode only) - play without profile
  const skipOnboarding = () => {
    setNeedsOnboarding(false);
    // Cache so it doesn't ask again
    saveString(ONBOARDING_COMPLETE_KEY, 'true');
  };

  return (
    <UserContext.Provider
      value={{
        firebaseUser,
        profile,
        isLoading,
        needsOnboarding,
        setProfile,
        completeOnboarding,
        skipOnboarding,
        refreshProfile,
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
