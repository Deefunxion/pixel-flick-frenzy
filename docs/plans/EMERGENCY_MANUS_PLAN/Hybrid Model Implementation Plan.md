# Hybrid Model Implementation Plan

## 1. Overview

This document provides a step-by-step implementation plan for transitioning the One-More-Flick game to a **Hybrid Model**, where the character (Zeno) is rendered using sprite-based animations, while the environment (platforms, background) remains procedurally generated. This plan is designed to be executed in a series of manageable sprints, each with a clear goal and a testable outcome.

**Total Estimated Time:** 10-12 hours

## 2. Prerequisites

Before starting, we need the actual sprite sheet assets. We will use placeholder assets for now, but the final implementation will require the real, hand-drawn sprite sheets.

-   `public/assets/sprites/zeno-flipbook-spritesheet.png`
-   `public/assets/sprites/zeno-noir-spritesheet.png`

## 3. Sprint 1: The Foundation - Asset Loading & Sprite Class (3 hours)

**Goal:** Create the core classes for loading and drawing static sprites. By the end of this sprint, we will be able to manually draw a single sprite frame on the screen.

### Task 1.1: Create the AssetLoader

-   **Action:** Create a new file `src/game/engine/assets.ts`.
-   **Content:** Implement the `AssetLoader` class as defined in the *Sprite System Design Document*. It should handle loading images and caching them.

### Task 1.2: Create the Sprite Class

-   **Action:** Create a new file `src/game/engine/sprite.ts`.
-   **Content:** Implement the `Sprite` class. It should take an `HTMLImageElement` and frame coordinates, and have a `draw` method.

### Task 1.3: Create the Sprite Configuration

-   **Action:** Create a new file `src/game/engine/spriteConfig.ts`.
-   **Content:** Define the `ZENO_FLIPBOOK_CONFIG` and `ZENO_NOIR_CONFIG` constants. For now, we can use placeholder data for the frame coordinates.

### Task 1.4: Test Static Sprite Rendering

-   **Action:** Temporarily modify `Game.tsx`.
-   **Steps:**
    1.  Create an `AssetLoader` instance.
    2.  Call `assetLoader.loadImage()` to load the placeholder sprite sheet.
    3.  Once loaded, create a new `Sprite` instance representing the first frame.
    4.  In the main render loop, call `sprite.draw()` to render the static sprite at a fixed position (e.g., the center of the screen).
-   **Expected Outcome:** A single, static image of Zeno appears on the screen, drawn over the procedural background.

## 4. Sprint 2: Bringing Zeno to Life - The Animator (4 hours)

**Goal:** Implement the animation system to play back sequences of sprites. By the end, Zeno will have a looping idle animation.

### Task 2.1: Create the Animator Class

-   **Action:** Create a new file `src/game/engine/animator.ts`.
-   **Content:** Implement the `Animator` class as designed. It should manage multiple animations, handle frame timing, and have `play`, `update`, and `draw` methods.

### Task 2.2: Integrate the Animator into the Game State

-   **Action:** Modify `src/game/engine/types.ts`.
-   **Change:** Add `zenoAnimator: Animator | null;` to the `GameState` interface.

### Task 2.3: Initialize the Animator

-   **Action:** Modify `Game.tsx` (or a new initialization module).
-   **Steps:**
    1.  After loading the sprite sheet (from Sprint 1), use the `ZENO_FLIPBOOK_CONFIG` to create `Sprite` objects for each frame of the `idle` animation.
    2.  Create a `Map` where the key is `'idle'` and the value is an `Animation` object containing the frames.
    3.  Instantiate the `Animator` with this map.
    4.  Set `state.zenoAnimator` to this new instance.
    5.  Call `state.zenoAnimator.play('idle')`.

### Task 2.4: Update and Render the Animation

-   **Action:** Modify `update.ts` and `render.ts`.
-   **In `update.ts`:** In the `updateGame` function, add a call to `state.zenoAnimator?.update(deltaTime)`.
-   **In `render.ts`:** In the main `renderFrame` function, replace the temporary `sprite.draw()` call with `state.zenoAnimator?.draw(ctx, state.px, state.py, ZENO_WIDTH, ZENO_HEIGHT)`.
-   **Expected Outcome:** Zeno is now rendered at his correct position, playing a looping idle animation.

## 5. Sprint 3: Full Integration - State-Driven Animation (3 hours)

**Goal:** Connect the animation system to the game's state machine, so Zeno's animations change based on his actions (charging, flying, landing).

### Task 3.1: Load All Animations

-   **Action:** Modify the initialization logic in `Game.tsx`.
-   **Change:** Expand the animator setup to create and load all animations defined in `spriteConfig.ts` (`coil`, `bolt`, `impact`), not just `idle`.

### Task 3.2: Implement State-Driven Animation Logic

-   **Action:** Modify `update.ts` or `render.ts` (wherever the character state logic resides).
-   **Change:** Implement the logic to switch animations. This will replace the old procedural `drawZeno*` calls.

    ```typescript
    // Example logic
    if (state.zenoAnimator) {
      const animator = state.zenoAnimator;
      let desiredAnimation: AnimationName | null = null;

      if (state.failureAnimating) {
        desiredAnimation = 'fail'; // Assuming a 'fail' animation exists
      } else if (state.charging) {
        desiredAnimation = 'coil';
      } else if (state.flying) {
        desiredAnimation = 'bolt';
      } else if (state.landingFrame > 0 && state.landingFrame < 15) {
        desiredAnimation = 'impact';
      } else {
        desiredAnimation = 'idle';
      }

      if (desiredAnimation && animator.currentAnimation !== desiredAnimation) {
        animator.play(desiredAnimation);
      }
    }
    ```

### Task 3.3: Refine Render Call

-   **Action:** Modify `render.ts`.
-   **Change:** Ensure the main player rendering block is now just a single call to `state.zenoAnimator.draw()`. The logic for *which* animation to play now lives in the `update` loop.

-   **Expected Outcome:** Zeno now correctly displays the `coil` animation when charging, the `bolt` animation when flying, and the `impact` animation upon landing. The old procedural stick figure is completely gone.

## 6. Sprint 4: Polish and Cleanup (2 hours)

**Goal:** Finalize the integration, clean up old code, and ensure everything is working smoothly.

### Task 4.1: Theme Switching

-   **Action:** Implement logic to switch between the `ZENO_FLIPBOOK_CONFIG` and `ZENO_NOIR_CONFIG` when the theme changes. This will likely involve re-initializing the `Animator` with the correct sprite sheet and configuration.

### Task 4.2: Remove Old Code (Optional but Recommended)

-   **Action:** Once the sprite system is confirmed to be working perfectly, the old procedural functions (`drawStickFigure`, `drawZenoCoil`, etc.) can be deprecated or removed from `sketchy.ts` to clean up the codebase.

### Task 4.3: Final Testing

-   **Action:** Perform a full playthrough of the game.
-   **Checklist:**
    -   [ ] Do all animations trigger correctly?
    -   [ ] Is the animation timing (FPS) correct?
    -   [ ] Does theme switching work with the new sprite sheets?
    -   [ ] Is there any noticeable performance degradation?
    -   [ ] Are there any visual artifacts?

## 7. Post-Implementation

Once this plan is complete, the game will have a robust, extensible sprite animation system. Adding new characters, effects, or animations will be as simple as:

1.  Adding a new sprite sheet to `public/assets/sprites/`.
2.  Creating a new configuration object in `spriteConfig.ts`.
3.  Initializing a new `Animator` for the new element.

This architecture provides a solid foundation for all future artistic development.
