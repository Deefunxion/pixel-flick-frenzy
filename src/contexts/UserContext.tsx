// src/contexts/UserContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User } from 'firebase/auth';
import { type UserProfile } from '@/firebase/auth';
import { loadNumber } from '@/game/storage';
import { FIREBASE_ENABLED } from '@/firebase/flags';

type UserContextType = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  needsOnboarding: boolean;
  setProfile: (profile: UserProfile) => void;
  completeOnboarding: (profile: UserProfile) => void;
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
      if (!FIREBASE_ENABLED) {
        setFirebaseUser(null);
        setProfile(null);
        // In offline builds we don't show onboarding / nickname UI.
        setNeedsOnboarding(false);
        setIsLoading(false);
        return;
      }

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
            setNeedsOnboarding(true);
          }
        } else {
          setNeedsOnboarding(true);
          setProfile(null);
        }

        setIsLoading(false);
      });
    }

    init().catch((err) => {
      console.error('Failed to initialize user context:', err);
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
