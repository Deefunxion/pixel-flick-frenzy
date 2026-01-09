// src/contexts/UserContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User } from 'firebase/auth';
import {
  subscribeToAuthState,
  getUserProfile,
  hasUserProfile,
  type UserProfile,
} from '@/firebase/auth';

type UserContextType = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  needsOnboarding: boolean;
  setProfile: (profile: UserProfile) => void;
  refreshProfile: () => Promise<void>;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (user) => {
      setFirebaseUser(user);

      if (user) {
        // Check if user has completed onboarding
        const hasProfile = await hasUserProfile(user.uid);
        if (hasProfile) {
          const userProfile = await getUserProfile(user.uid);
          setProfile(userProfile);
          setNeedsOnboarding(false);
        } else {
          setNeedsOnboarding(true);
        }
      } else {
        // No user - needs onboarding
        setNeedsOnboarding(true);
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (firebaseUser) {
      const userProfile = await getUserProfile(firebaseUser.uid);
      setProfile(userProfile);
    }
  };

  return (
    <UserContext.Provider
      value={{
        firebaseUser,
        profile,
        isLoading,
        needsOnboarding,
        setProfile,
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
