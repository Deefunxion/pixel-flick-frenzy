# Plan: Arcade Layer (Bomb Jack/Joust + Doodles)

## 1) Tune Bomb Jack/Joust Physics
- Αυξάνεις κάθετη άρση/πλεύση και οριζόντια ορμή στο precision/update loop (throttle/float + μικρά "flap" impulses).
- Σφιχτά caps σε ταχύτητες, inertia μικρότερο, γρήγορη απόκριση taps/holds.
- Τήρηση stamina/edge scaling για ρίσκο κοντά στο 420.

## 2) Doodle Collectibles
- Νέο module `collectibles.ts`: seeded generation ανά throw/stage, 3-8 doodles.
- Motion patterns: hover/patrol/figure-8, μικρό sway.
- Collision όπως rings (radius ~10-12). Juice: pop, outline flash, small score/multiplier bump.
- Update+collision στο flight block πριν τα rings· render δίπλα στα rings/bounce.

## 3) Stage Templates & Difficulty
- Stage definition: ring paths, doodle clusters, bounce/props, wind bias, gravity tweak.
- Templates ανά tier (easy/med/hard) + seeded endless ramp.
- Επιλογέας δυσκολίας/προόδου (ζώνες: early/mid/late) με unlocked effects (π.χ. περισσότερα props).

## 4) Obstacles/Props
- Επέκταση bounce ή νέα props:
  - Fans (lift/side push), Spikes (fail/knockback), Springs (vertical pop), Portals (teleport).
- Collision στο ίδιο flight block με doodles.
- Παράμετροι: force, cooldown, one-shot per throw.

## 5) Flow & Drama (Peggle Moments)
- Επανεκμετάλλευση `slowMo/zoom` πεδίων: trigger σε πλήρη doodle clear ή last doodle + κοντά στο edge.
- Micro-freeze + zoom πριν το landing όταν επίκειται PB/record zone.
- Edge bullet-time stackable μόνο αν unlocked (achievement gate κρατιέται).

## 6) Scoring/Contracts/Routes
- Routes: nodes μπορούν να είναι doodles/bounce/rings, με breadcrumb και fail reason.
- Contracts: νέα objectives (collect all doodles, no-brake, under-X stamina, in-order).
- Multipliers: full doodle clear bonus + edge bonus, capped για αποφυγή πληθωρισμού.

## 7) Rendering Polish
- Doodles: pulse/outline για αναγνωσιμότητα, μικρά trails.
- Props: καθαρή σιλουέτα, dev hit-circle toggle σε DEV.
- Route "NEXT" highlight reuse, contract HUD δείχνει στόχο/constraints.

## 8) Tuning & Playtests
- Knobs: throttle accel, flap impulse, doodle count, prop force, spawn radius, slowMo duration, zoom strength.
- Γρήγορα sessions: easy seed, mid seed, hard seed· καταγραφή TTK, fail reasons, αίσθηση ελέγχου.

---

## Further Considerations (2 εναλλακτικές η καθεμία)

1) Σειρά συλλογής doodles:
   - Option A (Strict route): Πρέπει να τα πάρει με σειρά· δίνει combo/multiplier, αποτυγχάνει αν αλλάξει σειρά.
   - Option B (Free with bonus): Ελεύθερη συλλογή, αλλά full-order clear δίνει έξτρα multiplier/slow-mo.

2) Stage progression μοντέλο:
   - Option A (Template ladder): Στατικά templates ανά tier, ξεκλείδωμα κατά πρόοδο, προβλέψιμη μάθηση.
   - Option B (Endless seeded ramp): RNG-seeded κάθε throw, κλιμάκωση δυσκολίας με throw count, περισσότερη ποικιλία.

3) Αντιμετώπιση εμποδίων:
   - Option A (Damage/fail): Spikes/λάθη = fail throw, έντονη τιμωρία, υψηλό ρίσκο.
   - Option B (Knockback/slow): Δεν σκοτώνει, αλλά χάνει χρόνο/θέση, πιο φιλικό, κρατά ροή.
