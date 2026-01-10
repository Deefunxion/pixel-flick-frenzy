// src/firebase/flags.ts

// For itch.io builds we intentionally disable Firebase so the game is fully
// self-contained and avoids third-party iframe/auth/storage quirks.
//
// Vite exposes `import.meta.env.MODE` as a compile-time constant.
export const FIREBASE_ENABLED = import.meta.env.MODE !== 'itch';
