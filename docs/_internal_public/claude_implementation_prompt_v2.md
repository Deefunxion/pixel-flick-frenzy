# Art Direction 2.0: Implementation Guide for Claude

> **Role:** Art Director & Technical Artist
> **Mission:** Purge the outdated "lean" pose from the codebase and implement the new, dynamic three-pose system for Zeno: "The Coil," "The Bolt," and "The Impact."

---

## 1. Context: The Problem & The Solution

We have a problem: the original "lean" pose for Zeno is passive, lacks energy, and does not represent the game's core dynamic. It has been officially deprecated.

The solution is a new, three-pose system that embodies **superhero energy**:

1.  **The Coil (Wind-Up):** A powerful, crouched pose for gathering energy before the jump.
2.  **The Bolt (Flight):** A dynamic, streamlined pose for mid-air flight.
3.  **The Impact (Landing):** A classic, dramatic superhero landing pose.

Your task is to surgically remove all traces of the old "lean" pose and integrate the new assets and logic into the game.

---

## 2. Asset Inventory: Your New Toolkit

All new master assets are located in `/home/ubuntu/zeno-artwork-revision/`. This is your source of truth.

**Key Assets:**

*   `zeno-windup-flipbook.png` / `zeno-windup-noir.png`: Master illustrations for "The Coil."
*   `zeno-landing-flipbook.png` / `zeno-landing-noir.png`: Master illustrations for "The Impact."
*   `zeno-flight-dynamic-flipbook.png`: Master illustration for the new "Bolt" pose.
*   `app-icon-windup-flipbook-512.png` / `app-icon-windup-noir-512.png`: The new 512x512 app icons featuring "The Coil."

---

## 3. Step-by-Step Implementation Plan

Execute these tasks sequentially. Do not proceed to the next task until the current one is complete and verified.

### **Task 3.1: Purge the "Lean" Assets**

Your first and most critical task is to remove the old art. Delete the following files and any other assets that use the "lean" pose:

1.  **Delete Master Illustrations:**
    *   `public/assets/brand/zeno-lean-flipbook.png`
    *   `public/assets/brand/zeno-lean-noir.png`
    *   `public/assets/brand/zeno-lean-flipbook.svg` (if it exists)
    *   `public/assets/brand/zeno-lean-noir.svg` (if it exists)

2.  **Delete All Old App Icons:**
    *   Navigate to `public/assets/icons/flipbook/` and `public/assets/icons/noir/`.
    *   Delete **all** icon files: `android-chrome-*.png`, `apple-touch-icon-*.png`, `favicon-*.png`, `icon-*.png`.

3.  **Search and Destroy:**
    *   Perform a global search in the codebase for the string `zeno-lean` and remove any references.

**Verification:** After this step, the project should have no app icons and the old master illustrations should be gone.

### **Task 3.2: Install New App Icons**

Now, you will install the new, energetic app icons featuring "The Coil" pose.

1.  **Source Files:**
    *   `/home/ubuntu/zeno-artwork-revision/app-icon-windup-flipbook-512.png`
    *   `/home/ubuntu/zeno-artwork-revision/app-icon-windup-noir-512.png`

2.  **Action:**
    *   Use an image editing tool or script to generate all required icon sizes (512x512, 192x192, 180x180, 32x32, 16x16) from the source files.
    *   Place the newly generated icons into their respective theme folders: `public/assets/icons/flipbook/` and `public/assets/icons/noir/`.
    *   Ensure the file names match the standard PWA and favicon conventions.

**Verification:** The app should now display the new "Coil" pose icon correctly in the browser tab and on mobile devices.

### **Task 3.3: Integrate Poses into Game Logic**

This is where you bring the new poses to life in the game itself.

1.  **Analyze `sketchy.ts` and `render.ts`:**
    *   Review how the player character (Zeno) is currently drawn.
    *   Identify the player's state machine (e.g., `isCharging`, `isInAir`, `hasLanded`).

2.  **Implement "The Coil" (Wind-Up):**
    *   Modify the rendering logic so that when the player is in the `isCharging` state (holding down to gather power), the game draws a representation of **"The Coil"** pose instead of the old animation.
    *   You may need to create a new drawing function in `sketchy.ts` called `drawZenoCoil()` that draws a simplified, procedural version of the pose.

3.  **Implement "The Impact" (Landing):**
    *   Create a new player state, e.g., `isLanding`.
    *   Trigger this state for a brief moment (e.g., 200-300ms) immediately after a successful landing.
    *   Modify the rendering logic to draw a representation of **"The Impact"** pose during this state. You may need a new `drawZenoImpact()` function in `sketchy.ts`.

4.  **Enhance "The Bolt" (Flight):**
    *   Review the current mid-air animation. Ensure it reflects the dynamic, forward-leaning energy of the new "Bolt" master illustration.
    *   Adjust the procedural animation to be more streamlined and less like a passive fall.

**Verification:** Play the game. You should see Zeno enter "The Coil" pose when charging, fly in a more dynamic "Bolt" pose, and briefly strike "The Impact" pose upon landing.

### **Task 3.4: Update Documentation**

Finally, update the project's internal documentation to reflect the new art direction.

1.  **Open `ARTISTIC_THEME_PLAN.md` and any other relevant design documents.**
2.  **Remove all references to the "lean" pose.**
3.  **Add a new section describing the three iconic poses:** "The Coil," "The Bolt," and "The Impact," using the descriptions from this prompt.

**Verification:** The project's documentation is now consistent with the new art direction.

---

## 4. Final Deliverable

Once all tasks are complete and verified, commit all changes to the repository with a clear and descriptive commit message:

```
feat(art): Implement Art Direction 2.0 - The Three Iconic Poses

- Purged all instances of the deprecated "lean" pose.
- Replaced all app icons with the new "The Coil" (wind-up) pose.
- Integrated "The Coil" pose into the pre-jump charging animation.
- Added a new "The Impact" (superhero landing) pose animation on successful landing.
- Updated art direction documentation to reflect the new three-pose system.
```
