# Έρευνα: Πως Οι Indie Developers Φτιάχνουν "Hand-Drawn" Games

## Key Findings από Polygon Interview

### Τι Σημαίνει "Hand-Drawn" Στην Πράξη

**Cozy Grove (Spry Fox):**
- Χρησιμοποιούν digital stylus σε tablet
- Στόχος: να μοιάζει σαν ink και watercolor
- Κάθε γραμμή σχεδιάζεται manually
- "There's something very warm and personal about a hand-drawn line that varies ever so slightly in width"

**Mundaun (Michel Ziegler):**
- 3D models με hand-drawn textures
- Διαδικασία: Model → Print UV maps → Draw with pencil on paper → Scan → Apply to 3D model
- "I like unwieldy processes with an element of randomness"

**Before Your Eyes (Hana Lee):**
- Low-poly 3D models με hand-drawn textures
- 2D UI elements drawn digitally με rough brushes
- "I used a rough marker brush to make them literally look hand-drawn"

**If Found... (Liadh Young):**
- Πραγματικό diary με doodles → Scanned → Digital game
- Physical journal pages ως base

**Nobody Saves the World (Drinkbox Studios):**
- Frame-by-frame animation
- "We draw each frame of animation by hand"
- Χρησιμοποιούν Photoshop για κάθε frame

---

## Το Κοινό Pattern

**ΚΑΝΕΝΑ από αυτά τα games δεν χρησιμοποιεί procedural generation για τα visuals.**

Όλα χρησιμοποιούν:
1. **Hand-drawn assets** (είτε digital, είτε scanned από physical)
2. **Frame-by-frame animation** ή **sprite sheets**
3. **Texture atlases** με painted/drawn textures
4. **Modular assets** που μπορούν να reuse

---

## Γιατί Δεν Χρησιμοποιούν Procedural Generation

Από το Reddit thread "Why isn't hand-drawn art more widely used in 2D games?":

> "Hand-drawn art is EXPENSIVE. You need actual artists to draw every frame, every asset, every animation. Procedural generation can't replicate the warmth and personality of human-made art."

Από το άρθρο "Procedural Generation for sprites?":

> "There basically isn't any documentation for procedurally generating sprites besides level generation with premade assets."

---

## Το Verdict

**"Hand-drawn" games δεν είναι procedural.** Είναι **asset-based** με **human-created art**.

Το "hand-drawn feel" προέρχεται από:
- Actual human decisions για κάθε line
- Variations στο line weight
- Imperfections που δίνουν warmth
- Artistic composition

Αυτά **δεν μπορούν** να replicate με Canvas primitives και math formulas.
