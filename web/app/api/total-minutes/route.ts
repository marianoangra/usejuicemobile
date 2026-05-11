import { NextResponse } from 'next/server';
import { getPublicStats } from '@/lib/firebase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let cached: { value: number | null; ts: number } | null = null;
const TTL_MS = 60_000;

export async function GET() {
  const now = Date.now();
  if (cached && now - cached.ts < TTL_MS) {
    return NextResponse.json(
      { minutes: cached.value, cached: true },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } },
    );
  }

  try {
    const stats = await getPublicStats();
    const value = stats?.minutes ?? null;
    cached = { value, ts: now };
    return NextResponse.json(
      { minutes: value },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } },
    );
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : 'unknown';
    console.error('[total-minutes]', msg);
    return NextResponse.json({ minutes: null, error: msg }, { status: 500 });
  }
}
