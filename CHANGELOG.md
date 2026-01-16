# Changelog

All notable changes to One-More-Flick are documented in this file.

## [Unreleased] - 2026-01-16

### Added
- **9-Animation System**: Replaced old 5-animation system with comprehensive 9-animation set
  - `idle` (4 frames): Breathing animation
  - `coil` (9 frames): Charging/power-up sequence
  - `launch` (4 frames): Jump initiation
  - `fly` (6 frames): Ascending/horizontal flight
  - `descend` (6 frames): Falling down
  - `touchdown` (1 frame): Landing impact
  - `slide` (4 frames): Ground sliding, holds on last frame
  - `win` (2 frames): Victory celebration with random frame selection
  - `lose` (14 frames): Fall/defeat sequence

- **Animation Controller**: New state machine in `animationController.ts`
  - Properly triggers `launch` animation during first 15 frames after release
  - Triggers `descend` when vertical velocity > 1.5
  - Triggers `win` after successful landing (not sliding, not fell off)
  - Maintains animation state across transitions

- **Random Win Animation**: `Animator.play()` randomly selects one of two win poses

- **Dev Mode Skip**: Added "Skip (Dev Mode)" button to nickname modal for faster development iteration
  - Only visible in `import.meta.env.DEV` mode
  - Skips onboarding without creating a profile

- **Onboarding Cache**: LocalStorage caching of onboarding completion
  - Prevents nickname modal from appearing on every page refresh
  - Key: `onboarding_complete`

### Changed
- **Sprite Sheet**: New `zeno-flipbook.png` (6400×128 px, 50 frames)
  - All frames in single horizontal row
  - 128×128 pixels per frame
  - Created from organized source files in `sprites_for_sheets/`

- **Animation Timing**: Optimized frame rates for smoother gameplay
  - `idle`: 3 fps (slow breathing)
  - `coil`: 4 fps (visible charge-up)
  - `fly`/`descend`: 4 fps (moderate flight)
  - `slide`: 10 fps (fast transition, holds on last frame)
  - `lose`: 6 fps

- **Slide Behavior**: Now plays through frames 1-3 quickly, then holds on frame 4 for the duration of the slide (`loop: false`)

### Fixed
- **Spastic Animations**: Reduced frame rates and frame counts to prevent jerky movements
- **Missing Animation Triggers**: `launch`, `descend`, and `win` animations now properly trigger based on game state
- **Win Not Showing**: Fixed condition where win animation wouldn't play after slide sequence
- **Nickname Modal Spam**: Fixed modal appearing on every refresh by caching onboarding completion in localStorage

### Technical
- Updated `spriteConfig.ts` with new animation definitions
- Updated `animationController.ts` with complete state machine
- Updated `animator.ts` with random frame selection for win
- Updated `UserContext.tsx` with skip functionality and caching
- Updated `NicknameModal.tsx` with skip button
- Updated `Game.tsx` to pass `skipOnboarding` prop

---

## Previous Releases

### Safari Crash Fix & iOS Improvements
- Fixed Safari crash issues
- Added Sentry integration for error tracking
- Improved iOS audio UX
- Fixed nickname race conditions

### Power Meter & Zeno System
- Added power meter bounce effect
- iOS compatibility fixes
- Implemented Zeno decimal scoring system

### Noir Sprite Sheet
- Added noir theme sprite sheet with new frames
- Theme switching capability between flipbook and noir
