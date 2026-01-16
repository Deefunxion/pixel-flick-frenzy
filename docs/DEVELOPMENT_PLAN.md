# One-More-Flick Development Plan

> Zeno's Paradox as a game. Chase the target, but 145 is forever unreachable.

---

## Current State (v1.0)
- [x] Core flick mechanics (charge, release, physics)
- [x] Zeno's Paradox scoring system
- [x] 8-decimal precision scoring
- [x] Wind mechanics
- [x] Nudge system (mid-air adjustment)
- [x] Mobile touch controls
- [x] Responsive design
- [x] GitHub Pages deployment

---

## Phase 1: Synthwave Visual Overhaul ✅
**Goal:** Transform 1-bit aesthetic to neon synthwave

| Feature | Description | Status |
|---------|-------------|--------|
| Color palette | Neon pink, cyan, purple, magenta | [x] |
| Grid background | Perspective grid with horizon | [x] |
| Parallax stars | Moving starfield layer | [x] |
| Neon glow effects | Bloom on player, trail, UI | [x] |
| Trail color change | Cyan trail when passing Zeno target | [x] |

---

## Phase 2: Cinematic Effects ✅
**Goal:** Add juice and impact to gameplay moments

| Feature | Description | Status |
|---------|-------------|--------|
| Slow-mo zoom | >90 throws trigger slow motion + zoom | [x] |
| Screen flash | White flash on Zeno level-up | [x] |
| Celebration particles | Explosion burst on level break | [x] |
| Screen shake enhancement | Intensity based on landing impact | [x] |
| Edge danger zone | Visual tension near 145 | [x] |

---

## Phase 3: Risk/Reward System ✅
**Goal:** Deeper scoring with multipliers

| Feature | Description | Status |
|---------|-------------|--------|
| Edge multiplier | Closer to 145 = higher multiplier | [x] |
| Perfect landing bonus | Exact Zeno target hit = bonus | [x] |
| Multiplier UI | Display current multiplier | [x] |
| Risk indicator | Visual warning near edge | [x] |

---

## Phase 4: Audio Design ✅
**Goal:** Synthwave soundscape

| Feature | Description | Status |
|---------|-------------|--------|
| Charge-up tone | Pleasant ascending tone (tempting to hold) | [x] |
| Zeno level-up jingle | Triumphant arpeggio | [x] |
| Wind ambient | Subtle whoosh based on strength | [x] |
| Landing impact | Satisfying thud variations | [x] |
| Edge warning | Tension tone near 145 | [x] |

---

## Phase 5: Meta Progression ✅
**Goal:** Long-term engagement

| Feature | Description | Status |
|---------|-------------|--------|
| Achievements | "First Zeno", "Level 5", "Perfect 140+" | [x] |
| Statistics | Throws, avg distance, success rate | [x] |
| Daily challenge | Fixed seed competition | [~] Deferred |
| Persistent account | Ever-increasing score (no reset) | [x] |

---

## Future Ideas Backlog
> Ideas from future brainstorming sessions go here

| Idea | Description | Priority | Session |
|------|-------------|----------|---------|
| | | | |

---

## Design Principles
1. **The limitation IS the design** - Constraints create meaning
2. **145 is unreachable** - Zeno's Paradox is sacred
3. **Juice everything** - Every action needs feedback
4. **Mobile-first** - Touch is primary input
5. **Ever-increasing** - Progress never resets

---

## Tech Decisions
- Canvas-based rendering (no WebGL)
- Web Audio API for sound
- localStorage for persistence
- No external game engines
- PWA-ready architecture

---

*Last updated: Brainstorming Session #2*
