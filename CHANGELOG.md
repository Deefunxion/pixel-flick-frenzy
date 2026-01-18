# Changelog

All notable changes to One-More-Flick are documented in this file.

## [Unreleased] - 2026-01-18

### Added - Tutorial System
- **Contextual Tutorials**: Speech bubble overlays that appear at key moments
  - **Charge tutorial**: Triggers on first touch (hold to charge, drag to aim)
  - **Air tutorial**: Triggers at flight apex (TAP = float, HOLD = brake)
  - **Slide tutorial**: Triggers on landing (TAP = slide, HOLD = brake)
  - 4-second duration with 5% game speed (very slow-mo for reading)
  - Progress bar shows remaining time
  - localStorage persistence (`tutorial_*_seen` keys)
  - Replay button (?) to reset all tutorials

### Added - Air Float Mechanic
- **Tap = Float**: During flight, tapping now reduces gravity (50% for 0.3s) instead of braking
  - Costs 5 stamina (scaled by edge proximity)
  - Creates "floaty" feel for precision landing
- **Hold = Brake**: Still reduces velocity for emergency stops

### Added - Hand-Drawn UI Assets
- **New UI asset system**: `src/game/engine/uiAssets.ts` with centralized asset paths
- **Replaced text labels with hand-drawn images**:
  - LAST, TARGET, VS (level) labels in hero row
  - SCORE, BEST labels in secondary row
  - Leaderboard button
  - Stats button
  - Help/Tutorial (?) button
  - Volume on/off icons
  - Control directions (TAP FLOAT | HOLD BRAKE)
- **Noir theme support**: `filter: invert(1)` for dark mode compatibility
- **Assets location**: `public/assets/ui/elements/transparent/`

### Added - Precision Bar System
- **Visual precision indicator**: Animated bar showing landing accuracy
  - Appears after successful landing
  - Color-coded segments (green → yellow → red)
  - Particle effects on high precision
- **Audio feedback**: Tension drone, close-call sounds, personal best ding
- **New files**: `precisionBar.ts`, `precisionRender.ts`

### Changed
- **Top button row reorganized**: [Help + Sound] | [Leaderboard] | [Stats]
- **Control tips**: Replaced complex HTML with single hand-drawn image

### Fixed
- **First-throw slow-motion frustration**: New players experienced 30+ second slow-motion on their first throw, making the game feel broken
  - Slow-motion effects now require unlocking the "Bullet Time" achievement (land beyond 400)
  - New players get full-speed gameplay until they master the mechanics
  - Achievement-gated features: edge proximity slow-mo, record zone bullet time, cinematic zone effects, heartbeat audio

### Added - Precision Mechanics
- **Stamina System**: 100-unit resource pool per throw for precision control
  - Resets to full on each new throw
  - Shared between air brake and slide control
  - Edge proximity scaling increases costs near cliff (350-420)

- **Air Brake** (during flight):
  - Tap: 5% velocity reduction, costs 5 * edgeMultiplier stamina
  - Hold: 3%/frame velocity reduction, costs 15/sec * edgeMultiplier stamina
  - Use case: Fine-tune landing position mid-air

- **Slide Control** (during ground slide):
  - Tap: +0.15 velocity in travel direction, costs 8 * edgeMultiplier stamina
  - Hold: 2.5x friction (brake), costs 10/sec * edgeMultiplier stamina
  - Use case: Extend to reach target or brake before falling off

- **Edge Proximity Scaling**: Stamina costs increase quadratically near cliff edge (350-420)
  - Position 350: 1.0x multiplier
  - Position 400: 1.5x multiplier
  - Position 419: ~2.0x multiplier

- **Stamina UI**:
  - Bar above Zeno (hidden when full)
  - Color coding: Green (>50%), Yellow (25-50%), Red (<25%)
  - Flashing effect when low
  - Shake effect when action denied

- **Audio Feedback**:
  - Air brake tap/hold sounds
  - Slide extend/brake sounds
  - Low stamina warning beep
  - Action denied error buzz

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

- **File-Based Audio System**: Replaced synthesized sounds with real audio files
  - Uses Kenney.nl CC0 sounds (short, game-ready, ~74KB total)
  - Hybrid approach: file-based audio with synth fallback if files fail to load
  - New sounds: charge (phaserUp6), whoosh (phaseJump1), impact (impactMetal), slide (lowRandom), win (threeTone1), record-break (zapThreeToneUp), failure (phaserDown2)
  - Audio files stored in `/public/assets/audio/game/` as .ogg
  - New `audioFiles.ts` module for loading and managing audio buffers
  - Added slide sound on landing, win sound on successful landing

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

### Technical - Precision Mechanics
- New `precision.ts` module with edge multiplier and control functions
- Extended `GameState` with stamina, precisionInput, and staminaDeniedShake
- Precision applied flag prevents double-dipping on landing frame
- Unit tests for all precision mechanics in `__tests__/precision.test.ts` and `__tests__/stamina.test.ts`
- Updated `render.ts` with stamina bar UI rendering
- Extended `GameAudio` type with precision control sounds

### Technical
- Updated `spriteConfig.ts` with new animation definitions
- Updated `animationController.ts` with complete state machine
- Updated `animator.ts` with random frame selection for win
- Updated `UserContext.tsx` with skip functionality and caching
- Created `audioFiles.ts` for WebAudio buffer management and file playback
- Updated `audio.ts` with hybrid functions (file + synth fallback)
- Updated `Game.tsx` to load audio files during initialization
- Updated `update.ts` with `GameAudio` type for slide/win sounds
- Audio files: charge.wav, whoosh.wav, impact-soft.wav, impact-hard.wav, slide.wav, win.wav, record-break.wav, failure.wav
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
