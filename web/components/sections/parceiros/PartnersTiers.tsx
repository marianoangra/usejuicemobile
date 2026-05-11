'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { cn } from '@/lib/cn';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

const TIERS: Array<{ key: string; featured?: boolean }> = [
  { key: 'pilot' },
  { key: 'growth', featured: true },
  { key: 'enterprise' },
];

export function PartnersTiers() {
  const t = useTranslations('pages.parceiros.tiers');
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();

  return (
    <section className="relative py-24 md:py-32">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />

      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="max-w-2xl">
          <SectionBadge>{t('badge')}</SectionBadge>
          <h2 ref={titleRef} className="section-title mt-5 metal-text">
            {t('title')}
          </h2>
          <p className="mt-5 max-w-xl text-base md:text-lg text-white/55 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {TIERS.map((tier, i) => {
            const features = t.raw(`items.${tier.key}.features`) as string[];
            return (
              <motion.div
                key={tier.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.07,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={cn(
                  'metal-card relative rounded-3xl p-7 md:p-8 flex flex-col',
                  tier.featured && 'ring-1 ring-primary/40 shadow-glow-card'
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    {t(`items.${tier.key}.name`)}
                  </h3>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                    {t(`items.${tier.key}.duration`)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-white/55">
                  {t(`items.${tier.key}.tagline`)}
                </p>

                <div className="mt-6 pb-6 border-b border-white/[0.06]">
                  <div className="text-xl font-semibold text-secondary-light">
                    {t(`items.${tier.key}.price`)}
                  </div>
                </div>

                <ul className="mt-6 space-y-3 flex-1">
                  {features.map((f, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-sm text-white/65 leading-relaxed"
                    >
                      <Check className="h-4 w-4 text-primary-light shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#partner-form"
                  className={cn(
                    'mt-7 inline-flex items-center justify-center gap-2 rounded-[14px] px-6 py-3 text-sm font-bold',
                    tier.featured ? 'metal-cta' : 'metal-outline'
                  )}
                >
                  {t('cta')}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
