'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Flame } from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

const SOURCE_KEYS = ['withdrawal', 'marketplace', 'nftMint', 'quarterly'] as const;

// TODO: replace with live counter from on-chain endpoint
// e.g. /api/tokenomics/burned — returns total burned in lamports
const PLACEHOLDER_BURNED = 0;

function CountUp({ to, duration = 1.4 }: { to: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  useEffect(() => {
    if (!inView) return;
    if (to === 0) {
      setValue(0);
      return;
    }
    let start: number | null = null;
    let raf: number;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min((ts - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {new Intl.NumberFormat('pt-BR').format(value)}
    </span>
  );
}

export function Burn() {
  const t = useTranslations('tokenomics.burn');
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();

  return (
    <section className="relative py-24 md:py-32">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />

      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <SectionBadge>{t('badge')}</SectionBadge>
          <h2
            ref={titleRef}
            className="section-title mt-5 metal-text inline-flex items-center gap-3"
          >
            <Flame className="h-7 w-7 md:h-8 md:w-8 text-primary-light shrink-0" />
            {t('title')}
          </h2>
          <p className="mt-5 text-base md:text-lg text-white/55 leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Sources list */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="metal-card rounded-3xl p-6 md:p-8"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/60">
              {t('sourcesTitle')}
            </p>
            <ul className="mt-5 space-y-3">
              {SOURCE_KEYS.map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-light"
                    style={{ boxShadow: '0 0 8px rgba(148,176,72,0.6)' }}
                  />
                  <span className="text-sm md:text-base text-white/75 leading-relaxed">
                    {t(`sources.${key}`)}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Counter */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="metal-card rounded-3xl p-6 md:p-8 flex flex-col justify-between"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/60">
              {t('counterLabel')}
            </p>
            <div className="my-6 md:my-8">
              <div className="flex items-baseline flex-wrap gap-3">
                <span className="text-4xl md:text-6xl font-bold tracking-tightest metal-text">
                  <CountUp to={PLACEHOLDER_BURNED} />
                </span>
                <span className="text-lg md:text-xl font-semibold text-secondary-light">
                  {t('counterUnit')}
                </span>
              </div>
            </div>
            <p className="font-mono text-[11px] text-white/35">
              {t('counterNote')}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
