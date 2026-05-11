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

const FUNCTIONS_BASE = 'https://us-central1-cnbmobile-2053c.cloudfunctions.net';

/**
 * Inserts a wallet-aware signup into the JUICE airdrop waitlist via Cloud Function.
 * Rate limited server-side (3 req/IP per 10 min). Idempotent on email.
 */
export async function insertWaitlist(
  entry: WaitlistInsert,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${FUNCTIONS_BASE}/registrarWaitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: entry.email,
        walletAddress: entry.walletAddress ?? null,
        locale: entry.locale,
        source: entry.source ?? 'web-airdrop',
        uid: entry.uid ?? null,
      }),
    });
    const json = await res.json();
    if (json.ok || json.existing) return { ok: true };
    if (res.status === 429) return { ok: false, error: 'rate_limit' };
    return { ok: false, error: json.reason ?? 'unknown' };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[insertWaitlist] request failed:', e);
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : 'unknown';
    return { ok: false, error: msg };
  }
}

/**
 * Inserts a lead via Cloud Function.
 * Rate limited server-side (3 req/IP per 10 min). Idempotent on email.
 */
export async function insertLead(lead: LeadInsert): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${FUNCTIONS_BASE}/registrarLead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: lead.email,
        locale: lead.locale,
        source: lead.source ?? 'website-waitlist',
      }),
    });
    const json = await res.json();
    if (json.ok || json.existing) return { ok: true };
    if (res.status === 429) return { ok: false, error: 'rate_limit' };
    return { ok: false, error: json.reason ?? 'unknown' };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[insertLead] request failed:', e);
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : 'unknown';
    return { ok: false, error: msg };
  }
}

