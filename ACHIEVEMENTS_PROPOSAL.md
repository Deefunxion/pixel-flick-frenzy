# Achievement System Expansion Proposal

> **Goal:** Reward every decimal digit of progress. Each milestone should require ~10+ tries to achieve.

## Current State (14 Achievements)

| Category | Current | Proposed Expansion |
|----------|---------|-------------------|
| Distance | 2 (140, 400) | 60+ |
| Zeno Levels | 3 (1, 5, 10) | 15+ |
| Perfect Landings | 2 (1, 10) | 12+ |
| Total Throws | 1 (100) | 12+ |
| Multiplier | 1 (4x) | 6+ |
| Score | 1 (1000) | 12+ |
| Streaks | 4 | 15+ |
| Rings | 4 | 12+ |
| **NEW: Air Time** | 0 | 10+ |
| **NEW: Falls** | 0 | 10+ |
| **NEW: Consistency** | 0 | 10+ |

**Total: 14 current -> 170+ proposed**

---

## 1. Distance Milestones (The Crown Jewels)

### 1.1 Whole Number Progression (400-419)

Each whole number from 400 to 419 gets its own achievement.

| ID | Name | Description | Distance |
|----|------|-------------|----------|
| `dist_400` | Breaking 400 | Land beyond 400 | >= 400 |
| `dist_401` | 401 Club | Land beyond 401 | >= 401 |
| `dist_402` | Pushing Further | Land beyond 402 | >= 402 |
| `dist_403` | 403 Reached | Land beyond 403 | >= 403 |
| `dist_404` | Not Found... JK! | Land beyond 404 | >= 404 |
| `dist_405` | Halfway to Edge | Land beyond 405 | >= 405 |
| `dist_406` | 406 Territory | Land beyond 406 | >= 406 |
| `dist_407` | Lucky Seven | Land beyond 407 | >= 407 |
| `dist_408` | 408 Zone | Land beyond 408 | >= 408 |
| `dist_409` | Final Countdown | Land beyond 409 | >= 409 |
| `dist_410` | Breaking 410 | Land beyond 410 | >= 410 |
| `dist_411` | Information | Land beyond 411 | >= 411 |
| `dist_412` | 412 Precision | Land beyond 412 | >= 412 |
| `dist_413` | Unlucky? Never! | Land beyond 413 | >= 413 |
| `dist_414` | 414 Master | Land beyond 414 | >= 414 |
| `dist_415` | Danger Zone Entry | Land beyond 415 | >= 415 |
| `dist_416` | 416 Daredevil | Land beyond 416 | >= 416 |
| `dist_417` | 417 Thrill | Land beyond 417 | >= 417 |
| `dist_418` | One Step Away | Land beyond 418 | >= 418 |
| `dist_419` | The Edge Dweller | Land beyond 419 | >= 419 |

**Count: 20 achievements**

### 1.2 First Decimal Precision (419.1 - 419.9)

For players who have mastered 419 and are hunting tenths.

| ID | Name | Description | Distance |
|----|------|-------------|----------|
| `dist_419_1` | Point One | Land beyond 419.1 | >= 419.1 |
| `dist_419_2` | Point Two | Land beyond 419.2 | >= 419.2 |
| `dist_419_3` | Point Three | Land beyond 419.3 | >= 419.3 |
| `dist_419_4` | Point Four | Land beyond 419.4 | >= 419.4 |
| `dist_419_5` | Halfway to Perfect | Land beyond 419.5 | >= 419.5 |
| `dist_419_6` | Point Six | Land beyond 419.6 | >= 419.6 |
| `dist_419_7` | Point Seven | Land beyond 419.7 | >= 419.7 |
| `dist_419_8` | Point Eight | Land beyond 419.8 | >= 419.8 |
| `dist_419_9` | Almost There | Land beyond 419.9 | >= 419.9 |

**Count: 9 achievements**

### 1.3 Second Decimal Precision (419.91 - 419.99)

The hundredths club. Elite players only.

| ID | Name | Description | Distance |
|----|------|-------------|----------|
| `dist_419_91` | Ninety-One | Land beyond 419.91 | >= 419.91 |
| `dist_419_92` | Ninety-Two | Land beyond 419.92 | >= 419.92 |
| `dist_419_93` | Ninety-Three | Land beyond 419.93 | >= 419.93 |
| `dist_419_94` | Ninety-Four | Land beyond 419.94 | >= 419.94 |
| `dist_419_95` | Ninety-Five | Land beyond 419.95 | >= 419.95 |
| `dist_419_96` | Ninety-Six | Land beyond 419.96 | >= 419.96 |
| `dist_419_97` | Ninety-Seven | Land beyond 419.97 | >= 419.97 |
| `dist_419_98` | Ninety-Eight | Land beyond 419.98 | >= 419.98 |
| `dist_419_99` | The 99 Club | Land beyond 419.99 | >= 419.99 |

**Count: 9 achievements**

### 1.4 Third Decimal Precision (419.991 - 419.999)

Thousandths. Legendary precision.

| ID | Name | Description | Distance |
|----|------|-------------|----------|
| `dist_419_991` | Thousandth I | Land beyond 419.991 | >= 419.991 |
| `dist_419_992` | Thousandth II | Land beyond 419.992 | >= 419.992 |
| `dist_419_993` | Thousandth III | Land beyond 419.993 | >= 419.993 |
| `dist_419_994` | Thousandth IV | Land beyond 419.994 | >= 419.994 |
| `dist_419_995` | Thousandth V | Land beyond 419.995 | >= 419.995 |
| `dist_419_996` | Thousandth VI | Land beyond 419.996 | >= 419.996 |
| `dist_419_997` | Thousandth VII | Land beyond 419.997 | >= 419.997 |
| `dist_419_998` | Thousandth VIII | Land beyond 419.998 | >= 419.998 |
| `dist_419_999` | The Limit | Land beyond 419.999 | >= 419.999 |

**Count: 9 achievements**

### 1.5 Fourth Decimal Precision (419.9991 - 419.9999)

Ten-thousandths. Mythic tier.

| ID | Name | Description | Distance |
|----|------|-------------|----------|
| `dist_419_9991` | Beyond Mortal I | Land beyond 419.9991 | >= 419.9991 |
| `dist_419_9992` | Beyond Mortal II | Land beyond 419.9992 | >= 419.9992 |
| `dist_419_9993` | Beyond Mortal III | Land beyond 419.9993 | >= 419.9993 |
| `dist_419_9994` | Beyond Mortal IV | Land beyond 419.9994 | >= 419.9994 |
| `dist_419_9995` | Beyond Mortal V | Land beyond 419.9995 | >= 419.9995 |
| `dist_419_9996` | Beyond Mortal VI | Land beyond 419.9996 | >= 419.9996 |
| `dist_419_9997` | Beyond Mortal VII | Land beyond 419.9997 | >= 419.9997 |
| `dist_419_9998` | Beyond Mortal VIII | Land beyond 419.9998 | >= 419.9998 |
| `dist_419_9999` | Zeno's Paradox | Land beyond 419.9999 | >= 419.9999 |

**Count: 9 achievements**

### 1.6 Special Distance Achievements

| ID | Name | Description | Condition |
|----|------|-------------|-----------|
| `dist_perfect_420` | The Impossible | Land at exactly 420.0000 | == 420.0 |
| `dist_first_400` | Welcome to the Edge | First time landing beyond 400 | best crosses 400 |
| `dist_improvement_1` | Personal Growth | Beat your PB by 1+ | improvement >= 1 |
| `dist_improvement_5` | Major Breakthrough | Beat your PB by 5+ | improvement >= 5 |
| `dist_improvement_10` | Quantum Leap | Beat your PB by 10+ | improvement >= 10 |

**Count: 5 achievements**

**TOTAL DISTANCE ACHIEVEMENTS: 61**

---

## 2. Zeno Level Progression

Expand from 3 to 15 achievements. Zeno target moves halfway to edge each level.

| ID | Name | Description | Level |
|----|------|-------------|-------|
| `zeno_1` | First Step | Beat your first Zeno target | >= 1 |
| `zeno_2` | Getting Started | Reach Zeno Level 2 | >= 2 |
| `zeno_3` | Third Time's a Charm | Reach Zeno Level 3 | >= 3 |
| `zeno_5` | Halfway There | Reach Zeno Level 5 | >= 5 |
| `zeno_7` | Lucky Seven | Reach Zeno Level 7 | >= 7 |
| `zeno_10` | Zeno Master | Reach Zeno Level 10 | >= 10 |
| `zeno_15` | Zeno Expert | Reach Zeno Level 15 | >= 15 |
| `zeno_20` | Zeno Veteran | Reach Zeno Level 20 | >= 20 |
| `zeno_25` | Quarter Century | Reach Zeno Level 25 | >= 25 |
| `zeno_30` | Zeno Elder | Reach Zeno Level 30 | >= 30 |
| `zeno_40` | Zeno Sage | Reach Zeno Level 40 | >= 40 |
| `zeno_50` | Half a Hundred | Reach Zeno Level 50 | >= 50 |
| `zeno_75` | Zeno Legend | Reach Zeno Level 75 | >= 75 |
| `zeno_100` | Centurion | Reach Zeno Level 100 | >= 100 |
| `zeno_infinity` | Infinite Approach | Reach Zeno Level 200 | >= 200 |

**TOTAL ZENO ACHIEVEMENTS: 15**

---

## 3. Perfect Landing Achievements

Expand from 2 to 12 achievements. Perfect = within target zone.

| ID | Name | Description | Count |
|----|------|-------------|-------|
| `perfect_1` | Bullseye | Get 1 perfect landing | >= 1 |
| `perfect_5` | Sharp Eye | Get 5 perfect landings | >= 5 |
| `perfect_10` | Sharpshooter | Get 10 perfect landings | >= 10 |
| `perfect_25` | Precision Player | Get 25 perfect landings | >= 25 |
| `perfect_50` | Half Century | Get 50 perfect landings | >= 50 |
| `perfect_100` | Century Mark | Get 100 perfect landings | >= 100 |
| `perfect_250` | Quarter Thousand | Get 250 perfect landings | >= 250 |
| `perfect_500` | High Five Hundred | Get 500 perfect landings | >= 500 |
| `perfect_1000` | Thousand Perfects | Get 1000 perfect landings | >= 1000 |
| `perfect_2500` | Perfectionist | Get 2500 perfect landings | >= 2500 |
| `perfect_5000` | Precision Master | Get 5000 perfect landings | >= 5000 |
| `perfect_10000` | Perfect Legend | Get 10000 perfect landings | >= 10000 |

**TOTAL PERFECT ACHIEVEMENTS: 12**

---

## 4. Total Throws Achievements

Expand from 1 to 14 achievements. Persistence rewards.

| ID | Name | Description | Count |
|----|------|-------------|-------|
| `throws_50` | Getting Started | Make 50 throws | >= 50 |
| `throws_100` | Dedicated | Make 100 throws | >= 100 |
| `throws_250` | Committed | Make 250 throws | >= 250 |
| `throws_500` | Half Thousand | Make 500 throws | >= 500 |
| `throws_1000` | Thousand Club | Make 1000 throws | >= 1000 |
| `throws_2500` | Devoted | Make 2500 throws | >= 2500 |
| `throws_5000` | Five Thousand Strong | Make 5000 throws | >= 5000 |
| `throws_10000` | Ten Thousand | Make 10000 throws | >= 10000 |
| `throws_25000` | Obsessed | Make 25000 throws | >= 25000 |
| `throws_50000` | Fifty Thousand | Make 50000 throws | >= 50000 |
| `throws_100000` | One Hundred Thousand | Make 100000 throws | >= 100000 |
| `throws_250000` | Quarter Million | Make 250000 throws | >= 250000 |
| `throws_500000` | Half Million | Make 500000 throws | >= 500000 |
| `throws_1000000` | Millionaire Thrower | Make 1000000 throws | >= 1000000 |

**TOTAL THROW ACHIEVEMENTS: 14**

---

## 5. Multiplier Achievements

Expand from 1 to 6 achievements. Risk/reward mastery.

| ID | Name | Description | Multiplier |
|----|------|-------------|------------|
| `mult_2x` | Double Up | Achieve 2x multiplier | >= 2 |
| `mult_3x` | Triple Threat | Achieve 3x multiplier | >= 3 |
| `mult_4x` | High Roller | Achieve 4x multiplier | >= 4 |
| `mult_5x` | Quintuple | Achieve 5x multiplier | >= 5 |
| `mult_6x` | Maximum Multiplier | Achieve 6x multiplier | >= 6 |
| `mult_max_rings` | Full Combo | Get max multiplier with all 3 rings | mult >= 6 && rings == 3 |

**TOTAL MULTIPLIER ACHIEVEMENTS: 6**

---

## 6. Score Achievements

Expand from 1 to 14 achievements. Cumulative score rewards.

| ID | Name | Description | Score |
|----|------|-------------|-------|
| `score_500` | First Haul | Accumulate 500 total score | >= 500 |
| `score_1000` | Scorer | Accumulate 1000 total score | >= 1000 |
| `score_2500` | Building Up | Accumulate 2500 total score | >= 2500 |
| `score_5000` | Five K | Accumulate 5000 total score | >= 5000 |
| `score_10000` | Ten K | Accumulate 10000 total score | >= 10000 |
| `score_25000` | Twenty-Five K | Accumulate 25000 total score | >= 25000 |
| `score_50000` | Fifty K | Accumulate 50000 total score | >= 50000 |
| `score_100000` | Hundred K | Accumulate 100000 total score | >= 100000 |
| `score_250000` | Quarter Million | Accumulate 250000 total score | >= 250000 |
| `score_500000` | Half Million | Accumulate 500000 total score | >= 500000 |
| `score_1000000` | Millionaire | Accumulate 1000000 total score | >= 1000000 |
| `score_5000000` | Five Million | Accumulate 5000000 total score | >= 5000000 |
| `score_10000000` | Ten Million | Accumulate 10000000 total score | >= 10000000 |
| `score_max` | Score Capped | Reach the maximum score | == MAX |

**TOTAL SCORE ACHIEVEMENTS: 14**

---

## 7. Streak Achievements

Expand from 4 to 18 achievements.

### 7.1 Hot Streak (Consecutive 419+ landings)

| ID | Name | Description | Streak |
|----|------|-------------|--------|
| `streak_hot_3` | Warming Up | Land 3 consecutive throws at 419+ | >= 3 |
| `streak_hot_5` | Hot Streak | Land 5 consecutive throws at 419+ | >= 5 |
| `streak_hot_7` | Heating Up | Land 7 consecutive throws at 419+ | >= 7 |
| `streak_hot_10` | On Fire | Land 10 consecutive throws at 419+ | >= 10 |
| `streak_hot_15` | Blazing | Land 15 consecutive throws at 419+ | >= 15 |
| `streak_hot_20` | Inferno | Land 20 consecutive throws at 419+ | >= 20 |
| `streak_hot_25` | Supernova | Land 25 consecutive throws at 419+ | >= 25 |
| `streak_hot_50` | Solar Flare | Land 50 consecutive throws at 419+ | >= 50 |

**Count: 8 achievements**

### 7.2 Landings Without Fall

| ID | Name | Description | Count |
|----|------|-------------|-------|
| `streak_safe_5` | Safe Landing | Land 5 times without falling | >= 5 |
| `streak_safe_10` | Untouchable | Land 10 times without falling | >= 10 |
| `streak_safe_15` | Sure-footed | Land 15 times without falling | >= 15 |
| `streak_safe_20` | Steady | Land 20 times without falling | >= 20 |
| `streak_safe_30` | Unshakeable | Land 30 times without falling | >= 30 |
| `streak_safe_50` | Ironclad | Land 50 times without falling | >= 50 |
| `streak_safe_100` | Invincible | Land 100 times without falling | >= 100 |

**Count: 7 achievements**

### 7.3 Session Marathon

| ID | Name | Description | Throws |
|----|------|-------------|--------|
| `session_50` | Marathon | Make 50 throws in one session | >= 50 |
| `session_100` | Century Session | Make 100 throws in one session | >= 100 |
| `session_200` | Double Century | Make 200 throws in one session | >= 200 |

**Count: 3 achievements**

**TOTAL STREAK ACHIEVEMENTS: 18**

---

## 8. Ring Achievements

Expand from 4 to 14 achievements.

### 8.1 Total Rings Passed

| ID | Name | Description | Count |
|----|------|-------------|-------|
| `rings_1` | Ring Rookie | Pass through your first ring | >= 1 |
| `rings_10` | Ring Hunter | Pass through 10 rings total | >= 10 |
| `rings_25` | Ring Seeker | Pass through 25 rings total | >= 25 |
| `rings_50` | Ring Gatherer | Pass through 50 rings total | >= 50 |
| `rings_100` | Ring Collector | Pass through 100 rings total | >= 100 |
| `rings_250` | Ring Enthusiast | Pass through 250 rings total | >= 250 |
| `rings_500` | Ring Fanatic | Pass through 500 rings total | >= 500 |
| `rings_1000` | Ring Master | Pass through 1000 rings total | >= 1000 |

**Count: 8 achievements**

### 8.2 Perfect Ring Throws (All 3 in one throw)

| ID | Name | Description | Count |
|----|------|-------------|-------|
| `rings_perfect_1` | Triple Ring | Pass through all 3 rings in one throw | >= 1 |
| `rings_perfect_5` | Ring Ace | Get all 3 rings in 5 different throws | >= 5 |
| `rings_perfect_10` | Triple Threat | Get all 3 rings in 10 different throws | >= 10 |
| `rings_perfect_25` | Ring Champion | Get all 3 rings in 25 different throws | >= 25 |
| `rings_perfect_50` | Ring Legend | Get all 3 rings in 50 different throws | >= 50 |
| `rings_perfect_100` | Ring God | Get all 3 rings in 100 different throws | >= 100 |

**Count: 6 achievements**

**TOTAL RING ACHIEVEMENTS: 14**

---

## 9. NEW: Air Time Achievements

Time spent airborne before landing.

| ID | Name | Description | Seconds |
|----|------|-------------|---------|
| `air_1s` | Takeoff | Stay airborne for 1 second | >= 1 |
| `air_2s` | Floating | Stay airborne for 2 seconds | >= 2 |
| `air_3s` | Hang Time | Stay airborne for 3 seconds | >= 3 |
| `air_4s` | Flight | Stay airborne for 4 seconds | >= 4 |
| `air_5s` | Soaring | Stay airborne for 5 seconds | >= 5 |
| `air_6s` | Extended Flight | Stay airborne for 6 seconds | >= 6 |
| `air_7s` | Long Haul | Stay airborne for 7 seconds | >= 7 |
| `air_8s` | Marathon Flight | Stay airborne for 8 seconds | >= 8 |
| `air_9s` | Endless Sky | Stay airborne for 9 seconds | >= 9 |
| `air_10s` | Eternal Flight | Stay airborne for 10 seconds | >= 10 |

**TOTAL AIR TIME ACHIEVEMENTS: 10**

---

## 10. NEW: Falls Achievements (Persistence Humor)

Celebrate failure as part of the journey.

| ID | Name | Description | Falls |
|----|------|-------------|-------|
| `falls_1` | First Tumble | Fall off the cliff for the first time | >= 1 |
| `falls_10` | Learning Curve | Fall 10 times | >= 10 |
| `falls_50` | Persistent | Fall 50 times | >= 50 |
| `falls_100` | Determined | Fall 100 times | >= 100 |
| `falls_250` | Stubborn | Fall 250 times | >= 250 |
| `falls_500` | Never Give Up | Fall 500 times | >= 500 |
| `falls_1000` | Thousand Falls | Fall 1000 times | >= 1000 |
| `falls_2500` | Cliff Diver | Fall 2500 times | >= 2500 |
| `falls_5000` | Gravity's Friend | Fall 5000 times | >= 5000 |
| `falls_10000` | Fall Legend | Fall 10000 times | >= 10000 |

**TOTAL FALLS ACHIEVEMENTS: 10**

---

## 11. NEW: Successful Landings Achievements

Total successful landings (didn't fall off).

| ID | Name | Description | Landings |
|----|------|-------------|----------|
| `land_1` | First Landing | Land successfully for the first time | >= 1 |
| `land_10` | Beginner | Land successfully 10 times | >= 10 |
| `land_50` | Amateur | Land successfully 50 times | >= 50 |
| `land_100` | Skilled | Land successfully 100 times | >= 100 |
| `land_250` | Experienced | Land successfully 250 times | >= 250 |
| `land_500` | Expert | Land successfully 500 times | >= 500 |
| `land_1000` | Master | Land successfully 1000 times | >= 1000 |
| `land_2500` | Grandmaster | Land successfully 2500 times | >= 2500 |
| `land_5000` | Legendary | Land successfully 5000 times | >= 5000 |
| `land_10000` | Mythical | Land successfully 10000 times | >= 10000 |

**TOTAL LANDING ACHIEVEMENTS: 10**

---

## 12. NEW: Consistency Achievements

Landing within specific ranges consistently.

| ID | Name | Description | Condition |
|----|------|-------------|-----------|
| `consistent_410_5x` | 410 Club | Land 5 times in a row at 410+ | 5x consecutive >= 410 |
| `consistent_410_10x` | 410 Regular | Land 10 times in a row at 410+ | 10x consecutive >= 410 |
| `consistent_415_5x` | 415 Club | Land 5 times in a row at 415+ | 5x consecutive >= 415 |
| `consistent_415_10x` | 415 Regular | Land 10 times in a row at 415+ | 10x consecutive >= 415 |
| `consistent_418_5x` | 418 Club | Land 5 times in a row at 418+ | 5x consecutive >= 418 |
| `consistent_418_10x` | 418 Regular | Land 10 times in a row at 418+ | 10x consecutive >= 418 |
| `consistent_419_5` | Decimal Hunter | Land 5 throws at 419.X+ | 5x total >= 419.X |
| `consistent_419_9_3x` | 419.9 Trio | Land 3 times at 419.9+ | 3x total >= 419.9 |
| `consistent_419_99_3x` | 419.99 Trio | Land 3 times at 419.99+ | 3x total >= 419.99 |
| `consistent_variety` | Well Rounded | Land at every whole number 400-419 | all 20 visited |

**TOTAL CONSISTENCY ACHIEVEMENTS: 10**

---

## Summary

| Category | Count |
|----------|-------|
| Distance Milestones | 61 |
| Zeno Levels | 15 |
| Perfect Landings | 12 |
| Total Throws | 14 |
| Multiplier | 6 |
| Score | 14 |
| Streaks | 18 |
| Rings | 14 |
| Air Time (NEW) | 10 |
| Falls (NEW) | 10 |
| Landings (NEW) | 10 |
| Consistency (NEW) | 10 |
| **TOTAL** | **194** |

---

## Implementation Notes

### State Changes Required

```typescript
// Add to Stats interface
interface Stats {
  // ... existing
  totalFalls: number;
  successfulLandings: number;
  maxAirTime: number;  // Best air time in seconds

  // Consistency tracking
  lands400Plus: number;  // Count of 400+ landings
  lands410Plus: number;  // Count of 410+ landings
  lands415Plus: number;  // Count of 415+ landings
  lands418Plus: number;  // Count of 418+ landings
  lands419Plus: number;  // Count of 419+ landings
  lands419_9Plus: number;  // Count of 419.9+ landings
  lands419_99Plus: number; // Count of 419.99+ landings

  // Track visited distances for variety achievement
  visitedDistances: Set<number>; // 400, 401, ..., 419
}

// Add to GameState
interface GameState {
  // ... existing
  currentStreak410: number;  // Consecutive 410+ landings
  currentStreak415: number;  // Consecutive 415+ landings
  currentStreak418: number;  // Consecutive 418+ landings
}
```

### Achievement Tiers

Visual badges should reflect difficulty:

| Tier | Color | Examples |
|------|-------|----------|
| Bronze | #CD7F32 | First achievements, falls |
| Silver | #C0C0C0 | Mid-tier progress |
| Gold | #FFD700 | High milestones |
| Platinum | #E5E4E2 | 419.9+ decimal achievements |
| Diamond | #B9F2FF | 419.99+ achievements |
| Mythic | #9D00FF | 419.999+ and 419.9999+ |

### Throw Rewards by Tier

| Tier | Throw Reward |
|------|-------------|
| Bronze | 5 throws |
| Silver | 10 throws |
| Gold | 20 throws |
| Platinum | 30 throws |
| Diamond | 50 throws |
| Mythic | 100 throws |

---

## Priority Implementation Order

1. **Phase 1**: Distance 400-419 (whole numbers) - Core progression
2. **Phase 2**: Falls + Landings + Throws expansion - Easy wins
3. **Phase 3**: Distance decimals 419.1-419.9 - First precision tier
4. **Phase 4**: Streaks + Consistency expansion - Engagement hooks
5. **Phase 5**: Distance decimals 419.91-419.99 - Elite tier
6. **Phase 6**: Air Time + Zeno expansion
7. **Phase 7**: Distance decimals 419.991+ - Legendary tier
8. **Phase 8**: Score + Multiplier + Rings expansion
