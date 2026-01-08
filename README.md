# One‑More‑Flick

A minimalist synthwave arcade flick game rendered on a tiny pixel canvas.

## How to play

- Goal: land as close as possible to the cliff edge (145) without falling off.
- Beat the moving Zeno target to level up (the target moves halfway to the unreachable edge).

Controls:

- Desktop: hold `SPACE` or click & hold to charge power, release to launch.
- Aim: while holding, drag up/down (or use arrow keys) to adjust launch angle.
- Mobile: tap & hold on the padded input area (you can hold outside the canvas so your finger doesn’t cover the game).

## Features

- Synthwave themes (some unlock via achievements)
- Risk/reward multiplier as you approach the edge
- Achievements + stats persisted locally
- Ghost trail of your best run
- Daily best distance
- WebAudio SFX with mute/volume + reduced FX toggle

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
