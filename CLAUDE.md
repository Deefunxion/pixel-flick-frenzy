# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start development server (Vite)
npm run build     # Production build
npm run build:dev # Development build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

## Architecture

**One-More-Flick** is a single-page React game — a minimalist flicking arcade game rendered on a 480×240 canvas with multiple visual themes (default: hand-drawn "flipbook" aesthetic).

### Tech Stack
- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui components
- React Router (single route at `/`)
- WebAudio API for SFX
- LocalStorage for persistence

### Project Structure
```
src/
├── components/Game.tsx    # Main component: input handling, React state, UI chrome
├── game/
│   ├── engine/
│   │   ├── types.ts       # GameState interface and entity types
│   │   ├── state.ts       # State initialization and reset
│   │   ├── update.ts      # Physics simulation, collision, game logic per frame
│   │   ├── render.ts      # Canvas drawing (sky, grid, player, particles, HUD)
│   │   ├── achievements.ts# Achievement definitions and unlock logic
│   │   └── sketchy.ts     # Hand-drawn line rendering for flipbook theme
│   ├── constants.ts       # Game tuning: canvas size, physics, angles
│   ├── themes.ts          # Theme color definitions (flipbook, synthwave, noir, golf)
│   ├── audio.ts           # WebAudio: charge tone, impact, edge warning
│   ├── storage.ts         # LocalStorage helpers with versioning
│   └── goals.ts           # Session goal generation
├── pages/Index.tsx        # Page wrapper
└── components/ui/         # shadcn/ui component library
```

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
