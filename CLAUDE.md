# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start development server (Vite)
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build locally

# Deployment (Firebase Hosting)
npm run build && firebase deploy --only hosting
firebase deploy --only firestore:rules,firestore:indexes  # Deploy security rules

# itch.io packaging
npm run package:itch   # Build + create one-more-flick-itch.zip
npm run deploy:itch    # Package + push to itch.io via butler
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

### Game Engine (`src/game/`)

The game uses a separation between React state (UI) and game state (physics/rendering):

- **`engine/types.ts`** - `GameState` interface: physics, particles, trails, achievements, cinematic effects
- **`engine/state.ts`** - `createInitialState()`, `resetPhysics()` for state management
- **`engine/update.ts`** - `updateFrame()` advances physics each frame, handles state transitions (charging → flying → sliding → landed/fell)
- **`engine/render.ts`** - `renderFrame()` draws to canvas based on current theme
- **`engine/particles.ts`** - Particle system for visual effects
- **`engine/achievements.ts`** - Achievement definitions and unlock logic
- **`constants.ts`** - Canvas 480×240, cliff edge at x=420, launch pad at x=30

`Game.tsx` sets up input handlers and a `requestAnimationFrame` loop that calls `updateFrame()` then `renderFrame()`.

### Firebase (`src/firebase/`)

**Collections:**
- `users/{uid}` - User profiles (scores, achievements, settings)
- `nicknames/{nickname}` - Nickname reservation (lowercase, 3-12 chars)
- `leaderboard_total/{uid}` - Total score leaderboard (max 10M)
- `leaderboard_throw/{uid}` - Best throw leaderboard (max 420)
- `leaderboard_falls/{uid}` - Total falls leaderboard

**Security Rules** (`firestore.rules`):
- Users can only write their own data
- Scores can only increase (anti-cheat)
- Nickname enumeration prevented (get only, no list)

### Key Gameplay Constants
- Canvas: 480×240, cliff edge at x=420
- Charge time: 1800ms, power range: 3–10, angle range: 20°–70°
- Zeno target: moves halfway to edge each level

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
