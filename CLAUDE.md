# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install    # Install dependencies
npm run dev    # Start development server (Vite)
npm run build  # Production build
npm run lint   # Run ESLint
npm run preview # Preview production build
```

## Architecture

This is a single-page React game called "One-More-Flick" - a minimalist pixel-art flicking game rendered on a 64x64 canvas.

### Tech Stack
- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui components
- React Router (single route at `/`)
- TanStack Query (available but not currently used)

### Key Files
- `src/components/Game.tsx` - Core game logic: canvas rendering, physics simulation (gravity, wind, friction), input handling, particle effects, and local storage for high scores
- `src/pages/Index.tsx` - Main page wrapper
- `src/App.tsx` - App shell with routing and providers
- `src/lib/utils.ts` - Tailwind merge utility (`cn`)
- `src/components/ui/` - shadcn/ui component library (pre-configured)

### Game Mechanics (in Game.tsx)
The game uses a single canvas with requestAnimationFrame loop. Key state includes:
- Player position/velocity physics
- Charge-and-release power/angle system (hold SPACE to charge)
- Wind resistance that changes every 5 attempts
- Mid-air nudge mechanic (one-time use per throw)
- Trail/particle rendering with aging
- Screen shake on landing

### Path Aliases
`@/` maps to `src/` (configured in vite and tsconfig)
