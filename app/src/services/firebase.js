import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase client config — these values are PUBLIC BY DESIGN (embedded in the
// APK/IPA and visible in client traffic). Security is enforced by Firestore
// Security Rules, App Check, and Auth domain allow-list — NOT by keeping
// these values secret.
// See: https://firebase.google.com/docs/projects/api-keys
//
// Historical incident (2026-05-12): an earlier "security refactor" moved
// these to env vars with placeholder fallbacks ("REPLACE_WITH_YOUR_API_KEY").
// The EAS production environment lost its EXPO_PUBLIC_FIREBASE_* vars at some
// point; the next build fell back to the placeholders and shipped to TestFlight
// + Play internal testing with broken auth (auth/api-key-not-valid). Lesson:
// for *public-by-design* values, hardcoded fallbacks beat invisible env-var
// failure modes. Env vars are kept as an OPTIONAL override for dev/staging.
const FALLBACK_CONFIG = {
  apiKey: "AIzaSyBTx_mrEx6_k9jbN8MeOYztJbsOc6zryl0",
  authDomain: "cnbmobile-2053c.firebaseapp.com",
  projectId: "cnbmobile-2053c",
  storageBucket: "cnbmobile-2053c.firebasestorage.app",
  messagingSenderId: "144617374104",
  appId: "1:144617374104:web:cb38f3303f12616f37abed",
};

// Override-from-env: only used if the env var is set to something non-empty.
// We deliberately do NOT use `process.env.X ?? FALLBACK` — that lets an empty
// string ("") pass through as if it were a real value.
function pickConfig(envValue, fallback) {
  if (typeof envValue === 'string' && envValue.length > 0) return envValue;
  return fallback;
}

const firebaseConfig = {
  apiKey: pickConfig(process.env.EXPO_PUBLIC_FIREBASE_API_KEY, FALLBACK_CONFIG.apiKey),
  authDomain: pickConfig(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, FALLBACK_CONFIG.authDomain),
  projectId: pickConfig(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, FALLBACK_CONFIG.projectId),
  storageBucket: pickConfig(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET, FALLBACK_CONFIG.storageBucket),
  messagingSenderId: pickConfig(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, FALLBACK_CONFIG.messagingSenderId),
  appId: pickConfig(process.env.EXPO_PUBLIC_FIREBASE_APP_ID, FALLBACK_CONFIG.appId),
};

// Fail-fast: if any field still looks like a placeholder, refuse to start
// rather than silently breaking auth at sign-in time. (Won't trigger with
// the fallbacks above, but guards against future regressions where someone
// reintroduces a placeholder pattern.)
for (const [key, value] of Object.entries(firebaseConfig)) {
  if (!value || /^REPLACE_|your-project|000000000000$/i.test(String(value))) {
    throw new Error(`[firebase] Invalid placeholder value for ${key}: ${value}`);
  }
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// initializeAuth com AsyncStorage mantém a sessão entre fechamentos do app.
// O try/catch trata hot-reload do Expo Go (onde auth já pode estar inicializado).
export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
})();

export const db = getFirestore(app);
export const storage = getStorage(app);
