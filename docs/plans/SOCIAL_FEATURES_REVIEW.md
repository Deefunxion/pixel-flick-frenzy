# Review: Social Features Implementation Plan (Firebase)

Date: 2026-01-09
File reviewed: docs/plans/2026-01-09-social-features.md

## Executive summary
Το πλάνο είναι σωστά δομημένο (phases, services, UI integration), αλλά υπάρχουν 3 high-risk σημεία που αν μείνουν όπως είναι θα δημιουργήσουν tech debt ή/και production issues:

1) **Nickname reservation race condition** (δύο clients μπορούν να “κλέψουν” το ίδιο nickname με check-then-write).
2) **User rank query θα γίνει πολύ ακριβό** στο Firestore (και αργό) αν βασιστεί σε `where(score > userScore)` με `getDocs()`.
3) **Client-trust / cheating surface**: μόνο rules με thresholds δεν αποτρέπουν εύκολα spoofed scores.

Παρακάτω είναι τα συγκεκριμένα gaps + προτάσεις που μειώνουν ρίσκο και διευκολύνουν implementation.

---

## 1) Data model & naming

### Observation
- Το plan χρησιμοποιεί πεδίο `odea` ως user id. Αυτό είναι ΟΚ, αλλά μέσα στο code δείχνει “τυπογραφικό/εσωτερικό” και αυξάνει πιθανότητα bugs.

### Recommendation
- Χρησιμοποίησε **`uid`** ως canonical field name σε profile/leaderboard entries.
- Αν θες να κρατήσεις `odea` για lore, κράτα το στο UI ή ως alias, αλλά τα storage keys/Firestore schema καλύτερα να είναι τα standard.

### Tech debt avoided
- Λιγότερα bugs σε joins/queries, πιο εύκολη συντήρηση από μελλοντικούς contributors.

---

## 2) Nickname reservation (race condition + abuse)

### Issue (high risk)
Το pattern:
1) `isNicknameAvailable()` -> read
2) `createAnonymousUser()` -> write users doc
3) write nicknames doc

…είναι **race-prone**. Δύο clients μπορούν να περάσουν availability check πριν γραφτεί το nickname doc.

### Recommendation (must)
- Κάνε reservation σε **transaction**.
  - Transaction steps:
    - Read `nicknames/{normalized}`
    - If exists -> fail
    - Create `users/{uid}` profile
    - Create `nicknames/{normalized}` mapping

### Additional hardening
- Μην επιτρέπεις `read: true` σε όλο το `nicknames/` αν δεν το χρειάζεσαι.
  - Αν σε ενδιαφέρει μόνο availability, μπορείς να επιτρέψεις `get` σε συγκεκριμένο doc id (το nickname), όχι broad list queries.

### UX note
- Regex `^[a-zA-Z]{3,12}$` αποκλείει ελληνικά. Αν το κοινό σου είναι ελληνικό, σκέψου:
  - είτε allow Unicode letters (π.χ. `\p{L}`) + normalization,
  - είτε κράτα Latin-only αλλά ξεκάθαρο copy.

---

## 3) Leaderboard rank computation (cost/performance)

### Issue (high risk)
Το `getUserRank()`:
- `where('score', '>', userScore)` + `getDocs()`

Αυτό θα κατεβάζει ΟΛΑ τα docs με μεγαλύτερο score. Σε production μπορεί να γίνει:
- ακριβό (read costs)
- αργό
- πιθανό να hitting limits

### Recommendation (must)
- Χρησιμοποίησε Firestore **aggregation count**:
  - `getCountFromServer(query(... where('score','>', userScore)))`
  - Έτσι παίρνεις μόνο ένα count, όχι όλα τα docs.

### Extra recommendation
- Στο `getLeaderboard()` βάλε tie-breaker order:
  - `orderBy('score','desc')` + `orderBy('updatedAt','asc|desc')`
  - για deterministic ordering όταν δύο χρήστες έχουν ίδιο score.

---

## 4) Obvious bug in plan sample code

### Issue (must fix)
Στο `updateLeaderboardScore()`:
```ts
const entry: LeaderboardEntry = {
  odea: odea,
  nickname,
  score: newScore,
  updatedAt: new Date().toISOString(),
};
```
Το `odea` variable **δεν υπάρχει**. Θα σκάσει at runtime/compile.

### Fix
- Χρησιμοποίησε `userId` (ή `uid` αν μετονομάσεις):
  - `uid: userId`

---

## 5) Server timestamps & schema stability

### Issue
Χρησιμοποιείς `new Date().toISOString()` από client.
- Client clock μπορεί να είναι λάθος ή χειραγωγήσιμο.

### Recommendation
- Χρησιμοποίησε Firestore `serverTimestamp()` για `createdAt/updatedAt`.
- Κράτα timestamps σαν Firestore `Timestamp`, όχι string.

### Tech debt avoided
- Clean ordering, καλύτερα audits, λιγότερα time skew bugs.

---

## 6) Security rules: good start, but not sufficient

### What’s good
- Owner-only write για user/leaderboard docs.
- Basic threshold checks για scores.

### What’s missing / risk
- **Cheating**: client μπορεί να γράψει αυθαίρετα υψηλά scores εντός των thresholds.
- **Nickname squatting**: χωρίς transaction + strict create-only constraints μπορεί να γίνει abuse.

### Recommendation ladder (pick your budget)
1) MVP: thresholds + transaction + count aggregation (πάνω) + basic rate limiting on client.
2) Better: **Cloud Functions** for score submissions
   - client calls a callable function
   - function validates deltas, sanity checks (e.g. totalScore monotonic, bestThrow <= CLIFF_EDGE, etc.)
   - function writes leaderboards server-side
3) Best: add **Firebase App Check** (reduces automated abuse).

---

## 7) Cross-device sync merge logic

### Issue
Το plan λέει “Use local settings (most recent device wins)” αλλά δεν έχει **recency signal**.

### Recommendation
- Πρόσθεσε `settingsUpdatedAt` (server timestamp) ή `lastDeviceWriteAt`.
- Merge rule: settings with newer timestamp wins.

### Another gap
- Το local key `unlocked_themes` δεν φαίνεται να υπάρχει στο σημερινό game storage. Αν το βάλεις, θέλει:
  - migration/versioning στο localStorage, ή safe fallback.

---

## 8) App integration & lifecycle

### Observation
- Το plan ξεκινά anonymous sign-in μόλις ο χρήστης υποβάλει nickname.

### Recommendation
- Για πιο ομαλό UX/λιγότερα edge cases:
  - Κάνε **anonymous sign-in on app start**,
  - και μετά μόνο γράφεις nickname/profile όταν ολοκληρωθεί onboarding.

Benefits:
- έχεις `uid` από νωρίς
- μειώνεις “no user” state handling

---

## 9) Firestore indexes file

### Issue
Το sample `firestore.indexes.json` χρησιμοποιεί `collectionGroup` για top-level collections. Συνήθως τα leaderboards θα είναι top-level collections, όχι collection groups.

### Recommendation
- Αν μείνουν top-level collections, indexes πιθανόν είναι unnecessary για το απλό `orderBy(score desc)`.
- Αν χρειαστεί indexes, φρόντισε να ταιριάζει με το πραγματικό schema (collection vs collectionGroup).

---

## 10) Developer experience improvements

### Quick wins
- Πρόσθεσε `docs/FIREBASE_SETUP.md`:
  - πώς φτιάχνουμε project
  - πώς βάζουμε env vars
  - πώς τρέχουμε emulators (αν τα βάλεις)
- Πρόσθεσε `src/firebase/errors.ts` για normalization των Firebase errors σε user-friendly messages.

### Testing
- Για critical logic (mergeData, nickname validation): βάλε μικρά unit tests (αν έχει ήδη test infra). Αν όχι, έστω pure function tests later.

---

## Suggested minimal changes to the plan (recommended edits)

1) Replace `getUserRank()` implementation to use `getCountFromServer`.
2) Make nickname reservation transactional.
3) Replace client ISO timestamps with `serverTimestamp()`.
4) Fix the `odea: odea` bug.
5) Add tie-breaker order in leaderboard queries.
6) Add settings recency field for cross-device sync.

---

## Optional ideas (high value, low complexity)

- **“Daily leaderboard”**: store daily best throw per date (cheap retention + fun) without full multiplayer.
- **Soft anti-cheat**: reject absurd jumps (client-side) and flag suspicious (server-side later).
- **Privacy**: keep profiles minimal (nickname + scores) and avoid storing too much telemetry by default.
