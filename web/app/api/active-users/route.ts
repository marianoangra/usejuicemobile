import { NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let cached: { value: number | null; ts: number } | null = null;
const TTL_MS = 30_000;

export async function GET() {
  const now = Date.now();
  if (cached && now - cached.ts < TTL_MS) {
    return NextResponse.json(
      { activeUsers: cached.value, cached: true },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } },
    );
  }

  const propertyId = process.env.GA4_PROPERTY_ID;
  const credsB64 = process.env.GA4_SERVICE_ACCOUNT_JSON_B64;

  if (!propertyId || !credsB64) {
    return NextResponse.json(
      { activeUsers: null, error: 'ga4_not_configured' },
      { status: 503 },
    );
  }

  try {
    const credsJson = Buffer.from(credsB64, 'base64').toString('utf-8');
    const credentials = JSON.parse(credsJson);
    const client = new BetaAnalyticsDataClient({ credentials });
    const [response] = await client.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: 'activeUsers' }],
    });
    const raw = response.rows?.[0]?.metricValues?.[0]?.value;
    const n = raw ? parseInt(raw, 10) : 0;
    const value = Number.isFinite(n) ? n : 0;
    cached = { value, ts: now };
    return NextResponse.json(
      { activeUsers: value },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } },
    );
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : 'unknown';
    console.error('[active-users]', msg);
    return NextResponse.json({ activeUsers: null, error: msg }, { status: 500 });
  }
}
