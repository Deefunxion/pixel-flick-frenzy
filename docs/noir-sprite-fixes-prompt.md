# Noir Sprite Sheet Fixes - Instructions for Manus

## Overview

The `zeno-noir.png` sprite sheet has several missing and incorrectly oriented frames. This document provides exact specifications for the frames that need to be created or fixed.

**CRITICAL RULES:**
1. **ALL characters must face RIGHT** (→) - this is the direction of gameplay
2. **Transparent background** - PNG with alpha channel, NO white background
3. **Match the existing noir style** - black ink lines, high contrast, clean strokes
4. **Frame size**: 128 x 128 pixels each
5. **Character should be centered** in each frame

---

## Reference: Existing Good Frames

Use these existing noir frames as style reference:

| Frame | Description | Status |
|-------|-------------|--------|
| 0 | Idle standing, facing right | ✓ Good |
| 4 | Walking/prep pose, facing right | ✓ Good |
| 10 | Superman flying pose, facing right | ✓ Good |

---

## Frames That Need Fixing

### COIL ANIMATION (Charging/Power-up) - Frames 5, 6, 7, 8, 9

These frames show Zeno preparing to launch. The sequence should flow from standing → crouch → deep squat with arms raised.

| Frame | Current Status | Required Pose | Direction |
|-------|---------------|---------------|-----------|
| **5** | EMPTY | Transitional crouch - knees starting to bend, arms coming up | → RIGHT |
| **6** | REVERSED (facing left) | Deep lunge/crouch - one leg forward, body low, arms positioned | → RIGHT |
| **7** | EMPTY | Power stance - wide legs, bent knees, fists clenched or arms ready | → RIGHT |
| **8** | EMPTY | Pre-jump crouch - deep squat, body compressed, ready to explode upward | → RIGHT |
| **9** | EMPTY | Arms up high - standing tall, both arms stretched up toward sky, triumphant pose | → RIGHT |

**Animation Flow**: 9 → 8 → 7 → 6 (hands up → crouch down)

**Pose Details for Each Frame:**

**Frame 5** - Transitional Crouch:
- Body starting to lower
- Knees slightly bent (about 30°)
- Arms lifting from sides
- Weight shifting forward
- Face showing concentration

**Frame 6** - Deep Lunge (MUST BE REDRAWN FACING RIGHT):
- Deep forward lunge
- Back leg extended
- Front knee bent at ~90°
- Arms in athletic position
- Body leaning forward slightly
- **Currently exists but faces LEFT - needs to face RIGHT**

**Frame 7** - Power Stance:
- Wide stance, feet apart
- Both knees bent
- Arms out to sides or fists clenched
- Body low, center of gravity down
- Ready-to-explode energy pose

**Frame 8** - Pre-Jump Crouch:
- Deepest squat position
- Knees fully bent
- Arms pulled back or down
- Body compressed like a spring
- Head looking forward/up

**Frame 9** - Arms Up High:
- Standing tall
- Both arms stretched straight up
- Slight backward lean
- Triumphant/ready pose
- This is the START of the charging animation

---

### BOLT ANIMATION (Flying) - Frames 11, 12

Superman flying pose variations.

| Frame | Current Status | Required Pose | Direction |
|-------|---------------|---------------|-----------|
| **11** | EMPTY | Superman pose variation - slight arm/leg position change from frame 10 | → RIGHT |
| **12** | REVERSED (facing left) | Superman pose variation - different from 10 and 11 | → RIGHT |

**Pose Details:**

**Frame 10** (EXISTS - Reference):
- Horizontal body
- Arms stretched forward
- Legs together, stretched back
- Classic superman flying pose

**Frame 11** - Flying Variation 1:
- Similar to frame 10
- Slightly different arm position (maybe one arm slightly lower)
- Or slight body curve
- Creates subtle animation when looping

**Frame 12** - Flying Variation 2 (MUST BE REDRAWN FACING RIGHT):
- Another slight variation
- Maybe legs slightly apart
- Or arms in slightly different position
- **Currently exists but faces LEFT - needs to face RIGHT**

---

### IMPACT ANIMATION (Landing) - Frames 13, 14, 15, 16, 17

Superhero landing sequence.

| Frame | Current Status | Required Pose | Direction |
|-------|---------------|---------------|-----------|
| **13** | EMPTY | Initial impact - body hitting ground, one knee down | → RIGHT |
| **14** | EMPTY | Impact absorb - deep crouch, hand on ground | → RIGHT |
| **15** | EMPTY | Recovery start - beginning to rise | → RIGHT |
| **16** | EMPTY | Rising up - standing motion | → RIGHT |
| **17** | EMPTY | Landing complete - triumphant pose or back to ready stance | → RIGHT |

**Pose Details:**

**Frame 13** - Initial Impact:
- One knee hitting ground
- Other leg extended back
- One hand reaching toward ground
- Body angled forward
- Classic superhero landing moment

**Frame 14** - Impact Absorb:
- Both knees bent, close to ground
- One or both hands touching ground
- Body compressed
- Head looking forward
- Maximum impact absorption

**Frame 15** - Recovery Start:
- Starting to push up from ground
- Weight shifting upward
- Legs beginning to straighten
- Arms pushing off or rising

**Frame 16** - Rising Up:
- Standing motion, halfway up
- One leg stepping forward
- Arms at sides or balancing
- Momentum upward

**Frame 17** - Landing Complete:
- Fully standing or slight crouch
- Ready stance
- Can be similar to idle or showing slight exhaustion
- Marks end of landing animation

---

### FAIL ANIMATION (Tumbling/Falling) - Frames 18, 19, 20, 21

Comedic falling/tumbling when Zeno falls off the cliff.

| Frame | Current Status | Required Pose | Direction |
|-------|---------------|---------------|-----------|
| **18** | Check if exists | Tumble start - losing balance | Any (tumbling) |
| **19** | Check if exists | Mid-tumble - body rotating | Any (tumbling) |
| **20** | Check if exists | Tumble continue - arms flailing | Any (tumbling) |
| **21** | Check if exists | Tumble end - chaotic pose | Any (tumbling) |

**Note**: Fail animation can have character facing various directions as they tumble chaotically. The key is showing loss of control and comedic panic.

---

## Delivery Format

**File**: `zeno-noir.png`
**Dimensions**: 2816 x 128 pixels (22 frames × 128px width, single row)
**Format**: PNG-24 with alpha transparency

### Frame Layout (left to right):
```
[0][1][2][3][4][5][6][7][8][9][10][11][12][13][14][15][16][17][18][19][20][21]
|  IDLE   |     COIL      |   BOLT  |      IMPACT       |      FAIL       |
```

---

## Style Guide

**Line Weight**: 2-3px for main body outlines
**Style**: Clean black ink strokes, high contrast
**Fill**: Minimal - mostly outline with some solid fills for emphasis
**Expression**: Simple dot eyes and line mouth (existing style)
**NO shading gradients** - keep it flat and graphic

---

## Summary of Required Work

| Frames | Action Needed |
|--------|---------------|
| 5 | CREATE NEW |
| 6 | REDRAW (currently reversed) |
| 7 | CREATE NEW |
| 8 | CREATE NEW |
| 9 | CREATE NEW |
| 11 | CREATE NEW |
| 12 | REDRAW (currently reversed) |
| 13-17 | CREATE NEW (if empty) |
| 18-21 | CHECK and fix if needed |

**Total**: Approximately 12-15 frames need attention.

---

## Questions?

If any pose or direction is unclear, please ask before starting. Reference the flipbook sprite sheet (`zeno-flipbook.png`) for pose inspiration, but maintain the noir black-ink aesthetic.
