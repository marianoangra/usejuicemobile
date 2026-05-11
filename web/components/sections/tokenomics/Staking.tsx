'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

const TIER_KEYS = ['flexible', 'thirty', 'ninety', 'oneeighty'] as const;

export function Staking() {
  const t = useTranslations('tokenomics.staking');
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();

  return (
    <section className="relative py-24 md:py-32">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />

      <div className="mx-auto max-w-[1100px] px-5 md:px-8">
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
            <Lock className="h-7 w-7 md:h-8 md:w-8 text-primary-light shrink-0" />
            {t('title')}
          </h2>
          <p className="mt-5 text-base md:text-lg text-white/55 leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="metal-card mt-10 rounded-3xl overflow-hidden"
        >
          <div className="grid grid-cols-2 gap-4 px-6 md:px-8 py-4 border-b border-white/[0.06]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/60">
              {t('tableHeaders.lockup')}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/60 text-right">
              {t('tableHeaders.multiplier')}
            </span>
          </div>
          <ul>
            {TIER_KEYS.map((key, i) => {
              const row = t.raw(`tiers.${key}`) as [string, string];
              const isHighlight = key === 'oneeighty';
              return (
                <li
                  key={key}
                  className={`grid grid-cols-2 gap-4 px-6 md:px-8 py-5 items-center ${
                    i < TIER_KEYS.length - 1 ? 'border-b border-white/[0.04]' : ''
                  }`}
                >
                  <span className="text-base md:text-lg font-semibold text-white">
                    {row[0]}
                  </span>
                  <span
                    className={`font-mono text-base md:text-xl font-bold tabular-nums text-right ${
                      isHighlight ? 'metal-text' : 'text-white/85'
                    }`}
                  >
                    {row[1]}
                  </span>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
