import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CNB Mobile — Carregue seu celular. Ganhe recompensas.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#050805',
          color: 'white',
          padding: '72px 80px',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top-right ambient glow */}
        <div
          style={{
            position: 'absolute',
            top: -260,
            right: -220,
            width: 680,
            height: 680,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(168,219,58,0.22) 0%, rgba(168,219,58,0.08) 40%, transparent 72%)',
            display: 'flex',
          }}
        />
        {/* Bottom-left ambient glow */}
        <div
          style={{
            position: 'absolute',
            bottom: -240,
            left: -200,
            width: 560,
            height: 560,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(148,176,72,0.16) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: '#2b4313',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #c2e652, #94b048)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
                fontWeight: 900,
                color: '#0a1502',
              }}
            >
              ⚡
            </div>
          </div>
          <div style={{ display: 'flex', fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em' }}>
            <span>CNB&nbsp;</span>
            <span style={{ color: '#a8db3a' }}>Mobile</span>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: 'white',
              display: 'flex',
            }}
          >
            Carregue seu celular.
          </div>
          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: '#a8db3a',
              display: 'flex',
            }}
          >
            Ganhe recompensas.
          </div>

          {/* Footer row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              marginTop: 36,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                border: '1px solid rgba(168,219,58,0.45)',
                borderRadius: 999,
                fontSize: 18,
                color: '#a8db3a',
                letterSpacing: '0.18em',
                fontWeight: 600,
              }}
            >
              DEPIN · SOLANA · BRASIL
            </div>
            <div style={{ display: 'flex', fontSize: 22, color: 'rgba(255,255,255,0.55)' }}>
              usejuicemobile.com
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
