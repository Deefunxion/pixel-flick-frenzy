// src/firebase/auth.ts
import {
  signInAnonymously,
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { auth, db } from './config';
import { captureError } from '@/lib/sentry';

export type UserProfile = {
  uid: string;
  nickname: string;
  createdAt: Timestamp;
  googleLinked: boolean;
  googleEmail?: string;
  googleDisplayName?: string;
  linkedAt?: Timestamp;
  // Scores
  totalScore: number;
  bestThrow: number;
  // Sync data
  achievements: string[];
  unlockedThemes: string[];
  stats: {
    totalThrows: number;
    successfulLandings: number;
    totalDistance: number;
    perfectLandings: number;
    maxMultiplier: number;
  };
  settings: {
    reduceFx: boolean;
    themeId: string;
    audioVolume: number;
    audioMuted: boolean;
  };
  settingsUpdatedAt: Timestamp; // For cross-device sync recency
  // Arcade progress
  arcadeProgress?: {
    starsPerLevel: Record<number, { allDoodles: boolean; inOrder: boolean; landedInZone: boolean }>;
    highestLevelReached: number;
  };
};

// Check if nickname is available (read-only check, actual reservation is transactional)
export async function isNicknameAvailable(nickname: string): Promise<boolean> {
  const normalizedNickname = nickname.toLowerCase();
  const nicknameDoc = await getDoc(doc(db, 'nicknames', normalizedNickname));
  return !nicknameDoc.exists();
}

// Create anonymous user with nickname using transaction (prevents race conditions)
export async function createAnonymousUser(nickname: string): Promise<UserProfile | null> {
  // Validate nickname: 3-12 letters only
  if (!/^[a-zA-Z]{3,12}$/.test(nickname)) {
    throw new Error('Nickname must be 3-12 letters only');
  }

  const normalizedNickname = nickname.toLowerCase();

  // Pre-check: fail fast if nickname is taken (non-authoritative but saves time)
  const nicknameRef = doc(db, 'nicknames', normalizedNickname);
  const existingNickname = await getDoc(nicknameRef);
  if (existingNickname.exists()) {
    throw new Error('Nickname is already taken');
  }

  // Check if there's already a signed-in user with a profile
  // This prevents duplicate registrations from repeated taps
  if (auth.currentUser) {
    const existingProfile = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (existingProfile.exists()) {
      // User already has a profile - return it instead of creating duplicate
      return existingProfile.data() as UserProfile;
    }
  }

  // Sign in anonymously to get uid
  const userCredential = await signInAnonymously(auth);
  const user = userCredential.user;

  try {
    // Use transaction to atomically check and reserve nickname
    const profile = await runTransaction(db, async (transaction) => {
      // Check nickname availability within transaction
      const nicknameDoc = await transaction.get(nicknameRef);

      if (nicknameDoc.exists()) {
        throw new Error('Nickname is already taken');
      }

      // Double-check user doesn't already have a profile (race condition guard)
      const userRef = doc(db, 'users', user.uid);
      const existingUserDoc = await transaction.get(userRef);
      if (existingUserDoc.exists()) {
        // Profile was created by another transaction - return it
        return existingUserDoc.data() as UserProfile;
      }

      // Create user profile
      const newProfile: Omit<UserProfile, 'createdAt' | 'settingsUpdatedAt'> & {
        createdAt: ReturnType<typeof serverTimestamp>;
        settingsUpdatedAt: ReturnType<typeof serverTimestamp>;
      } = {
        uid: user.uid,
        nickname,
        createdAt: serverTimestamp(),
        googleLinked: false,
        totalScore: 0,
        bestThrow: 0,
        achievements: [],
        unlockedThemes: ['flipbook'],
        stats: {
          totalThrows: 0,
          successfulLandings: 0,
          totalDistance: 0,
          perfectLandings: 0,
          maxMultiplier: 1,
        },
        settings: {
          reduceFx: false,
          themeId: 'flipbook',
          audioVolume: 0.7,
          audioMuted: false,
        },
        settingsUpdatedAt: serverTimestamp(),
      };

      // Write both docs in transaction
      transaction.set(userRef, newProfile);
      transaction.set(nicknameRef, {
        uid: user.uid,
        originalCase: nickname,
      });

      return newProfile as unknown as UserProfile;
    });

    return profile;
  } catch (error) {
    // If transaction fails and user has no profile, sign out
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await auth.signOut();
    }

    captureError(error instanceof Error ? error : new Error(String(error)), {
      nickname: normalizedNickname,
      uid: user.uid,
      action: 'createAnonymousUser',
    });
    throw error;
  }
}

// Get current user profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// Link Google account to existing anonymous user
export async function linkGoogleAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'Not signed in' };

    if (!user.isAnonymous) {
      return { success: false, error: 'Already linked to Google' };
    }

    const provider = new GoogleAuthProvider();

    try {
      await linkWithPopup(user, provider);
    } catch (linkError: unknown) {
      const error = linkError as { code?: string };
      if (error.code === 'auth/credential-already-in-use') {
        return {
          success: false,
          error: 'This Google account is already linked to another profile'
        };
      }
      throw linkError;
    }

    // Update profile with Google info
    await updateDoc(doc(db, 'users', user.uid), {
      googleLinked: true,
      googleEmail: user.email,
      googleDisplayName: user.displayName,
      linkedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error linking Google account:', error);
    captureError(error instanceof Error ? error : new Error(String(error)), {
      action: 'linkGoogleAccount',
    });
    return { success: false, error: 'Failed to link Google account' };
  }
}

// Sign in directly with Google (for new users choosing Google path)
export async function signInWithGoogle(): Promise<{ user: User; isNewUser: boolean } | null> {
  try {
    const { signInWithPopup } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    // Check if this is a new user (no existing profile)
    const hasProfile = await hasUserProfile(result.user.uid);

    return { user: result.user, isNewUser: !hasProfile };
  } catch (error) {
    // User cancelled or popup blocked
    console.error('Google sign-in error:', error);
    return null;
  }
}

// Create profile for Google user (with optional custom nickname)
export async function createProfileFromGoogle(
  user: User,
  customNickname?: string
): Promise<UserProfile | null> {
  // Use custom nickname or derive from Google display name
  const displayName = customNickname || user.displayName || 'Player';

  // Sanitize: keep only letters, max 12 chars
  let nickname = displayName.replace(/[^a-zA-Z]/g, '').slice(0, 12);
  if (nickname.length < 3) {
    nickname = 'Player' + Math.random().toString(36).slice(2, 6);
  }

  const normalizedNickname = nickname.toLowerCase();
  const nicknameRef = doc(db, 'nicknames', normalizedNickname);
  const userRef = doc(db, 'users', user.uid);

  try {
    const profile = await runTransaction(db, async (transaction) => {
      // Check if user already has profile
      const existingUserDoc = await transaction.get(userRef);
      if (existingUserDoc.exists()) {
        return existingUserDoc.data() as UserProfile;
      }

      // Check nickname - if taken, add random suffix
      const nicknameDoc = await transaction.get(nicknameRef);
      let finalNickname = nickname;
      let finalNormalizedNickname = normalizedNickname;

      if (nicknameDoc.exists()) {
        // Nickname taken - add random suffix
        const suffix = Math.random().toString(36).slice(2, 5);
        finalNickname = nickname.slice(0, 9) + suffix;
        finalNormalizedNickname = finalNickname.toLowerCase();
      }

      const newProfile: Omit<UserProfile, 'createdAt' | 'settingsUpdatedAt'> & {
        createdAt: ReturnType<typeof serverTimestamp>;
        settingsUpdatedAt: ReturnType<typeof serverTimestamp>;
      } = {
        uid: user.uid,
        nickname: finalNickname,
        createdAt: serverTimestamp(),
        googleLinked: true,
        googleEmail: user.email || undefined,
        googleDisplayName: user.displayName || undefined,
        totalScore: 0,
        bestThrow: 0,
        achievements: [],
        unlockedThemes: ['flipbook'],
        stats: {
          totalThrows: 0,
          successfulLandings: 0,
          totalDistance: 0,
          perfectLandings: 0,
          maxMultiplier: 1,
        },
        settings: {
          reduceFx: false,
          themeId: 'flipbook',
          audioVolume: 0.7,
          audioMuted: false,
        },
        settingsUpdatedAt: serverTimestamp(),
      };

      transaction.set(userRef, newProfile);
      transaction.set(doc(db, 'nicknames', finalNormalizedNickname), {
        uid: user.uid,
        originalCase: finalNickname,
      });

      return newProfile as unknown as UserProfile;
    });

    return profile;
  } catch (error) {
    captureError(error instanceof Error ? error : new Error(String(error)), {
      uid: user.uid,
      action: 'createProfileFromGoogle',
    });
    return null;
  }
}

// Subscribe to auth state changes
export function subscribeToAuthState(callback: (user: User | null) => void) {
  if (!auth) {
    // Firebase disabled (itch build) - call with null user immediately
    callback(null);
    return () => {}; // No-op unsubscribe
  }
  return onAuthStateChanged(auth, callback);
}

// Check if user exists (has completed onboarding)
export async function hasUserProfile(userId: string): Promise<boolean> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  return userDoc.exists();
}
