# Engagement & Juice Systems Design

**Date:** 2026-01-21
**Status:** Ready for Implementation
**Goal:** Transform One-More-Flick from functional game to dopamine-rich, retention-optimized mobile experience

---

## Executive Summary

Το παιχνίδι έχει solid core loop αλλά λείπουν τα "layers of juice" που κρατούν τους παίκτες hooked. Αυτό το design καλύπτει 9 engagement systems που προσθέτουν visual + audio + UI feedback σε κάθε micro-action.

**Στόχος:** Κάθε action (charge, fly, collect ring, land) να έχει instant gratification feedback.

---

## The 9 Engagement Layers

| Layer | Name | Primary Impact |
|-------|------|----------------|
| 1 | Ring Collection Juice | Mid-air dopamine hits |
| 2 | In-Game Goal Tracking | Direction & purpose |
| 3 | Post-Throw Feedback | Landing satisfaction |
| 4 | Streak & Momentum | Chain psychology |
| 5 | Near-Miss Drama | Failure → motivation |
| 6 | Session Hooks | Return triggers |
| 7 | Live Stats | Competition feel |
| 8 | Pre-Launch Anticipation | Charge satisfaction |
| 9 | Mid-Air Control Juice | Control feedback |

---

## Layer 1: Ring Collection Juice

### Current State
- Particle burst on ring collect
- Sound effect (ascending chord)
- Ring fade-out
- Multiplier stored but **invisible until landing**

### Design

#### 1.1 Three-Step Feedback (per ring)
1. **Micro-freeze**: 60-90ms pause (skip if already in slow-mo)
2. **Burst + Shockwave**: Particles in ring color + subtle expanding shockwave
3. **UI Pop**: Text near ring position, floats up and fades

#### 1.2 Escalating Text
| Rings | Text | Extra Effect |
|-------|------|--------------|
| 1 | "Nice!" | — |
| 2 | "Great!" | Screen edge glow |
| 3 | "PERFECT!" | Full screen flash + special sound |

#### 1.3 Audio
- Short "coin" sound on collect
- Stereo pan based on ring X position (left ring = left speaker)
- Escalating pitch: Ring 1 → Ring 2 → Ring 3

#### 1.4 Multiplier Ladder UI
- HUD element showing current multiplier: "🎯 1.5x"
- Threshold ticks at: 1.5x / 2.0x / 2.5x / 3.0x
- Each threshold passed: haptic + tick sound + 1-frame HUD glow
- Cooldown: 300-500ms between ticks (prevent noise)

---

## Layer 2: In-Game Goal Tracking

### Current State
- Achievements hidden in Stats overlay
- "Almost There!" section requires opening menu
- Zero visibility during gameplay

### Design

#### 2.1 Mini Goal HUD (Always Visible)
- Position: Top-left, small and subtle
- Shows closest achievement/task:
  ```
  🎯 Land at 419+ (2/5) ▓▓░░░
  ```
- Progress bar animates in real-time
- Auto-updates when goal changes

#### 2.2 Progress Popup (Mid-Game)
- On progress: Brief slide-in toast
  - "🔥 Hot Streak 3/5!" (1.5s display)
- On complete: Celebration popup
  - "✅ HOT STREAK!" + confetti + reward callout

#### 2.3 Smart Goal Rotation
- Priority order:
  1. Daily tasks (time-sensitive)
  2. Near achievements (>50% progress)
  3. Long-term goals
- Smooth transition animation between goals

#### 2.4 "Next Up" Preview
- After achievement unlock:
- "Next: Reach Zeno Level 5 (3/5)"
- Appears briefly, gives immediate next target

---

## Layer 3: Post-Throw Feedback (Landing Grades)

### Current State
- Distance display
- Multiplier display
- Basic "Perfect!" text
- No differentiation between landing quality

### Design

#### 3.1 Grade System

| Grade | Criteria | Visual | Sound |
|-------|----------|--------|-------|
| **S** | Perfect target + 3 rings + clean stop | Gold stamp + sparkles + confetti | Fanfare |
| **A** | Near target + 2-3 rings | Silver stamp + shine | Success chime |
| **B** | Decent distance + 1-2 rings | Bronze stamp | Soft ding |
| **C** | Made it but sloppy | Gray stamp | Neutral |
| **D** | Barely landed / fell | Faded stamp | "womp" |

#### 3.2 Grade Calculation
```
Base Score:
- Distance from target: 0-40 points
- Rings passed: 0-30 points (10 per ring)
- Speed control: 0-20 points
- Edge proximity: 0-10 bonus

Grade Thresholds:
- S: 90+ points
- A: 70-89 points
- B: 50-69 points
- C: 30-49 points
- D: <30 points
```

#### 3.3 Stamp Animation
- Scale: 0 → 1.2 → 1.0 (slam effect)
- Duration: 400ms animation
- Linger: 1.5s before fade
- Confetti microburst for S/A grades

#### 3.4 Coach Comments
| Grade | Comments (rotate randomly) |
|-------|---------------------------|
| S | "FLAWLESS!" / "LEGENDARY!" / "Θρύλος!" |
| A | "Solid!" / "Clean run!" / "Καθαρό!" |
| B | "Not bad!" / "Getting there!" / "Οκ δουλειά!" |
| C | "Room to improve" / "Keep trying!" |
| D | "Ouch..." / "Shake it off!" |

#### 3.5 Quick Tips (C/D grades only)
- "Tip: Try less power next time"
- "Tip: Use brake near the edge"
- "Tip: Aim for the rings!"
- Helps learning without feeling punished

---

## Layer 4: Streak & Momentum System

### Current State
- `hotStreak` tracked internally
- `landingsWithoutFall` counter
- Achievements exist but invisible progress

### Design

#### 4.1 Streak Counter HUD
- Position: Top-right corner
- Display: 🔥 x3 (flame icon + number)
- Grows/pulses on increment

#### 4.2 Flame Color Escalation
| Streak | Color | Effect |
|--------|-------|--------|
| 1-2 | Orange | Basic flame |
| 3-4 | Bright orange | Soft glow |
| 5-9 | Red-orange | Particles emit |
| 10+ | Blue/white | Constant particle stream |

#### 4.3 Milestone Celebrations
| Streak | Banner | Effect |
|--------|--------|--------|
| 3 | "🔥 ON FIRE!" | Woosh sound |
| 5 | "🔥🔥 BLAZING!" | Screen edge flames |
| 10 | "🔥🔥🔥 UNSTOPPABLE!" | Full flame border + epic sound |
| 15+ | "👑 LEGENDARY!" | Special visual mode |

#### 4.4 "ON FIRE" Visual Mode (Streak 5+)
- Subtle flame particles around Zeno
- Trail becomes fiery orange
- Background warm tint (subtle)
- Everything feels "heated"

#### 4.5 Streak Break
- Flame icon shatters/extinguishes
- "💔 Streak Lost: 7" display (1.5s)
- Sad "fizzle" sound effect
- Follow-up: "Can you beat 7?" motivation text

#### 4.6 Streak Types (Parallel)
| Type | Condition | Icon |
|------|-----------|------|
| Hot Streak | Land at 419+ | 🔥 |
| Perfect Streak | Hit exact Zeno target | 🎯 |
| Ring Streak | Pass 2+ rings | 💫 |
| Clean Streak | Land without brake | ✨ |

#### 4.7 Session Heat (Momentum)
- Builds across session (doesn't reset on fail)
- Visual: Background shifts warmer
- Audio: Music intensity layers up
- Display: Heat meter (optional, subtle)

---

## Layer 5: Near-Miss Drama

### Current State
- "Almost!" overlay exists
- Precision bar in 419-420 zone
- Heartbeat audio (requires Bullet Time unlock)

### Design

#### 5.1 Dramatic Heartbeat Sequence
- 2 slow beats: thump... thump...
- Screen pulses with each beat
- Low bass rumble
- **No unlock required** — core drama for all players

#### 5.2 Spotlight Effect
- Vignette focuses on target zone
- Surrounding area dims to 70%
- Target area glows
- Clear "where you needed to be" visual

#### 5.3 Animated Distance Counter
- "0.73m short" with count-up animation
- Starts at 0.00 → counts to actual distance
- Red color, bold typography
- Creates tension moment

#### 5.4 Dramatic Pause
- 800-1200ms hold before reset
- Lets the near-miss sink in
- "I almost had it" processing time
- Builds "one more try" motivation

#### 5.5 Recovery Prompt
- "So close! Try again?" text
- Subtle glow on play area
- Immediate retry available
- Zero friction to continue

#### 5.6 Near-Miss Thresholds
| Distance | Reaction |
|----------|----------|
| < 0.5m | "INCHES AWAY!" + maximum drama |
| 0.5 - 2m | "SO CLOSE!" + full sequence |
| 2 - 5m | "Almost!" + lighter version |
| > 5m | No near-miss trigger |

---

## Layer 6: Session Hooks & Rewards

### Current State
- Daily tasks (menu only)
- Achievement rewards
- Throw regeneration
- No visible progress during play

### Design

#### 6.1 Post-Throw Progress Toasts
- After each throw with progress:
- Small toast: "Air Time 3s: 2/3 ▓▓░" + sparkles
- **Not modal** — quick, non-blocking
- Stack max 2-3, auto-dismiss 2s
- Satisfying "ding" sound

#### 6.2 Milestone Celebration
- On task/achievement complete:
- Bigger popup: "✅ DAILY COMPLETE!"
- Confetti burst
- "+5 throws!" reward callout
- 2-3s display

#### 6.3 First Throw Daily Bonus
- First throw of day:
- "🌅 Welcome Back!" banner
- "+3 Bonus Throws" instant
- Positive session start

#### 6.4 Streak Protection Prompt
- On exit with active streak:
- "🔥 You have a 4x streak! One more?"
- Shows what's at risk
- Subtle FOMO, not aggressive

#### 6.5 Session Summary
- On exit:
- "This session: 12 throws, Best: 417.3, +2 achievements"
- "Come back tomorrow for daily bonus!"
- Plants return seed

#### 6.6 Toast Priority Queue
| Event | Priority | Duration |
|-------|----------|----------|
| Achievement unlock | HIGH | 3s |
| Daily task complete | HIGH | 2.5s |
| Task progress | MEDIUM | 2s |
| Streak update | MEDIUM | 1.5s |
| Generic milestone | LOW | 1.5s |

Queue with 300ms gap, max 3 visible.

---

## Layer 7: Live Stats & Comparisons

### Current State
- Personal best tracking
- Leaderboard in menu
- Stats overlay
- No real-time comparison

### Design

#### 7.1 Personal Best Callouts
- Mid-flight: "You're on PB pace!" (if trajectory matches)
- On landing: "🏆 NEW PERSONAL BEST!" + explosion
- Near-PB: "Just 2.3m from your best!"

#### 7.2 Top 10 Notification
- "This throw was your #3 best ever!"
- Small badge next to score
- Even "bad" runs might be top 10 for new players

#### 7.3 Session vs Average
- Subtle indicator: "↑ 12% above average today"
- Or: "↓ Below average — warming up?"
- Non-judgmental, informational

#### 7.4 Leaderboard Position Changes
- If connected: "↑ #147 → #142!"
- "You passed 5 players!"
- Real-time competition feel

#### 7.5 Ghost Comparison (Future)
- "Your best run" ghost trail
- See where PB Zeno was
- Toggle in settings

#### 7.6 Privacy-Conscious
- Global comparisons opt-in
- Personal stats always on
- No shame mechanics
- Focus on improvement

---

## Layer 8: Pre-Launch Anticipation (Charge Feel)

### Current State
- Power meter bounces
- Coil animation
- Angle indicator

### Design

#### 8.1 Sweet Spot Snap
- Optimal power window: 70-85%
- When entering window:
  - Click sound
  - UI ring turns green
  - Micro camera zoom (1-2%)
- "Got it!" feeling before launch

#### 8.2 Tension Audio Build
- Drone pitch rises with charge
- Subtle, not annoying
- Releases on launch

#### 8.3 Power Meter Glow
- Intensity increases with charge
- Pulse effect at max
- Visual "energy building" feel

#### 8.4 Screen Vignette
- Subtle darkening at edges during charge
- Focuses attention on Zeno
- Releases on launch

---

## Layer 9: Mid-Air Control Juice

### Current State
- Float/brake mechanics work
- Stamina bar (hidden when full)
- Action denied shake

### Design

#### 9.1 Float/Brake Trail Effects
- On float: "Ink smear" trail variation
- On brake: Trail compresses/shortens
- Visual confirmation of action

#### 9.2 Action Audio
- Float: Soft whoosh
- Brake: Air compression sound
- Different sounds = clear feedback

#### 9.3 Low Stamina Warning
- Trail fades/dims
- Stamina bar pulses
- Subtle "low fuel" audio beep
- Player knows to conserve

#### 9.4 Action Denied (Improved)
- Clear "thunk" sound (not silence)
- Red pulse on Zeno sprite
- Stamina bar flashes red
- **Always feedback, never silence**

---

## Implementation Priority

### Phase 1: Core Juice (Highest Impact)
1. Layer 1: Ring Collection Juice
2. Layer 3: Landing Grades
3. Layer 5: Near-Miss Drama

### Phase 2: Progression Feel
4. Layer 4: Streak & Momentum
5. Layer 2: In-Game Goal Tracking
6. Layer 6: Session Hooks

### Phase 3: Polish & Depth
7. Layer 8: Charge Feel
8. Layer 9: Mid-Air Control
9. Layer 7: Live Stats

---

## Technical Considerations

### Performance
- All effects should be toggleable (reduceFx flag)
- Particle counts configurable
- Audio pooling for rapid sounds
- No layout thrashing from UI updates

### Audio Budget
- Max 4-5 concurrent sounds
- Priority system for overlapping
- Ducking for important sounds
- Mobile-friendly file sizes

### State Management
- Streak data persists to localStorage
- Session heat resets on page load
- Toast queue managed centrally
- Grade calculation pure function

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Session length | +30% |
| Throws per session | +50% |
| Return rate (next day) | +25% |
| Achievement unlock rate | +40% |

---

## Files Likely Affected

| System | Files |
|--------|-------|
| Ring Juice | `update.ts`, `render.ts`, `ringsRender.ts`, new `ringJuice.ts` |
| Landing Grades | `update.ts`, new `gradeSystem.ts`, `Game.tsx` |
| Streak System | `state.ts`, `types.ts`, `update.ts`, new `streakSystem.ts` |
| Near-Miss | `update.ts`, `render.ts`, existing `precisionBar.ts` |
| Goal HUD | New `GoalHUD.tsx`, `Game.tsx` |
| Session Hooks | New `sessionHooks.ts`, `ToastQueue.tsx` |
| Live Stats | `update.ts`, `Game.tsx` |
| Charge Feel | `update.ts`, `render.ts`, `audio.ts` |
| Control Juice | `precision.ts`, `render.ts`, `audio.ts` |

---

## Next Steps

1. ✅ Design document complete
2. Create implementation plan with task breakdown
3. Set up git worktree for development
4. Implement Phase 1 (Core Juice) first
5. Playtest and iterate
