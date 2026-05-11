'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
} from 'framer-motion';
import { PhoneMockup } from '@/components/ui/PhoneMockup';
import { Stars } from '@/components/ui/Stars';
import { StoreButtons } from '@/components/ui/StoreButtons';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';
import type { PublicStats } from '@/lib/firebase';

const POINTS_START = 60_000;
const POINTS_END = 120_000;
const POINTS_GOAL = 100_000;
const COUNT_SECONDS = 5;
const PAUSE_SECONDS = 1.8;
const LIME = '#a8db3a';

// Auto-upgrade target: when NEXT_PUBLIC_CNB_MINT_ADDRESS is set in Vercel
// the live badge starts deep-linking to the token page on Solscan.
// Until then, falls back to solscan.io root with the memos claim.
const MINT_ADDRESS = process.env.NEXT_PUBLIC_CNB_MINT_ADDRESS ?? '';

type HeroProps = { stats?: PublicStats | null };

export function Hero({ stats }: HeroProps = {}) {
  const t = useTranslations('hero');
  const headlineRef = useMetalSpotlight<HTMLSpanElement>();

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Layered backgrounds */}
      <div aria-hidden className="absolute inset-0 bg-hero-gradient" />
      <div aria-hidden className="absolute inset-0 bg-grid opacity-60" />
      <Stars count={110} seed={73} />
      <div aria-hidden className="absolute inset-0 bg-glow-tr" />
      <div aria-hidden className="absolute inset-0 bg-glow-bl" />

      {/* Bottom fade — long multi-stop dissolve into the next section */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[420px] z-10"
        style={{
          background: `linear-gradient(to bottom,
            rgba(4, 11, 26, 0) 0%,
            rgba(4, 11, 26, 0.05) 18%,
            rgba(4, 11, 26, 0.18) 35%,
            rgba(4, 11, 26, 0.38) 52%,
            rgba(4, 11, 26, 0.62) 68%,
            rgba(4, 11, 26, 0.82) 82%,
            rgba(4, 11, 26, 0.95) 92%,
            rgba(4, 11, 26, 1) 100%
          )`,
        }}
      />

      <div className="relative z-20 mx-auto max-w-[1080px] px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-24 items-center">
          {/* Left: copy */}
          <div className="lg:col-span-7">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="hero-headline text-white"
            >
              <span className="block whitespace-normal sm:whitespace-nowrap">
                {t('headlineLine1')}
              </span>
              <span ref={headlineRef} className="metal-text block whitespace-normal sm:whitespace-nowrap">
                {t('headlineLine2')}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="hero-subtitle mt-7 max-w-xl"
              style={{ fontSize: 'clamp(0.9rem, 1.8vw, 1.08rem)' }}
            >
              {t('subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-20 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <StoreButtons size="lg" />
            </motion.div>

            <motion.a
              href={MINT_ADDRESS ? `https://solscan.io/token/${MINT_ADDRESS}` : 'https://solscan.io/'}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="group mt-10 inline-flex w-fit items-center gap-3 rounded-full border border-[rgba(168,219,58,0.32)] bg-[rgba(168,219,58,0.06)] px-4 py-2 backdrop-blur-sm transition-all hover:border-[rgba(168,219,58,0.55)] hover:bg-[rgba(168,219,58,0.10)]"
            >
              {/* aria-hidden on the dot so the accessible name comes purely
                  from the two text spans below — visible text drives the
                  accessible name, no aria-label/textContent mismatch. */}
              <span aria-hidden="true" className="relative inline-flex h-2 w-2 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping [animation-duration:2.5s] rounded-full bg-[#a8db3a] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#a8db3a]" />
              </span>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a8db3a]">
                {MINT_ADDRESS ? '$JUICE · Solana' : 'Live · Solana mainnet'}
              </span>
              <LiveBadgeMetric mintExists={Boolean(MINT_ADDRESS)} stats={stats} />
            </motion.a>

          </div>

          {/* Right: phone with live mocked home screen — sized to fit
              the hero viewport without scroll (~30% smaller than default). */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <PhoneMockup
              src="/images/screen-home-real.png"
              alt="CNB Mobile app — Início"
              priority
              width={202}
              height={436}
            >
              <AnimatedPointsOverlay />
            </PhoneMockup>
          </div>
        </div>
      </div>
    </section>
  );
}

// Secondary text inside the live Solscan badge.
//
// Rendering rules:
//   1. If the token mint is set, badge deep-links to the token page —
//      show a generic CTA ("view on solscan") regardless of stats.
//   2. Otherwise: prefer a live "{users} brasileiros" pulled from
//      stats/public, animated count-up on mount. Falls back to the
//      static memo claim when stats aren't available.
function LiveBadgeMetric({
  mintExists,
  stats,
}: {
  mintExists: boolean;
  stats?: PublicStats | null;
}) {
  const reduce = useReducedMotion();
  const target = stats?.users && stats.users > 0 ? stats.users : null;
  const motionValue = useMotionValue(reduce && target ? target : 0);

  useEffect(() => {
    if (target == null || reduce) return;
    const c = animate(motionValue, target, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => c.stop();
  }, [motionValue, target, reduce]);

  const label = useTransform(motionValue, (v) =>
    `${Math.floor(v).toLocaleString('pt-BR')} brasileiros · solscan.io`
  );

  const baseClass =
    'font-mono text-xs text-white/65 group-hover:text-white/85 transition-colors';

  if (mintExists) {
    return <span className={baseClass}>view on solscan</span>;
  }

  if (target == null) {
    return <span className={baseClass}>460k+ memos · solscan.io</span>;
  }

  return (
    <motion.span className={`${baseClass} tabular-nums`}>
      {label}
    </motion.span>
  );
}

// Overlay that masks the static "159.580" baked into screen-home-real.png and
// animates the points up to 180.400 in a loop. Position is calibrated visually
// against the screenshot inside a 202×436 phone-screen.
function AnimatedPointsOverlay() {
  const reduce = useReducedMotion();
  const points = useMotionValue(POINTS_START);

  useEffect(() => {
    if (reduce) {
      points.set(POINTS_END);
      return;
    }
    const c = animate(points, POINTS_END, {
      duration: COUNT_SECONDS,
      ease: 'easeOut',
      repeat: Infinity,
      repeatType: 'loop',
      repeatDelay: PAUSE_SECONDS,
    });
    return () => c.stop();
  }, [points, reduce]);

  const text = useTransform(points, (v) =>
    Math.floor(v).toLocaleString('pt-BR')
  );

  // Bar fill: 0..100k maps to 0..100%, capped at 100% past the goal.
  const barFill = useTransform(
    points,
    (v) => `${Math.min(100, (v / POINTS_GOAL) * 100).toFixed(2)}%`
  );

  return (
    <>
      {/* Animated number — overlays the static "159.580" baked into the PNG. */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{ top: '17%', left: '6.5%' }}
      >
        {/* Feathered backdrop — heavy blur + radial mask so the patch blends
            into the surrounding panel instead of looking like a sticker. */}
        <div
          style={{
            position: 'absolute',
            inset: '-6px -16px',
            background: 'linear-gradient(180deg, #0e1a10 0%, #0a130c 100%)',
            borderRadius: 14,
            filter: 'blur(6px)',
            opacity: 0.9,
            WebkitMaskImage:
              'radial-gradient(ellipse 95% 110% at 50% 50%, black 45%, transparent 100%)',
            maskImage:
              'radial-gradient(ellipse 95% 110% at 50% 50%, black 45%, transparent 100%)',
          }}
        />
        <motion.span
          className="relative font-extrabold leading-none tracking-tight tabular-nums"
          style={{ color: LIME, fontSize: 26 }}
        >
          {text}
        </motion.span>
      </div>

      {/* Animated progress bar — overlays the static 100% bar in the PNG.
          Opaque backdrop fully masks the static fill below; subtle track
          highlight + lime fill render on top. Slightly taller than the
          original to guarantee coverage even with positioning drift. */}
      <div
        aria-hidden
        className="absolute pointer-events-none overflow-hidden"
        style={{
          top: '24.2%',
          left: '8.5%',
          width: '83%',
          height: 9,
          background: '#0c170e',
          borderRadius: 999,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 999,
          }}
        />
        <motion.div
          style={{
            position: 'relative',
            height: '100%',
            width: barFill,
            background: `linear-gradient(90deg, #7fb028, ${LIME})`,
            borderRadius: 999,
          }}
        />
      </div>
    </>
  );
}
