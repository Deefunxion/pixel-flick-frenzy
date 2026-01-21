# One‑More‑Flick

A minimalist arcade flick game with hand-drawn ballpoint pen aesthetics, rendered on a tiny pixel canvas (480×240).

## How to play

- Goal: land as close as possible to the cliff edge (420) without falling off.
- Beat the moving Zeno target to level up (the target moves halfway to the unreachable edge each level).

Controls:

- Desktop: hold `SPACE` or click & hold to charge power, release to launch.
- Aim: while holding, drag up/down (or use arrow keys) to adjust launch angle.
- Mobile: tap & hold on the padded input area (you can hold outside the canvas so your finger doesn’t cover the game).

## Features

- Hand-drawn ballpoint pen style with blue and orange trademark colors
- Sprite-based character animations (Zeno flipbook with 50 frames, 9 animations)
- Risk/reward multiplier as you approach the edge
- Achievements + stats persisted locally and synced to cloud (Firebase)
- Multiplayer leaderboards (total score, best throw, total falls)
- Ghost trail of your best run
- Daily best distance
- WebAudio SFX with mute/volume + reduced FX toggle
- Contextual tutorials with slow-motion for new players

## Development

```bash
npm install
npm run dev
```

Other commands:

```bash
npm run build
npm run lint
npm run preview
```
