# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start development server (Vite)
npm run build     # Production build
npm run lint      # Run ESLint

# Deployment (Firebase Hosting)
npm run build && firebase deploy --only hosting
firebase deploy --only firestore:rules,firestore:indexes  # Deploy security rules
```

## Architecture

**One-More-Flick** is a single-page React game with Firebase backend for multiplayer leaderboards and cross-device sync.

### Tech Stack
- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui components
- Firebase Auth (Anonymous + Google linking)
- Firestore (user profiles, leaderboards)
- WebAudio API for SFX
- LocalStorage for local persistence

### Project Structure
```
src/
├── components/
│   ├── Game.tsx           # Main game: input, state, UI, game loop
│   ├── NicknameModal.tsx  # First-time onboarding
│   ├── LeaderboardScreen.tsx # Top 100 + user rank
│   └── StatsOverlay.tsx   # Stats + Google account linking
├── contexts/
│   └── UserContext.tsx    # Firebase user state management
├── firebase/
│   ├── config.ts          # Firebase initialization (uses env vars)
│   ├── auth.ts            # Auth: anonymous, Google link, profiles
│   ├── leaderboard.ts     # Leaderboard queries (top 100, rank)
│   ├── scoreSync.ts       # Sync scores on personal best
│   └── sync.ts            # Cross-device merge logic
├── game/
│   ├── engine/            # Physics, rendering, achievements
│   ├── constants.ts       # Canvas 480×240, cliff edge x=420
│   ├── themes.ts          # flipbook, noir themes
│   ├── audio.ts           # WebAudio SFX
│   └── storage.ts         # LocalStorage helpers
└── pages/Index.tsx
```

### Firebase Collections
- `users/{uid}` - User profiles (scores, achievements, settings)
- `nicknames/{nickname}` - Nickname reservation (lowercase)
- `leaderboard_total/{uid}` - Total score leaderboard
- `leaderboard_throw/{uid}` - Best throw leaderboard

### Game Loop
`Game.tsx` sets up input handlers and a `requestAnimationFrame` loop that calls:
1. `updateFrame()` — advances physics, handles state transitions (charging → flying → sliding → landed/fell)
2. `renderFrame()` — draws everything to the canvas based on current theme

### Key Game Constants (`src/game/constants.ts`)
- Canvas: 480×240, cliff edge at x=420
- Launch pad at x=30
- Charge time: 1800ms, power range: 3–10, angle range: 20°–70°

### Gameplay Mechanics
- **Charge-and-release**: Hold SPACE/tap to charge power, release to launch
- **Angle control**: Drag up/down or arrow keys while charging
- **Zeno target**: Beat the moving target (halfway to edge) to level up
- **Risk/reward multiplier**: Score multiplier increases as you approach the edge
- **Themes**: Unlockable via achievements (synthwave, noir, golf)

### Path Aliases
`@/` maps to `src/` (configured in vite.config.ts and tsconfig.json)

## Deployment

**Production URL:** https://one-more-flick.web.app

**Firebase Project:** `one-more-flick`

**Environment Variables** (`.env` - not committed):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

**Manual deploy workflow:**
1. `npm run build` (embeds env vars)
2. `firebase deploy --only hosting`

## Security Rules

`firestore.rules` enforces:
- Users can only write their own data
- Scores can only increase (anti-cheat)
- Nickname enumeration prevented
- Score limits: max 420 throw, 10M total

## Current Status

**Branch:** `features/social` - Social features implementation complete

**Implemented:**
- Anonymous auth + Google account linking
- Unique nickname system (transactional)
- Leaderboards (Total Score / Best Throw)
- Score sync on personal bests
- Cross-device sync with merge logic

**Known Issues:**
- Mobile: nickname creation can be slow (15s timeout added)
- Ad blockers may block Firestore connections

**Next Steps:**
- Set up GitHub Actions for auto-deploy
- Enable Google Sign-in in Firebase Console for account linking
