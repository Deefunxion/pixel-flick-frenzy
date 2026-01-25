# Changelog

All notable changes to One-More-Flick are documented in this file.

## [Unreleased] - 2026-01-24

### Added - Arcade Mode (10 Levels)
- **Star-based objectives**: Two independent stars per level
  - ★ Land beyond target distance (410-419)
  - ★★ Collect all doodles in circular sequence (Bomb Jack style)
  - **Pass requirement**: Collect all doodles (any order) to unlock next level
- **Progressive difficulty**: Level 1 (410) to Level 10 (419)
- **Doodle collectibles**: Two size classes (small/large), coin and star sprites
  - Circular sequence tracking (can start from any doodle)
  - Visual feedback: glow, pulse, collection particles
- **Directional springs**: Up, up-left, up-right, down impulses for trajectory manipulation
- **Portal teleportation**: Entry/exit pairs for instant screen traversal
- **Level Select screen**: View all levels with star progress
- **Visual level editor**: Dev tool (Ctrl+E) for designing levels
  - Tool selection: doodle, spring, portal, eraser
  - Export/import JSON for level data
  - Test level directly from editor
- **Cloud sync**: Arcade progress synced to localStorage (Firestore planned)
- **New components**: `ArcadeHUD.tsx`, `LevelSelect.tsx`, `LevelEditor.tsx`
- **New module**: `src/game/engine/arcade/`
  - `types.ts` - Type definitions for doodles, springs, portals, stars
  - `levels-data.json` - Level definitions (JSON, editable via Level Editor)
  - `levels.ts` - Imports JSON and exports ARCADE_LEVELS
  - `state.ts` - Arcade state management and star tracking
  - `doodles.ts`, `doodlesRender.ts` - Doodle system and rendering
  - `springs.ts`, `springsRender.ts` - Spring system and rendering
  - `portal.ts`, `portalRender.ts` - Portal system and rendering

### Enhanced - Level Editor (2026-01-25)
- **Direct save to code**: Vite plugin writes directly to `levels-data.json`
  - No clipboard needed - click 💾 Save and it's done
  - Hot reload picks up changes immediately
- **100 levels support**: Dropdown shows levels 1-100 (✓ marks existing)
- **Property panel**: Right-side panel for editing selected objects
  - Doodles: sprite, size, scale (0.5x-3x), rotation (0°-360°)
  - Springs: direction, strength (0.5x-3x), scale (0.5x-2x)
  - Portals: exitDirection, exitSpeed, scale
- **Drag to reposition**: Select tool (✋) allows dragging objects
- **Undo/Redo**: Ctrl+Z / Ctrl+Y with full history
- **Delete shortcut**: Del or Backspace to remove selected object
- **Actual sprite previews**: Shows real coin/star images, not placeholders
- **Selection highlight**: Blue outline on selected objects

### Enhanced - Portal System (2026-01-25)
- **Exit directions**: Portals can launch player in 3 directions
  - `straight` (→): Horizontal launch
  - `up-45` (↗): 45° upward launch
  - `down-45` (↘): 45° downward launch
- **Exit speed**: Configurable launch velocity multiplier (0.5x-3x)
- **Bidirectional**: Can enter from either side, exit on opposite side
- **Visual indicator**: Exit portal shows direction arrow (→, ↗, ↘)

### Enhanced - Asset Properties (2026-01-25)
- **Doodle scale**: Custom size multiplier affects both visuals and hitbox
- **Doodle rotation**: 0°-360° rotation with counter-rotated sequence badge
- **Spring strength**: Impulse force multiplier
- **Spring scale**: Visual size and collision radius
- **Portal scale**: Affects both entry and exit portal size

### Added - Pattern Solving Layer (Bomb Jack-style Air Control)
- **New Air Control System**: Replaced simple tap/hold with Bomb Jack-inspired mechanics
  - **Tap = Float**: Brief gravity reduction (50% for 300ms), costs 5 stamina
  - **Rapid taps = Extended float**: Chain taps for longer hover time
  - **Hold = Hard brake**: Progressive velocity reduction, costs 15 stamina/sec
  - Stamina costs scale with edge proximity (1x at 350px → 2x at 419px)

- **Bounce Surfaces**: Bank-shot puzzle mechanic
  - Spawns 60% of throws at random positions
  - Two visual types: "eraser" (pink rectangle) and "cloud" (white puff)
  - Physics-based reflection with restitution (0.65-0.9)
  - Enables reaching otherwise impossible route nodes
  - **New files**: `bounce.ts`, `bounceRender.ts`

- **Routes System**: Ordered node sequences for combo objectives
  - Physics-based generation ensures all nodes are reachable
  - Without bounce: nodes must descend (gravity constraint)
  - With bounce: can reach ascending nodes after bouncing
  - Hand-drawn wobbly circle indicators matching game aesthetic
  - Visual feedback: completed (green), current (pulsing white), upcoming (faint gray)
  - **New files**: `routes.ts`, `routeJuice.ts`

- **Contracts System**: Varied objectives with constraints and rewards
  - Objective types: complete route, collect N rings, land in zone
  - Constraint types: max stamina usage, no brakes, limited brake taps
  - Rewards: 3-10 permanent throws based on difficulty
  - Difficulty adapts after consecutive failures
  - **New files**: `contracts.ts`, `contractRender.ts`

- **Route Juice**: Visual/audio feedback for route completion
  - Popup text: "ROUTE 1!", "ROUTE 2!", "COMBO!"
  - Purple/blue color theme (distinct from ring green/gold)
  - Particle bursts on node completion
  - Ascending C major chord audio (C5 → E5 → G5)

### Technical - Pattern Solving Layer
- Extended `GameState` with: `airControl`, `bounce`, `activeRoute`, `activeContract`, `routeJuicePopups`, `staminaUsedThisThrow`
- Extended `AirControl` interface: `throttleActive`, `brakeTaps`, `recentTapTimes`, `isHoldingBrake`
- New functions: `applyAirThrottle()`, `applyBounce()`, `checkRouteNodeProgress()`, `evaluateContract()`
- Routes/bounce/contracts generated at `resetPhysics()` for pre-throw visibility
- 20 new tests for air throttle, bounce, routes, and contracts

### Added - Achievement Expansion
- **194 achievements** (up from 14), rewarding every decimal digit of progress:
  - **Distance (61 achievements)**: 400-419 whole numbers, 419.1-419.9, 419.91-419.99, 419.991-419.999, 419.9991-419.9999
  - **Zeno Levels (15)**: 1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 40, 50, 75, 100, 200
  - **Perfect Landings (12)**: 1-10,000 milestone tiers
  - **Total Throws (14)**: 50-1,000,000 milestone tiers
  - **Score (13)**: 500-10,000,000 milestone tiers
  - **Multiplier (5)**: 2x-6x
  - **Streaks (18)**: Hot streak, safe landings, session marathon
  - **Rings (14)**: Total rings, perfect ring throws
  - **Air Time (10)**: 1-10 seconds
  - **Falls (10)**: 1-10,000 (persistence humor)
  - **Landings (10)**: 1-10,000 successful landings
- **Achievement tiers**: Bronze, Silver, Gold, Platinum, Diamond, Mythic
- **Tier-based throw rewards**: 5, 10, 20, 30, 50, 100 throws per tier
- **Max air time tracking**: New stat for air time achievements
- **New files**: `achievementGenerators.ts`

### Added - Rings System
- **3 moving ring targets per throw** with different motion patterns:
  - Ring 1 (100-180px): Oscillation - large vertical swings (40-80px)
  - Ring 2 (200-320px): Circular orbit - sweeping circles (35-70px radius)
  - Ring 3 (330-400px): Lissajous figure-8 - complex 2D paths (50-90px × 35-65px)
- **Escalating score multipliers**: 1.1x → 1.25x → 1.5x (total 2.0625x for all 3)
- **Visual effects**: Glow, pulse animation, expand + fade on collection, particle burst
- **Audio feedback**: Ascending A major chord (440Hz → 554Hz → 659Hz) with bonus flourish
- **Ring stats tracking**: totalRingsPassed, maxRingsInThrow, perfectRingThrows
- **4 ring achievements**:
  - `ring_rookie`: Pass through your first ring
  - `ring_collector`: Pass through 100 rings total
  - `ring_master`: Pass through all 3 rings in one throw
  - `triple_threat`: Get all 3 rings in 10 different throws
- **New files**: `rings.ts`, `ringsRender.ts`

### Added - Streak Achievements (Phase 1)
- **4 new achievements** expanding the achievement system from 10 to 14:
  - `hot_streak_5` (Hot Streak): Land 5 consecutive throws at 419+
  - `hot_streak_10` (On Fire): Land 10 consecutive throws at 419+
  - `untouchable` (Untouchable): Land 10 times without falling
  - `marathon` (Marathon): Make 50 throws in one session
- **New state tracking**:
  - `sessionThrows`: Session-volatile counter (resets on page load)
  - `landingsWithoutFall`: Streak counter (resets on fall)
- **Phase 2 (Ring achievements) and Phase 3 (Challenge achievements)** planned for after respective systems are implemented

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

### Added - Page Flip Transition
- **Notebook page turn effect** between throws:
  - Canvas snapshot capture at throw completion
  - 2D slice-based curl animation (32 slices)
  - Ruled paper background for flipbook theme
  - Film strip background for noir theme
  - Drop shadow under curling page
  - Specular highlight on fold edge
  - Corner dog-ear effect
  - ~450ms duration with easeInOutCubic
- **Audio feedback**: Paper whoosh and settle sounds
- **Haptic feedback**: 10ms vibration on mobile
- **Accessibility**: Respects `reduceFx` setting (skip animation)
- **New files**: `pageFlip.ts`, `pageFlipRender.ts`

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
