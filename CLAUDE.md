# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start development server (Vite)
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build locally

# Local development with Firebase Emulators (recommended)
npm run emulators      # Start Auth + Firestore emulators (needs Java)
npm run dev:emulators  # Start Vite with emulator connection
npm run emulators:dev  # Run both together (uses concurrently)
# Emulator UI: http://localhost:4000

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

### Animation System (`src/game/engine/`)

The character "Zeno" uses a sprite-based animation system:

- **`spriteConfig.ts`** - Sprite sheet configuration and animation definitions
- **`animator.ts`** - `Animator` class: handles frame timing, playback, rendering
- **`animationController.ts`** - State machine that determines which animation to play

**Sprite Sheet Format:**
- Single horizontal strip: `zeno-flipbook.png` (6400×128 px)
- 50 frames total, each 128×128 pixels
- Display size in-game: 50×50 pixels

**Animation Flow:**
```
idle → coil → launch → fly → descend → touchdown → slide → win
                                    ↘ lose (if fell off)
```

**Animations (9 total):**
| Name | Frames | FPS | Loop | Notes |
|------|--------|-----|------|-------|
| idle | 0-3 | 3 | Yes | Breathing animation |
| coil | 4-12 | 4 | No | Charging sequence (9 frames) |
| launch | 13-16 | 8 | No | Jump initiation |
| fly | 17-22 | 4 | Yes | Ascending/horizontal flight |
| descend | 23-28 | 4 | Yes | Falling down |
| touchdown | 29 | 1 | No | Landing impact (1 frame) |
| slide | 30-33 | 10 | No | Slides then holds on last frame |
| win | 34-35 | 1 | No | Random frame selection |
| lose | 36-49 | 6 | No | Fall/defeat sequence (14 frames) |

**Sprite Source Files:** `public/assets/sprites/sprites_for_sheets/` contains organized folders (0.idle through 8.lose) with individual PNG frames.

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
Always update @CHANGELOG.md after big changes