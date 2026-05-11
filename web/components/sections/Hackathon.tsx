'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowUpRight, Trophy } from 'lucide-react';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

export function Hackathon() {
  const t = useTranslations('hackathon');
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();

  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="metal-card relative overflow-hidden rounded-[28px]"
        >
          {/* Decorative gradients */}
          <div aria-hidden className="absolute inset-0 bg-glow-tr opacity-80" />
          <div aria-hidden className="absolute inset-0 bg-grid opacity-30" />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 p-8 md:p-12 lg:p-16">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/[0.08] px-3 py-1.5">
                <Trophy className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-primary">
                  {t('badge')}
                </span>
              </div>
              <h2 ref={titleRef} className="section-title mt-6 metal-text">{t('title')}</h2>
              <p className="mt-5 max-w-xl text-base md:text-lg text-white/65 leading-relaxed">
                {t('description')}
              </p>
              <div className="mt-8">
                <ButtonLink
                  href="https://www.colosseum.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                >
                  {t('cta')}
                  <ArrowUpRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            </div>

            <div className="lg:col-span-5">
              <dl className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
                {(['category', 'network', 'market'] as const).map((k) => (
                  <div
                    key={k}
                    className="metal-stat-card rounded-2xl backdrop-blur-sm p-5"
                  >
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                      {t(`stats.${k}`)}
                    </dt>
                    <dd className="mt-1.5 text-xl font-semibold text-white">
                      {t(`stats.${k}Value`)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
