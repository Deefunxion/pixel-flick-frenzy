# Social Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add real multiplayer leaderboards with Firebase backend, user identity via nickname + optional Google sign-in, and cross-device sync.

**Architecture:** Firebase Anonymous Auth creates instant user identity with nickname. Firestore stores user profiles and leaderboard entries. Optional Google account linking enables cross-device sync with smart merge (keep highest scores). Leaderboards show Top 100 + user's rank for two categories: Total Score and Best Throw.

**Tech Stack:** Firebase Auth (Anonymous + Google), Firestore, React 18, TypeScript

---

## Phase 1: Firebase Setup & Configuration

### Task 1.1: Install Firebase Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Firebase packages**

Run:
```bash
npm install firebase
```

**Step 2: Verify installation**

Run: `npm ls firebase`
Expected: firebase@10.x.x installed

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add firebase dependency"
```

---

### Task 1.2: Create Firebase Configuration

**Files:**
- Create: `src/firebase/config.ts`
- Create: `src/firebase/index.ts`

**Step 1: Create Firebase config file**

```typescript
// src/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

**Step 2: Create barrel export**

```typescript
// src/firebase/index.ts
export { app, auth, db } from './config';
```

**Step 3: Create .env.example**

```bash
# .env.example
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Step 4: Add .env to .gitignore**

Ensure `.env` and `.env.local` are in `.gitignore`.

**Step 5: Commit**

```bash
git add src/firebase/ .env.example .gitignore
git commit -m "feat: add Firebase configuration with env variables"
```

---

## Phase 2: User Identity & Authentication

### Task 2.1: Create Auth Service

**Files:**
- Create: `src/firebase/auth.ts`

**Step 1: Create authentication service**

```typescript
// src/firebase/auth.ts
import {
  signInAnonymously,
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';

export type UserProfile = {
  odea: string;
  nickname: string;
  createdAt: string;
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
};

// Check if nickname is available
export async function isNicknameAvailable(nickname: string): Promise<boolean> {
  const normalizedNickname = nickname.toLowerCase();
  const nicknameDoc = await getDoc(doc(db, 'nicknames', normalizedNickname));
  return !nicknameDoc.exists();
}

// Create anonymous user with nickname
export async function createAnonymousUser(nickname: string): Promise<UserProfile | null> {
  try {
    // Validate nickname: 3-12 letters only
    if (!/^[a-zA-Z]{3,12}$/.test(nickname)) {
      throw new Error('Nickname must be 3-12 letters only');
    }

    // Check availability
    const available = await isNicknameAvailable(nickname);
    if (!available) {
      throw new Error('Nickname is already taken');
    }

    // Sign in anonymously
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;

    // Create user profile
    const profile: UserProfile = {
      odea: user.uid,
      nickname,
      createdAt: new Date().toISOString(),
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
    };

    // Save profile to Firestore
    await setDoc(doc(db, 'users', user.uid), profile);

    // Reserve nickname
    await setDoc(doc(db, 'nicknames', nickname.toLowerCase()), {
      odea: user.uid,
      originalCase: nickname,
    });

    return profile;
  } catch (error) {
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
```

**Step 2: Commit**

```bash
git add src/firebase/auth.ts
git commit -m "feat: create Firebase auth service with anonymous + Google support"
```

---

### Task 2.2: Create Nickname Modal Component

**Files:**
- Create: `src/components/NicknameModal.tsx`

**Step 1: Create the modal component**

```typescript
// src/components/NicknameModal.tsx
import { useState, useCallback } from 'react';
import { isNicknameAvailable, createAnonymousUser, type UserProfile } from '@/firebase/auth';
import type { Theme } from '@/game/themes';

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

    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      // Check availability
      const available = await isNicknameAvailable(nickname);
      if (!available) {
        setError('Nickname is already taken');
        setIsChecking(false);
        return;
      }

      setIsChecking(false);
      setIsSubmitting(true);

      // Create user
      const profile = await createAnonymousUser(nickname);
      if (profile) {
        onComplete(profile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsSubmitting(false);
      setIsChecking(false);
    }
  }, [nickname, onComplete]);

  const isValid = nickname.length >= 3 && nickname.length <= 12 && /^[a-zA-Z]+$/.test(nickname);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.9)' }}
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
```

**Step 2: Commit**

```bash
git add src/components/NicknameModal.tsx
git commit -m "feat: create NicknameModal component for first-time onboarding"
```

---

### Task 2.3: Create User Context

**Files:**
- Create: `src/contexts/UserContext.tsx`

**Step 1: Create user context**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/contexts/UserContext.tsx
git commit -m "feat: create UserContext for auth state management"
```

---

### Task 2.4: Integrate Auth into App

**Files:**
- Modify: `src/App.tsx` or `src/main.tsx`
- Modify: `src/components/Game.tsx`

**Step 1: Wrap app with UserProvider**

In your main entry point (App.tsx or main.tsx):

```typescript
import { UserProvider } from '@/contexts/UserContext';

// Wrap your app:
<UserProvider>
  <App />
</UserProvider>
```

**Step 2: Add onboarding check in Game.tsx**

```typescript
import { useUser } from '@/contexts/UserContext';
import { NicknameModal } from './NicknameModal';

// Inside Game component:
const { profile, isLoading, needsOnboarding, setProfile } = useUser();

// Early return for loading state
if (isLoading) {
  return (
    <div className="flex items-center justify-center h-screen" style={{ background: theme.background }}>
      <p style={{ color: theme.uiText }}>Loading...</p>
    </div>
  );
}

// Show onboarding modal if needed
{needsOnboarding && (
  <NicknameModal theme={theme} onComplete={setProfile} />
)}
```

**Step 3: Commit**

```bash
git add src/App.tsx src/components/Game.tsx src/main.tsx
git commit -m "feat: integrate user auth and onboarding into game"
```

---

## Phase 3: Leaderboard Service

### Task 3.1: Create Leaderboard Service

**Files:**
- Create: `src/firebase/leaderboard.ts`

**Step 1: Create leaderboard service**

```typescript
// src/firebase/leaderboard.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  where,
} from 'firebase/firestore';
import { db } from './config';

export type LeaderboardEntry = {
  odea: string;
  nickname: string;
  score: number;
  updatedAt: string;
};

export type LeaderboardType = 'totalScore' | 'bestThrow';

// Get top 100 for a leaderboard
export async function getLeaderboard(type: LeaderboardType): Promise<LeaderboardEntry[]> {
  try {
    const collectionName = type === 'totalScore' ? 'leaderboard_total' : 'leaderboard_throw';
    const q = query(
      collection(db, collectionName),
      orderBy('score', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as LeaderboardEntry);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

// Get user's rank in a leaderboard
export async function getUserRank(type: LeaderboardType, userId: string): Promise<number | null> {
  try {
    const collectionName = type === 'totalScore' ? 'leaderboard_total' : 'leaderboard_throw';
    const userDoc = await getDoc(doc(db, collectionName, userId));

    if (!userDoc.exists()) return null;

    const userScore = userDoc.data().score;

    // Count users with higher scores
    const q = query(
      collection(db, collectionName),
      where('score', '>', userScore)
    );

    const snapshot = await getDocs(q);
    return snapshot.size + 1; // Rank is count of higher scores + 1
  } catch (error) {
    console.error('Error fetching user rank:', error);
    return null;
  }
}

// Update user's score (only if it's a new personal best)
export async function updateLeaderboardScore(
  type: LeaderboardType,
  userId: string,
  nickname: string,
  newScore: number
): Promise<boolean> {
  try {
    const collectionName = type === 'totalScore' ? 'leaderboard_total' : 'leaderboard_throw';
    const docRef = doc(db, collectionName, userId);
    const existingDoc = await getDoc(docRef);

    // Only update if new score is higher
    if (existingDoc.exists()) {
      const currentScore = existingDoc.data().score;
      if (newScore <= currentScore) {
        return false; // Not a new record
      }
    }

    const entry: LeaderboardEntry = {
      odea: odea,
      nickname,
      score: newScore,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, entry);
    return true;
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    return false;
  }
}

// Get user's entry for a specific leaderboard
export async function getUserLeaderboardEntry(
  type: LeaderboardType,
  userId: string
): Promise<LeaderboardEntry | null> {
  try {
    const collectionName = type === 'totalScore' ? 'leaderboard_total' : 'leaderboard_throw';
    const docRef = doc(db, collectionName, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as LeaderboardEntry;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user entry:', error);
    return null;
  }
}
```

**Step 2: Commit**

```bash
git add src/firebase/leaderboard.ts
git commit -m "feat: create leaderboard service for Firebase"
```

---

### Task 3.2: Create Leaderboard UI Component

**Files:**
- Create: `src/components/LeaderboardScreen.tsx`

**Step 1: Create leaderboard screen**

```typescript
// src/components/LeaderboardScreen.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  getLeaderboard,
  getUserRank,
  type LeaderboardEntry,
  type LeaderboardType,
} from '@/firebase/leaderboard';
import { useUser } from '@/contexts/UserContext';
import type { Theme } from '@/game/themes';

type LeaderboardScreenProps = {
  theme: Theme;
  onClose: () => void;
};

export function LeaderboardScreen({ theme, onClose }: LeaderboardScreenProps) {
  const { profile, firebaseUser } = useUser();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('totalScore');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLeaderboard = useCallback(async (type: LeaderboardType) => {
    setIsLoading(true);

    const [leaderboardData, rank] = await Promise.all([
      getLeaderboard(type),
      firebaseUser ? getUserRank(type, firebaseUser.uid) : null,
    ]);

    setEntries(leaderboardData);
    setUserRank(rank);
    setIsLoading(false);
  }, [firebaseUser]);

  useEffect(() => {
    loadLeaderboard(activeTab);
  }, [activeTab, loadLeaderboard]);

  const handleTabChange = (tab: LeaderboardType) => {
    setActiveTab(tab);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.9)' }}
      onClick={onClose}
    >
      <div
        className="max-w-md w-full max-h-[85vh] overflow-hidden rounded-lg flex flex-col"
        style={{ background: theme.uiBg, border: `2px solid ${theme.accent1}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: theme.accent3 }}>
          <h2 className="text-lg font-bold" style={{ color: theme.accent1 }}>
            Leaderboards
          </h2>
          <button
            onClick={onClose}
            className="text-xl px-2"
            style={{ color: theme.uiText }}
          >
            x
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: theme.accent3 }}>
          <button
            className="flex-1 py-2 text-sm font-bold transition-colors"
            style={{
              background: activeTab === 'totalScore' ? theme.accent1 : 'transparent',
              color: activeTab === 'totalScore' ? theme.background : theme.uiText,
            }}
            onClick={() => handleTabChange('totalScore')}
          >
            Total Score
          </button>
          <button
            className="flex-1 py-2 text-sm font-bold transition-colors"
            style={{
              background: activeTab === 'bestThrow' ? theme.accent1 : 'transparent',
              color: activeTab === 'bestThrow' ? theme.background : theme.uiText,
            }}
            onClick={() => handleTabChange('bestThrow')}
          >
            Best Throw
          </button>
        </div>

        {/* Your Rank */}
        {profile && userRank && (
          <div
            className="px-4 py-3 text-center"
            style={{ background: `${theme.highlight}20`, borderBottom: `1px solid ${theme.accent3}` }}
          >
            <span style={{ color: theme.uiText }}>Your Rank: </span>
            <span className="font-bold font-mono" style={{ color: theme.highlight }}>
              #{userRank.toLocaleString()}
            </span>
            <span style={{ color: theme.uiText }}> as </span>
            <span className="font-bold" style={{ color: theme.accent1 }}>
              {profile.nickname}
            </span>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="text-center py-8" style={{ color: theme.uiText }}>
              Loading...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8" style={{ color: theme.uiText }}>
              No entries yet. Be the first!
            </div>
          ) : (
            <div className="space-y-1">
              {entries.map((entry, index) => {
                const isCurrentUser = firebaseUser?.uid === entry.odea;
                const rank = index + 1;

                return (
                  <div
                    key={entry.odea}
                    className="flex items-center gap-3 px-3 py-2 rounded"
                    style={{
                      background: isCurrentUser ? `${theme.highlight}30` :
                                  rank <= 3 ? `${theme.accent1}10` : 'transparent',
                    }}
                  >
                    {/* Rank */}
                    <div
                      className="w-8 text-center font-bold font-mono"
                      style={{
                        color: rank === 1 ? '#FFD700' :
                               rank === 2 ? '#C0C0C0' :
                               rank === 3 ? '#CD7F32' :
                               theme.uiText,
                      }}
                    >
                      {rank <= 3 ? ['1st', '2nd', '3rd'][rank - 1] : `#${rank}`}
                    </div>

                    {/* Nickname */}
                    <div
                      className="flex-1 font-bold truncate"
                      style={{ color: isCurrentUser ? theme.highlight : theme.uiText }}
                    >
                      {entry.nickname}
                      {isCurrentUser && <span className="text-xs ml-1">(you)</span>}
                    </div>

                    {/* Score */}
                    <div
                      className="font-mono font-bold"
                      style={{ color: theme.accent1 }}
                    >
                      {activeTab === 'totalScore'
                        ? entry.score.toLocaleString()
                        : entry.score.toFixed(4)
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          className="px-4 py-2 text-xs text-center opacity-60"
          style={{ color: theme.uiText, borderTop: `1px solid ${theme.accent3}` }}
        >
          Top 100 shown. Updates on new personal bests.
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/LeaderboardScreen.tsx
git commit -m "feat: create LeaderboardScreen component with tabs"
```

---

### Task 3.3: Integrate Leaderboard Button

**Files:**
- Modify: `src/components/Game.tsx`

**Step 1: Add leaderboard state and button**

Add imports:

```typescript
import { LeaderboardScreen } from './LeaderboardScreen';
```

Add state:

```typescript
const [showLeaderboard, setShowLeaderboard] = useState(false);
```

Add button near the stats button:

```typescript
<button
  className="px-2 py-1 rounded text-xs"
  style={{ background: theme.uiBg, border: `1px solid ${theme.accent1}` }}
  onClick={() => setShowLeaderboard(true)}
>
  Leaderboard
</button>
```

Add screen render:

```typescript
{showLeaderboard && (
  <LeaderboardScreen theme={theme} onClose={() => setShowLeaderboard(false)} />
)}
```

**Step 2: Commit**

```bash
git add src/components/Game.tsx
git commit -m "feat: add leaderboard button and screen integration"
```

---

## Phase 4: Score Submission

### Task 4.1: Create Score Sync Service

**Files:**
- Create: `src/firebase/scoreSync.ts`

**Step 1: Create score sync service**

```typescript
// src/firebase/scoreSync.ts
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './config';
import { updateLeaderboardScore } from './leaderboard';

export async function syncScoreToFirebase(
  userId: string,
  nickname: string,
  totalScore: number,
  bestThrow: number
): Promise<{ totalUpdated: boolean; throwUpdated: boolean }> {
  const results = {
    totalUpdated: false,
    throwUpdated: false,
  };

  try {
    // Update user profile
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const currentData = userDoc.data();
      const updates: Record<string, number> = {};

      if (totalScore > (currentData.totalScore || 0)) {
        updates.totalScore = totalScore;
      }
      if (bestThrow > (currentData.bestThrow || 0)) {
        updates.bestThrow = bestThrow;
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(userRef, updates);
      }
    }

    // Update leaderboards (only on personal best)
    results.totalUpdated = await updateLeaderboardScore('totalScore', userId, nickname, totalScore);
    results.throwUpdated = await updateLeaderboardScore('bestThrow', userId, nickname, bestThrow);

    return results;
  } catch (error) {
    console.error('Error syncing score to Firebase:', error);
    return results;
  }
}
```

**Step 2: Commit**

```bash
git add src/firebase/scoreSync.ts
git commit -m "feat: create score sync service for Firebase"
```

---

### Task 4.2: Integrate Score Submission

**Files:**
- Modify: `src/game/engine/update.ts`
- Modify: `src/components/Game.tsx`

**Step 1: Add callback type to GameUI**

In `update.ts`, extend the GameUI type:

```typescript
export type GameUI = {
  // ... existing fields
  onNewPersonalBest?: (totalScore: number, bestThrow: number) => void;
};
```

**Step 2: Trigger callback on personal best**

After updating `state.best` or `state.totalScore` with a new record:

```typescript
// After a new best throw:
if (newBest) {
  ui.onNewPersonalBest?.(state.totalScore, state.best);
}
```

**Step 3: Wire up in Game.tsx**

```typescript
import { syncScoreToFirebase } from '@/firebase/scoreSync';
import { useUser } from '@/contexts/UserContext';

const { profile, firebaseUser } = useUser();

const handleNewPersonalBest = useCallback(async (totalScore: number, bestThrow: number) => {
  if (firebaseUser && profile) {
    await syncScoreToFirebase(
      firebaseUser.uid,
      profile.nickname,
      totalScore,
      bestThrow
    );
  }
}, [firebaseUser, profile]);

// Pass to update function:
const ui: GameUI = {
  // ... existing fields
  onNewPersonalBest: handleNewPersonalBest,
};
```

**Step 4: Commit**

```bash
git add src/game/engine/update.ts src/components/Game.tsx
git commit -m "feat: integrate score submission on personal bests"
```

---

## Phase 5: Cross-Device Sync

### Task 5.1: Create Sync Merge Logic

**Files:**
- Create: `src/firebase/sync.ts`

**Step 1: Create sync service with merge logic**

```typescript
// src/firebase/sync.ts
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from './config';
import { type UserProfile } from './auth';
import {
  loadJson,
  loadNumber,
  loadStringSet,
  saveJson,
  saveNumber,
  saveStringSet,
  loadString,
  saveString,
} from '@/game/storage';

export type LocalData = {
  totalScore: number;
  bestThrow: number;
  achievements: string[];
  unlockedThemes: string[];
  stats: UserProfile['stats'];
  settings: UserProfile['settings'];
};

// Load all local data
export function getLocalData(): LocalData {
  return {
    totalScore: loadNumber('total_score', 0, 'omf_total_score'),
    bestThrow: loadNumber('best', 0, 'omf_best'),
    achievements: [...loadStringSet('achievements', 'omf_achievements')],
    unlockedThemes: [...loadStringSet('unlocked_themes', 'omf_unlocked_themes')],
    stats: loadJson('stats', {
      totalThrows: 0,
      successfulLandings: 0,
      totalDistance: 0,
      perfectLandings: 0,
      maxMultiplier: 1,
    }, 'omf_stats'),
    settings: {
      reduceFx: loadJson('reduce_fx', false, 'omf_reduce_fx'),
      themeId: loadString('theme_id', 'flipbook', 'omf_theme_id'),
      audioVolume: loadNumber('audio_volume', 0.7, 'omf_audio_volume'),
      audioMuted: loadJson('audio_muted', false, 'omf_audio_muted'),
    },
  };
}

// Save all data locally
export function saveLocalData(data: LocalData) {
  saveNumber('total_score', data.totalScore);
  saveNumber('best', data.bestThrow);
  saveStringSet('achievements', new Set(data.achievements));
  saveStringSet('unlocked_themes', new Set(data.unlockedThemes));
  saveJson('stats', data.stats);
  saveJson('reduce_fx', data.settings.reduceFx);
  saveString('theme_id', data.settings.themeId);
  saveNumber('audio_volume', data.settings.audioVolume);
  saveJson('audio_muted', data.settings.audioMuted);
}

// Merge local and cloud data (keep highest/best)
export function mergeData(local: LocalData, cloud: Partial<LocalData>): LocalData {
  return {
    // Keep highest scores
    totalScore: Math.max(local.totalScore, cloud.totalScore || 0),
    bestThrow: Math.max(local.bestThrow, cloud.bestThrow || 0),

    // Union of achievements and themes
    achievements: [...new Set([...local.achievements, ...(cloud.achievements || [])])],
    unlockedThemes: [...new Set([...local.unlockedThemes, ...(cloud.unlockedThemes || [])])],

    // Keep highest stats
    stats: {
      totalThrows: Math.max(local.stats.totalThrows, cloud.stats?.totalThrows || 0),
      successfulLandings: Math.max(local.stats.successfulLandings, cloud.stats?.successfulLandings || 0),
      totalDistance: Math.max(local.stats.totalDistance, cloud.stats?.totalDistance || 0),
      perfectLandings: Math.max(local.stats.perfectLandings, cloud.stats?.perfectLandings || 0),
      maxMultiplier: Math.max(local.stats.maxMultiplier, cloud.stats?.maxMultiplier || 1),
    },

    // Use local settings (most recent device wins)
    settings: local.settings,
  };
}

// Sync data after Google account link
export async function syncAfterGoogleLink(userId: string): Promise<LocalData> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  const localData = getLocalData();

  if (userDoc.exists()) {
    const cloudData = userDoc.data() as Partial<LocalData>;
    const mergedData = mergeData(localData, cloudData);

    // Save merged data locally
    saveLocalData(mergedData);

    // Update cloud with merged data
    await updateDoc(userRef, {
      totalScore: mergedData.totalScore,
      bestThrow: mergedData.bestThrow,
      achievements: mergedData.achievements,
      unlockedThemes: mergedData.unlockedThemes,
      stats: mergedData.stats,
      settings: mergedData.settings,
    });

    return mergedData;
  }

  return localData;
}

// Pull data from cloud on login
export async function pullCloudData(userId: string): Promise<LocalData | null> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const cloudData = userDoc.data() as LocalData;
    const localData = getLocalData();
    const mergedData = mergeData(localData, cloudData);

    // Save merged data locally
    saveLocalData(mergedData);

    return mergedData;
  }

  return null;
}
```

**Step 2: Commit**

```bash
git add src/firebase/sync.ts
git commit -m "feat: create sync service with merge logic for cross-device sync"
```

---

### Task 5.2: Create Google Link UI

**Files:**
- Modify: `src/components/StatsOverlay.tsx` or create `src/components/SettingsSection.tsx`

**Step 1: Add Google link button to settings area**

```typescript
import { linkGoogleAccount } from '@/firebase/auth';
import { syncAfterGoogleLink } from '@/firebase/sync';
import { useUser } from '@/contexts/UserContext';

// In component:
const { profile, firebaseUser, refreshProfile } = useUser();

const handleLinkGoogle = async () => {
  if (!firebaseUser) return;

  const success = await linkGoogleAccount();
  if (success) {
    await syncAfterGoogleLink(firebaseUser.uid);
    await refreshProfile();
    // Show success message
  }
};

// In render:
{profile && !profile.googleLinked && (
  <button
    onClick={handleLinkGoogle}
    className="w-full py-2 rounded text-sm"
    style={{ background: theme.accent2, color: theme.background }}
  >
    Link Google Account for Cloud Sync
  </button>
)}

{profile?.googleLinked && (
  <div className="text-xs text-center opacity-70" style={{ color: theme.uiText }}>
    Google account linked - your progress syncs across devices
  </div>
)}
```

**Step 2: Commit**

```bash
git add src/components/StatsOverlay.tsx
git commit -m "feat: add Google account linking UI for cross-device sync"
```

---

## Phase 6: Firestore Security Rules

### Task 6.1: Create Firestore Rules

**Files:**
- Create: `firestore.rules`

**Step 1: Create security rules**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own profile
    match /users/{odea} {
      allow read: if request.auth != null && request.auth.uid == odea;
      allow create: if request.auth != null && request.auth.uid == odea;
      allow update: if request.auth != null && request.auth.uid == odea
        // Validate score updates are reasonable
        && request.resource.data.totalScore <= 10000000
        && request.resource.data.bestThrow <= 420;
    }

    // Nicknames - only createable, not deleteable
    match /nicknames/{nickname} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.odea == request.auth.uid;
    }

    // Leaderboards - readable by all, writable by owner
    match /leaderboard_total/{odea} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == odea
        && request.resource.data.score <= 10000000
        && request.resource.data.score >= 0;
    }

    match /leaderboard_throw/{odea} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == odea
        && request.resource.data.score <= 420
        && request.resource.data.score >= 0;
    }
  }
}
```

**Step 2: Commit**

```bash
git add firestore.rules
git commit -m "feat: add Firestore security rules with basic validation"
```

---

### Task 6.2: Create Firebase Indexes

**Files:**
- Create: `firestore.indexes.json`

**Step 1: Create index configuration**

```json
{
  "indexes": [
    {
      "collectionGroup": "leaderboard_total",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "score", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "leaderboard_throw",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "score", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Step 2: Commit**

```bash
git add firestore.indexes.json
git commit -m "feat: add Firestore index configuration for leaderboards"
```

---

## Summary

| Phase | Feature | Files |
|-------|---------|-------|
| 1 | Firebase Setup | config.ts, package.json, .env.example |
| 2 | User Identity | auth.ts, NicknameModal.tsx, UserContext.tsx |
| 3 | Leaderboard Service | leaderboard.ts, LeaderboardScreen.tsx |
| 4 | Score Submission | scoreSync.ts, update.ts, Game.tsx |
| 5 | Cross-Device Sync | sync.ts, StatsOverlay.tsx |
| 6 | Security Rules | firestore.rules, firestore.indexes.json |

**Total:** 6 phases, ~12 tasks, ~10 new files, modifications to ~5 existing files
