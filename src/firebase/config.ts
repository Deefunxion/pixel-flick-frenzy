// src/firebase/config.ts
// Firebase is conditionally initialized based on build mode

import { FIREBASE_ENABLED } from './flags';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Only import and initialize Firebase when enabled
let app: any = null;
let auth: any = null;
let db: any = null;

if (FIREBASE_ENABLED) {
  // Dynamic import to avoid loading Firebase in itch builds
  import('firebase/app').then(({ initializeApp }) => {
    app = initializeApp(firebaseConfig);

    import('firebase/auth').then(({ getAuth }) => {
      auth = getAuth(app);
    });

    import('firebase/firestore').then(({ getFirestore }) => {
      db = getFirestore(app);
    });
  });
}

export { app, auth, db };
