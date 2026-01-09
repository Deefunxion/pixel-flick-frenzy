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

export type UserProfile = {
  uid: string;
  nickname: string;
  createdAt: Timestamp;
  googleLinked: boolean;
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

  // Sign in anonymously first to get uid
  const userCredential = await signInAnonymously(auth);
  const user = userCredential.user;
  const normalizedNickname = nickname.toLowerCase();

  try {
    // Use transaction to atomically check and reserve nickname
    const profile = await runTransaction(db, async (transaction) => {
      // Check nickname availability within transaction
      const nicknameRef = doc(db, 'nicknames', normalizedNickname);
      const nicknameDoc = await transaction.get(nicknameRef);

      if (nicknameDoc.exists()) {
        throw new Error('Nickname is already taken');
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
      const userRef = doc(db, 'users', user.uid);
      transaction.set(userRef, newProfile);
      transaction.set(nicknameRef, {
        uid: user.uid,
        originalCase: nickname,
      });

      return newProfile as unknown as UserProfile;
    });

    return profile;
  } catch (error) {
    // If transaction fails, sign out the anonymous user
    await auth.signOut();
    console.error('Error creating anonymous user:', error);
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

// Link Google account
export async function linkGoogleAccount(): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const provider = new GoogleAuthProvider();
    await linkWithPopup(user, provider);

    // Update profile
    await updateDoc(doc(db, 'users', user.uid), {
      googleLinked: true,
    });

    return true;
  } catch (error) {
    console.error('Error linking Google account:', error);
    return false;
  }
}

// Subscribe to auth state changes
export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Check if user exists (has completed onboarding)
export async function hasUserProfile(userId: string): Promise<boolean> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  return userDoc.exists();
}
