import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function isConfigured(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;

function getApp_(): FirebaseApp | null {
  if (!isConfigured()) return null;
  if (_app) return _app;
  _app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig as Required<typeof firebaseConfig>);
  return _app;
}

function getDb(): Firestore | null {
  if (_db) return _db;
  const app = getApp_();
  if (!app) return null;
  _db = getFirestore(app);
  return _db;
}

export type PublicStats = {
  users?: number;       // global user count (Android + iOS)
  minutes?: number;     // total minutes validated on-chain
  juice?: number;       // total $JUICE distributed (totalPontos / 1000)
  saquesPix?: number;   // total PIX cashouts processed
  indicacoes?: number;  // total active referrals
};

/**
 * Reads the public-facing aggregate counters from `stats/public` in
 * Firestore. The doc is maintained by an external Cloud Function that
 * runs ~daily; field names below mirror what's already on disk.
 *
 * Resilient by design — any failure mode (Firebase not configured, doc
 * missing, permission-denied) returns null so the caller can fall back
 * to a static placeholder without breaking the UI.
 */
export async function getPublicStats(): Promise<PublicStats | null> {
  const db = getDb();
  if (!db) return null;

  const { doc, getDoc } = await import('firebase/firestore');

  try {
    const snap = await getDoc(doc(db, 'stats', 'public'));
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    const num = (v: unknown): number | undefined =>
      typeof v === 'number' && Number.isFinite(v) ? v : undefined;

    const totalPontos = num(data.totalPontos);
    return {
      users: num(data.totalUsuarios),
      minutes: num(data.totalMinutos),
      juice: typeof totalPontos === 'number' ? Math.floor(totalPontos / 1000) : undefined,
      saquesPix: num(data.totalSaquesPIX),
      indicacoes: num(data.totalIndicacoes),
    };
  } catch {
    // permission-denied, network error, or anything else → fall back silently.
    return null;
  }
}

export type LeadInsert = {
  email: string;
  locale: string;
  source?: string;
};

export type WaitlistInsert = {
  email: string;
  walletAddress?: string | null;
  locale: string;
  source?: string;
  uid?: string | null;
};

/**
 * Inserts a wallet-aware signup into the JUICE airdrop waitlist.
 * Doc ID = sanitized email so the second submit hits the same doc and is
 * blocked by the create-only rule (UX still shows success — already on list).
 */
export async function insertWaitlist(
  entry: WaitlistInsert,
): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: 'firebase_not_configured' };

  const { doc, setDoc, serverTimestamp, FirestoreError } = await import(
    'firebase/firestore'
  );

  const docId = entry.email
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, '_')
    .slice(0, 140);

  try {
    await setDoc(doc(db, 'juice_waitlist', docId), {
      email: entry.email.toLowerCase().trim(),
      walletAddress: entry.walletAddress ?? null,
      locale: entry.locale,
      source: entry.source ?? 'web-airdrop',
      uid: entry.uid ?? null,
      createdAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof FirestoreError && e.code === 'permission-denied') {
      return { ok: true };
    }
    // eslint-disable-next-line no-console
    console.error('[insertWaitlist] Firebase write failed:', e);
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : 'unknown';
    return { ok: false, error: msg };
  }
}

/**
 * Inserts a lead into the `leads` Firestore collection. Idempotent on email:
 * subsequent submits of the same email no-op (security rule blocks update).
 *
 * Returns `{ ok: true }` on success or duplicate (so the user sees the same
 * UX). Returns `{ ok: false, error }` only on real failures.
 */
export async function insertLead(lead: LeadInsert): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  if (!db) {
    return { ok: false, error: 'firebase_not_configured' };
  }

  // Lazy-load Firestore SDK to keep initial bundle small.
  const { doc, setDoc, serverTimestamp, FirestoreError } = await import('firebase/firestore');

  // Use a sanitized email as the document ID so a second submit hits the same
  // doc and is rejected by the security rule (which only allows `create`).
  const docId = lead.email.toLowerCase().replace(/[^a-z0-9@._-]/g, '_').slice(0, 140);

  try {
    await setDoc(
      doc(db, 'leads', docId),
      {
        email: lead.email.toLowerCase().trim(),
        locale: lead.locale,
        source: lead.source ?? 'website-waitlist',
        createdAt: serverTimestamp(),
      }
    );
    return { ok: true };
  } catch (e) {
    // permission-denied happens when the doc already exists (rule blocks update) —
    // treat as a successful "already on the list" signup so the user sees success.
    if (e instanceof FirestoreError && e.code === 'permission-denied') {
      return { ok: true };
    }
    // eslint-disable-next-line no-console
    console.error('[insertLead] Firebase write failed:', e);
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : 'unknown';
    return { ok: false, error: msg };
  }
}

