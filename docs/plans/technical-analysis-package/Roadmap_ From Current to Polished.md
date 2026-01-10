# Roadmap: From Current to Polished

Αυτό είναι ένα ρεαλιστικό, **incremental roadmap** για να φτάσουμε από το τρέχον state στο target vision. Είναι χωρισμένο σε 4 sprints, καθένα με clear goal και visible outcome.

---

## Sprint 1: The Living World (1-2 Weeks)

**Goal:** Να κάνουμε τον κόσμο να νιώθει hand-drawn και textured, όχι procedural.

### Tasks:

1.  **Implement Cross-Hatching System:**
    *   **File:** `src/game/engine/sketchy.ts`
    *   **Action:** Δημιούργησε μια νέα function `drawCrossHatch()` που σχεδιάζει cross-hatching lines μέσα σε ένα given rectangle.
    *   **Prompt for Claude:** "Create a function `drawCrossHatch(ctx, x, y, width, height, density, angle1, angle2)` in `sketchy.ts`. It should use `drawHandLine` to draw two sets of parallel lines at different angles to create a cross-hatch texture."

2.  **Create Enhanced Cloud Platforms:**
    *   **File:** `src/game/engine/sketchy.ts`
    *   **Action:** Δημιούργησε μια νέα function `drawDetailedCloud()` που χρησιμοποιεί `drawHandCircle()` για το outline, `drawCrossHatch()` για το fill, και προσθέτει decorative curls.
    *   **Prompt for Claude:** "Create a function `drawDetailedCloud(ctx, x, y, width, height, nowMs)` in `sketchy.ts`. It should draw a cloud with a textured, hand-drawn feel by combining multiple circles for the outline and using the new `drawCrossHatch` function for the fill. Add small spiral curls at the edges."

3.  **Integrate New Clouds:**
    *   **File:** `src/game/engine/render.ts`
    *   **Action:** Αντικατάστησε την τρέχουσα λογική σχεδίασης των platforms με κλήσεις στο `drawDetailedCloud()`.

### ✅ **Outcome of Sprint 1:**
Το παιχνίδι θα έχει **textured, hand-drawn clouds** αντί για τα απλά scribbles. Ο κόσμος θα νιώθει αμέσως πιο πλούσιος και καλλιτεχνικός.

---

## Sprint 2: Bring It to Life (1-2 Weeks)

**Goal:** Να προσθέσουμε δυναμισμό και feedback με ένα particle system.

### Tasks:

1.  **Create Particle System Architecture:**
    *   **File:** `src/game/engine/particles.ts` (New file)
    *   **Action:** Δημιούργησε μια `ParticleSystem` class με `emit()`, `update()`, και `render()` methods. Όρισε το `Particle` interface.
    *   **Prompt for Claude:** "Create a new file `src/game/engine/particles.ts`. Inside, define a `Particle` interface and a `ParticleSystem` class. The class should manage an array of particles and have methods to `emit`, `update`, and `render` them. The update method should handle basic physics like velocity and gravity."

2.  **Implement Particle Types:**
    *   **File:** `src/game/engine/particles.ts`
    *   **Action:** Μέσα στο `render()` του particle system, πρόσθεσε λογική για να σχεδιάζεις κάθε particle type:
        *   **Energy Swirls:** Μικρές, κυκλικές κινήσεις.
        *   **Dust Clouds:** Μικρά, expanding circles με fade-out.
        *   **Debris:** Μικρά, ακανόνιστα shapes που ακολουθούν βαλλιστική τροχιά.
        *   **Impact Cracks:** Στατικές γραμμές που εμφανίζονται και μετά εξαφανίζονται.

3.  **Integrate Particle System:**
    *   **File:** `src/game/Game.tsx`
    *   **Action:** Δημιούργησε ένα instance του `ParticleSystem` και κάλεσε τα `update()` και `render()` μέσα στο game loop.
    *   **File:** `src/game/engine/render.ts`
    *   **Action:** Κάλεσε το `particleSystem.emit()` στα σωστά σημεία (e.g., `emit('swirl', ...)` όταν ο Zeno φορτίζει, `emit('dust', ...)` όταν προσγειώνεται).

### ✅ **Outcome of Sprint 2:**
Το παιχνίδι θα έχει **energy swirls, dust clouds, και impact effects**. Κάθε action θα έχει visual feedback, κάνοντας το gameplay πολύ πιο satisfying.

---

## Sprint 3: Character & Personality (1 Week)

**Goal:** Να δώσουμε στον Zeno την ηρωική προσωπικότητα που του αξίζει.

### Tasks:

1.  **Refine Zeno's Poses:**
    *   **File:** `src/game/engine/sketchy.ts`
    *   **Action:** Μέσα στο `drawStickFigure()`, αναβάθμισε τη λογική για κάθε state:
        *   **`charging` state:** Υλοποίησε το **"The Coil"** pose. Deep crouch, πόδι πίσω, χέρια σε wind-up.
        *   **`flying` state:** Refine το animation για να ταιριάζει με το **"The Bolt"** pose. Superman-style, streamlined.
        *   **`landing` state:** Υλοποίησε το **"The Impact"** pose. Three-point superhero landing.
    *   **Prompt for Claude:** "In `drawStickFigure` inside `sketchy.ts`, modify the drawing logic for the 'charging', 'flying', and 'landing' states to match the new iconic poses: The Coil, The Bolt, and The Impact. Use the existing state machine but change the arm, leg, and body positions to create these specific, dynamic poses."

### ✅ **Outcome of Sprint 3:**
Ο Zeno θα έχει **τρεις διακριτές, δυναμικές poses** που αλλάζουν ανάλογα με το gameplay. Το character animation θα είναι εκφραστικό και ηρωικό.

---

## Sprint 4: The Final Polish (1 Week)

**Goal:** Να τελειοποιήσουμε τις λεπτομέρειες και το UI.

### Tasks:

1.  **Polish UI Buttons:**
    *   **File:** `src/components/GameUI.css` (or similar)
    *   **Action:** Άλλαξε το στυλ των buttons για να είναι filled, με hand-drawn borders. Χρησιμοποίησε SVG filters ή `border-image` για το hand-drawn effect.

2.  **Add Decorative Details:**
    *   **File:** `src/game/engine/sketchy.ts`
    *   **Action:** Δημιούργησε μια function `drawDecorativeCurl()` και πρόσθεσε curls στα UI elements (e.g., γωνίες των buttons, wind indicator).

3.  **Style Trajectory Arc:**
    *   **File:** `src/game/engine/sketchy.ts`
    *   **Action:** Αναβάθμισε το `drawDashedCurve()` για να σχεδιάζει την τροχιά με varying line thickness και wobble, δίνοντάς της hand-drawn feel.

### ✅ **Outcome of Sprint 4:**
Το UI θα είναι **polished και cohesive** με το υπόλοιπο art style. Όλο το παιχνίδι θα δείχνει τελειωμένο και προσεγμένο μέχρι την τελευταία λεπτομέρεια.

---

## Συνολική Στρατηγική

Αυτό το roadmap είναι σχεδιασμένο για **maximum impact, minimum risk**. Κάθε sprint χτίζει πάνω στο προηγούμενο και παραδίδει ένα **ορατό, testable feature**. Ακολουθώντας αυτή τη σειρά, θα δεις το παιχνίδι να μεταμορφώνεται σταδιακά, χωρίς να σπάσει ποτέ η build.
