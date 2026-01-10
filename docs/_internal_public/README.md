# Zeno Artwork Revision 2.0

> **Date:** January 10, 2026  
> **Status:** Ready for Implementation  
> **Purpose:** Replace the deprecated "lean" pose with the new three-pose system: "The Coil," "The Bolt," and "The Impact."

---

## The Problem

The original "lean" pose for Zeno was passive and lacked the dynamic energy required for the game. It has been officially deprecated and must be removed from the codebase.

---

## The Solution: Three Iconic Poses

Zeno's new visual identity is defined by three superhero-inspired poses that capture the game's core mechanics:

### 1. The Coil (Wind-Up)
**When:** Before the jump, gathering power.  
**Energy:** A compressed spring, ready to explode forward.  
**Pose:** Deep crouch, back leg extended far behind, one arm pulled back, the other forward.  
**Files:**
- `zeno-windup-flipbook.png`
- `zeno-windup-noir.png`

### 2. The Bolt (Flight)
**When:** Mid-air, during the jump.  
**Energy:** A lightning bolt or bullet in flight.  
**Pose:** Stretched out horizontally, one arm forward (Superman-style), streamlined and fast.  
**Files:**
- `zeno-flight-dynamic-flipbook.png`

### 3. The Impact (Landing)
**When:** Just after landing, absorbing the force.  
**Energy:** Classic superhero landing.  
**Pose:** Three-point landing, one knee down, one hand on the ground, the other arm up for balance.  
**Files:**
- `zeno-landing-flipbook.png`
- `zeno-landing-noir.png`

---

## New App Icons

The app icons have been updated to feature "The Coil" pose, which is more dynamic and recognizable than the old "lean" pose.

**Files:**
- `app-icon-windup-flipbook-512.png` (512x512, Flipbook theme)
- `app-icon-windup-noir-512.png` (512x512, Noir theme)

**Action Required:** Generate all standard icon sizes (192x192, 180x180, 32x32, 16x16) from these master files and place them in `public/assets/icons/flipbook/` and `public/assets/icons/noir/`.

---

## Promotional Material

A new promotional showcase image has been created to highlight the three iconic poses.

**File:**
- `promotional-three-poses-flipbook.png`

**Usage:** This can be used on the website, in social media posts, or in app store listings to communicate the game's dynamic, superhero-inspired aesthetic.

---

## Implementation Guide

For detailed, step-by-step instructions on how to integrate these new assets into the codebase, see:

**`/home/ubuntu/claude_implementation_prompt_v2.md`**

This guide is written specifically for Claude Code and includes:
- Asset purge instructions (removing all "lean" pose files)
- App icon installation steps
- Game logic integration for the three poses
- Documentation update requirements

---

## File Inventory

| File Name | Size | Description |
|-----------|------|-------------|
| `zeno-windup-flipbook.png` | 6.0M | Master illustration: The Coil (Flipbook) |
| `zeno-windup-noir.png` | 7.7M | Master illustration: The Coil (Noir) |
| `zeno-landing-flipbook.png` | 5.7M | Master illustration: The Impact (Flipbook) |
| `zeno-landing-noir.png` | 7.6M | Master illustration: The Impact (Noir) |
| `zeno-flight-dynamic-flipbook.png` | 5.6M | Master illustration: The Bolt (Flipbook) |
| `app-icon-windup-flipbook-512.png` | 5.0M | App icon: The Coil (Flipbook, 512x512) |
| `app-icon-windup-noir-512.png` | 6.7M | App icon: The Coil (Noir, 512x512) |
| `promotional-three-poses-flipbook.png` | 7.1M | Promotional showcase of all three poses |

---

## Design Principles

All new artwork adheres to the following principles:

1. **Superhero Energy, Not Chill Vibes:** Every pose is active, engaged, and dynamic.
2. **Arms Are Key:** Arms in athletic positions create dynamism and show intent.
3. **Coiled Power:** The wind-up pose looks like a compressed spring.
4. **Forward Momentum:** Even when standing still, Zeno is oriented toward the challenge.
5. **Impactful Landings:** Landings are dramatic events that show the absorption of force.

---

## Next Steps

1. Review the new assets.
2. Provide the implementation guide (`claude_implementation_prompt_v2.md`) to Claude Code.
3. Verify that all old "lean" assets have been purged.
4. Test the game to ensure the new poses are integrated correctly.
5. Commit all changes with the provided commit message template.

---

**Art Direction by:** Manus AI  
**For Project:** One-More-Flick (pixel-flick-frenzy)  
**Approved Assets Reference:** `/home/ubuntu/pixel-flick-frenzy/Ιδέες για το artwork του one-more-flick/one-more-flick-promotional-materials/one-more-flick-promo/pick/`
