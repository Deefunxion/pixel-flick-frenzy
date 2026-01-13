# Bug Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 4 critical bugs: Safari roundRect crash, missing Sentry logging, iOS audio UX, and nickname registration race conditions.

**Architecture:** Each fix is isolated and can be deployed independently. Priority order: roundRect (critical crash) → Sentry (visibility) → iOS audio UX (user experience) → nickname fixes (data integrity).

**Tech Stack:** Canvas API polyfill, Sentry React SDK, WebAudio API, Firebase transactions.

---

## Task 1: Canvas roundRect Polyfill (Critical - Fixes Safari Crash)

**Files:**
- Create: `src/game/engine/canvasPolyfills.ts`
- Modify: `src/main.tsx:1-5`

**Step 1: Create the polyfill file**

Create `src/game/engine/canvasPolyfills.ts`:

```typescript
/**
 * Canvas API polyfills for older browsers (Safari <16, iOS <16)
 * roundRect was added in Safari 16 (Sept 2022) - iPhone SE 2021 on iOS 15 crashes without this
 */

export function polyfillCanvas(): void {
  if (typeof CanvasRenderingContext2D === 'undefined') return;

  // Polyfill roundRect for Safari <16
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (
      x: number,
      y: number,
      width: number,
      height: number,
      radii?: number | DOMPointInit | (number | DOMPointInit)[]
    ): void {
      // Normalize radii to a single number (simplified - handles our use case)
      let r = 0;
      if (typeof radii === 'number') {
        r = radii;
      } else if (Array.isArray(radii) && radii.length > 0) {
        const first = radii[0];
        r = typeof first === 'number' ? first : (first as DOMPointInit).x ?? 0;
      } else if (radii && typeof radii === 'object') {
        r = (radii as DOMPointInit).x ?? 0;
      }

      // Clamp radius to half the smaller dimension
      r = Math.min(r, width / 2, height / 2);

      this.beginPath();
      this.moveTo(x + r, y);
      this.lineTo(x + width - r, y);
      this.arcTo(x + width, y, x + width, y + r, r);
      this.lineTo(x + width, y + height - r);
      this.arcTo(x + width, y + height, x + width - r, y + height, r);
      this.lineTo(x + r, y + height);
      this.arcTo(x, y + height, x, y + height - r, r);
      this.lineTo(x, y + r);
      this.arcTo(x, y, x + r, y, r);
      this.closePath();
    };
  }
}
```

**Step 2: Import and call polyfill in main.tsx**

Modify `src/main.tsx` to:

```typescript
import { createRoot } from "react-dom/client";
import { polyfillCanvas } from "./game/engine/canvasPolyfills";
import App from "./App.tsx";
import "./index.css";

// Apply polyfills before any canvas rendering
polyfillCanvas();

createRoot(document.getElementById("root")!).render(<App />);
```

**Step 3: Manual test on Safari**

Run: `npm run dev`
Test: Open in Safari (or iOS Simulator with iOS 15)
Expected: Game renders without "roundRect is not a function" error

**Step 4: Commit**

```bash
git add src/game/engine/canvasPolyfills.ts src/main.tsx
git commit -m "fix: add roundRect polyfill for Safari <16 (iOS <16)

Fixes crash on iPhone SE 2021 and other devices running iOS 15 or earlier.
Canvas roundRect() was added in Safari 16 (Sept 2022)."
```

---

## Task 2: Sentry Integration (Error Tracking)

**Files:**
- Create: `src/lib/sentry.ts`
- Modify: `src/main.tsx`
- Modify: `src/components/Game.tsx:503-515`
- Modify: `src/firebase/auth.ts:118-123`
- Modify: `src/contexts/UserContext.tsx:82-88`
- Modify: `.env.example` (create if not exists)

**Step 1: Install Sentry packages**

Run:
```bash
npm install @sentry/react
```

Expected: Package added to package.json dependencies

**Step 2: Create Sentry configuration file**

Create `src/lib/sentry.ts`:

```typescript
import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry(): void {
  // Skip if no DSN configured (local dev or itch.io build)
  if (!SENTRY_DSN) {
    console.log('[Sentry] No DSN configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,

    // Performance monitoring - sample 10% of transactions
    tracesSampleRate: 0.1,

    // Session replay - capture 10% normally, 100% on error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Filter out known non-actionable errors
    beforeSend(event) {
      // Ignore network errors from Firebase (handled by retry logic)
      if (event.exception?.values?.[0]?.value?.includes('network')) {
        return null;
      }
      return event;
    },
  });

  console.log('[Sentry] Initialized for environment:', import.meta.env.MODE);
}

/**
 * Capture an error with optional context
 * Use this instead of console.error for important errors
 */
export function captureError(
  error: Error | string,
  context?: Record<string, unknown>
): void {
  const err = typeof error === 'string' ? new Error(error) : error;

  console.error('[Error]', err.message, context);

  if (SENTRY_DSN) {
    Sentry.captureException(err, {
      extra: context,
    });
  }
}

/**
 * Set user context for error reports
 */
export function setUserContext(userId: string, nickname?: string): void {
  if (SENTRY_DSN) {
    Sentry.setUser({
      id: userId,
      username: nickname,
    });
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext(): void {
  if (SENTRY_DSN) {
    Sentry.setUser(null);
  }
}
```

**Step 3: Initialize Sentry in main.tsx**

Modify `src/main.tsx` to:

```typescript
import { createRoot } from "react-dom/client";
import { polyfillCanvas } from "./game/engine/canvasPolyfills";
import { initSentry } from "./lib/sentry";
import App from "./App.tsx";
import "./index.css";

// Initialize error tracking first
initSentry();

// Apply polyfills before any canvas rendering
polyfillCanvas();

createRoot(document.getElementById("root")!).render(<App />);
```

**Step 4: Update Game.tsx error handling**

Modify `src/components/Game.tsx` lines 503-515, replace:

```typescript
} catch (err: any) {
  console.error('[Game] Loop error:', err);
  errorRef.current = err.message;
```

With:

```typescript
} catch (err: any) {
  // Import at top of file: import { captureError } from '@/lib/sentry';
  captureError(err, {
    phase: state.phase,
    px: state.px,
    py: state.py,
    flying: state.flying,
  });
  errorRef.current = err.message;
```

Add import at top of Game.tsx:
```typescript
import { captureError } from '@/lib/sentry';
```

**Step 5: Update auth.ts error handling**

Modify `src/firebase/auth.ts` lines 118-123, replace:

```typescript
} catch (error) {
  // If transaction fails, sign out the anonymous user
  await auth.signOut();
  console.error('Error creating anonymous user:', error);
  throw error;
}
```

With:

```typescript
} catch (error) {
  // Import at top: import { captureError } from '@/lib/sentry';
  // If transaction fails, sign out the anonymous user
  await auth.signOut();
  captureError(error instanceof Error ? error : new Error(String(error)), {
    nickname: normalizedNickname,
    uid: user.uid,
    action: 'createAnonymousUser',
  });
  throw error;
}
```

Add import at top of auth.ts:
```typescript
import { captureError } from '@/lib/sentry';
```

**Step 6: Update UserContext.tsx error handling**

Modify `src/contexts/UserContext.tsx` lines 82-88, replace:

```typescript
init().catch((err) => {
  console.error('Failed to initialize user context:', err);
```

With:

```typescript
// Import at top: import { captureError } from '@/lib/sentry';
init().catch((err) => {
  captureError(err instanceof Error ? err : new Error(String(err)), {
    action: 'initUserContext',
  });
```

Add import at top of UserContext.tsx:
```typescript
import { captureError } from '@/lib/sentry';
```

**Step 7: Create .env.example**

Create `.env.example`:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Sentry Error Tracking (optional - leave empty to disable)
VITE_SENTRY_DSN=
```

**Step 8: Add VITE_SENTRY_DSN to .env**

Add to your `.env` file (get DSN from Sentry dashboard):
```bash
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

**Step 9: Test Sentry integration**

Run: `npm run dev`
Test: Trigger an error (e.g., temporarily add `throw new Error('Test')` in game loop)
Expected: Error appears in Sentry dashboard within 1-2 minutes

**Step 10: Commit**

```bash
git add src/lib/sentry.ts src/main.tsx src/components/Game.tsx src/firebase/auth.ts src/contexts/UserContext.tsx .env.example
git commit -m "feat: add Sentry error tracking integration

- Initialize Sentry on app start
- Capture errors with context in game loop, auth, and user context
- Include session replay for debugging
- Filter out network errors (handled by retry logic)"
```

---

## Task 3: iOS Audio UX Improvements

**Files:**
- Modify: `src/components/Game.tsx:717-724` (warning placement)
- Modify: `src/components/Game.tsx:700-714` (sound button)
- Modify: `src/components/Game.tsx:391-400` (unlock logic)

**Step 1: Create AudioWarningToast component**

Add this component inside Game.tsx (before the main Game component):

```typescript
// Add after imports, before const Game = () => {
type AudioWarningToastProps = {
  show: boolean;
  theme: Theme;
  onDismiss: () => void;
  onRetry: () => void;
};

function AudioWarningToast({ show, theme, onDismiss, onRetry }: AudioWarningToastProps) {
  if (!show) return null;

  return (
    <div
      className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50
                 px-4 py-3 rounded-lg shadow-lg max-w-xs animate-bounce"
      style={{
        backgroundColor: theme.uiBg,
        border: `2px solid ${theme.danger}`,
        boxShadow: `0 4px 20px ${theme.danger}40`
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔇</span>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: theme.danger }}>
            Sound Blocked
          </p>
          <p className="text-xs mt-1" style={{ color: theme.uiText, opacity: 0.8 }}>
            iOS requires a tap to enable audio
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={onRetry}
              className="px-3 py-1 rounded text-xs font-bold"
              style={{ backgroundColor: theme.accent1, color: theme.background }}
            >
              Enable Sound
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1 rounded text-xs"
              style={{ color: theme.uiText, opacity: 0.7 }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Update audio warning state and handlers**

In the Game component, find the `showAudioWarning` state and add a retry handler.
Add after line ~129:

```typescript
const handleAudioRetry = useCallback(async () => {
  const unlocked = await unlockAudioForIOS(audioRefs.current);
  setAudioContextState(getAudioState(audioRefs.current));
  if (unlocked) {
    setShowAudioWarning(false);
    // Play a test tone to confirm audio is working
    playTone(audioRefs.current, audioSettingsRef.current, 440, 0.1, 'sine', 0.05);
  }
}, []);
```

**Step 3: Replace inline warning with toast component**

Find lines 717-724 in Game.tsx (the inline audio warning) and DELETE them entirely.

Then add the toast at the bottom of the JSX, just before the closing `</div>` of the main container (around line 822):

```tsx
{/* iOS Audio Warning Toast - positioned as fixed overlay */}
<AudioWarningToast
  show={showAudioWarning}
  theme={theme}
  onDismiss={() => setShowAudioWarning(false)}
  onRetry={handleAudioRetry}
/>
```

**Step 4: Update sound button to show state**

Replace the sound button (lines ~701-714) with:

```tsx
<button
  className={buttonClass}
  style={{
    ...buttonStyle,
    // Highlight if audio is blocked
    borderColor: audioContextState === 'suspended' && !audioSettings.muted
      ? theme.danger
      : buttonStyle.borderColor,
  }}
  onClick={async () => {
    const ctx = ensureAudioContext(audioRefs.current);
    await resumeIfSuspended(audioRefs.current);
    setAudioContextState(getAudioState(audioRefs.current));
    setAudioSettings((s) => ({ ...s, muted: !s.muted }));
    setShowAudioWarning(false);
  }}
  aria-label="Toggle sound"
>
  {audioSettings.muted ? '🔇' : audioContextState === 'running' ? '🔊' : '🔈'}
</button>
```

**Step 5: Don't auto-hide warning**

In the handlePointerDown function (around line 396-400), remove the auto-hide timeout:

```typescript
// REMOVE these lines:
// setTimeout(() => setShowAudioWarning(false), 5000);
```

Keep the rest of the logic.

**Step 6: Manual test on iOS**

Run: `npm run dev`
Test: Open on iOS Safari with silent switch ON
Expected:
- Toast appears with "Sound Blocked" message
- "Enable Sound" button attempts to unlock
- Sound button shows 🔈 when blocked, 🔊 when working
- Toast stays until dismissed or audio unlocked

**Step 7: Commit**

```bash
git add src/components/Game.tsx
git commit -m "fix: improve iOS audio blocked UX

- Add visible toast notification when audio is blocked
- Show audio state in sound button icon (🔊/🔈/🔇)
- Add 'Enable Sound' retry button in toast
- Remove auto-dismiss (warning stays until resolved)
- Highlight sound button when audio needs attention"
```

---

## Task 4: Nickname Registration Race Condition Fix

**Files:**
- Modify: `src/firebase/auth.ts:55-124`
- Modify: `firestore.rules:19-28`

**Step 1: Update createAnonymousUser to check existing profile**

Modify `src/firebase/auth.ts` function `createAnonymousUser` (lines 55-124):

Replace the entire function with:

```typescript
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

    // Re-import at top if not already: import { captureError } from '@/lib/sentry';
    captureError(error instanceof Error ? error : new Error(String(error)), {
      nickname: normalizedNickname,
      uid: user.uid,
      action: 'createAnonymousUser',
    });
    throw error;
  }
}
```

**Step 2: Update Firestore rules to prevent duplicate nicknames per user**

Modify `firestore.rules` lines 19-28:

Replace the nicknames match block with:

```javascript
// Nicknames - get specific doc only (not list), only createable once per user
match /nicknames/{nickname} {
  allow get: if true; // Allow checking if nickname exists
  // No list permission (prevents enumeration)
  allow create: if request.auth != null
    && request.resource.data.uid == request.auth.uid
    && nickname.size() >= 3
    && nickname.size() <= 12
    // Only lowercase nicknames allowed (normalize on client)
    && nickname == nickname.lower();
  // No update or delete - nicknames are permanent
}
```

**Step 3: Deploy Firestore rules**

Run:
```bash
firebase deploy --only firestore:rules
```

Expected: Rules deployed successfully

**Step 4: Manual test nickname registration**

Run: `npm run dev`
Test scenarios:
1. Create new account with nickname "TestUser" - should succeed
2. Try same nickname in incognito - should fail with "already taken"
3. Rapidly tap "Join" button - should not create duplicates
4. Disconnect network mid-registration, reconnect, retry - should handle gracefully

**Step 5: Commit**

```bash
git add src/firebase/auth.ts firestore.rules
git commit -m "fix: prevent nickname duplication and race conditions

- Add pre-check for existing user profile before registration
- Add double-check inside transaction for race condition
- Only sign out if profile creation actually failed
- Update Firestore rules to enforce lowercase nicknames
- Add Sentry error tracking for registration failures"
```

---

## Final Task: Build and Deploy

**Step 1: Run full build**

```bash
npm run build
```

Expected: Build succeeds with no errors

**Step 2: Test production build locally**

```bash
npm run preview
```

Test all fixed scenarios:
- [ ] Safari iOS 15: No roundRect crash
- [ ] Audio warning toast appears and works
- [ ] Nickname registration works without duplicates
- [ ] Errors appear in Sentry dashboard

**Step 3: Deploy to Firebase**

```bash
firebase deploy --only hosting
```

**Step 4: Final commit with version bump**

```bash
git add -A
git commit -m "release: v1.1.0 - bug fixes for Safari, audio, and nickname registration"
git tag v1.1.0
```

---

## Summary

| Task | Files Changed | Risk | Dependencies |
|------|--------------|------|--------------|
| 1. roundRect polyfill | 2 | Low | None |
| 2. Sentry integration | 6 | Low | npm install |
| 3. iOS audio UX | 1 | Low | None |
| 4. Nickname race fix | 2 | Medium | firebase deploy |

**Estimated implementation time:** 45-60 minutes for all tasks.
