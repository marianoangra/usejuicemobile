'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Stars } from '@/components/ui/Stars';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

export function TokenomicsHero() {
  const t = useTranslations('tokenomics.hero');
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();

  const stats = [
    { label: t('stats.supplyLabel'), value: t('stats.supplyValue') },
    { label: t('stats.chainLabel'), value: t('stats.chainValue') },
    { label: t('stats.modelLabel'), value: t('stats.modelValue') },
  ];

  return (
    <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20">
      <div aria-hidden className="absolute inset-0 bg-hero-gradient" />
      <div aria-hidden className="absolute inset-0 bg-grid opacity-50" />
      <Stars count={80} seed={91} />
      <div aria-hidden className="absolute inset-0 bg-glow-tr" />

      <div className="relative z-10 mx-auto max-w-[1100px] px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionBadge variant="primary">{t('eyebrow')}</SectionBadge>
        </motion.div>

        <motion.h1
          ref={titleRef}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-3xl text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight metal-text"
        >
          {t('title')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-2xl text-base md:text-lg text-white/55 leading-relaxed"
        >
          {t('subtitle')}
        </motion.p>

        <motion.dl
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="metal-stat-card rounded-2xl p-5 md:p-6"
            >
              <dt className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                {stat.label}
              </dt>
              <dd className="mt-2 text-2xl md:text-3xl font-bold tracking-tight metal-text">
                {stat.value}
              </dd>
            </div>
          ))}
        </motion.dl>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10"
        >
          <ButtonLink href="#" variant="outline" size="md">
            {t('ctaWhitepaper')}
            <ArrowUpRight className="h-4 w-4" />
          </ButtonLink>
        </motion.div>
      </div>
    </section>
  );
}
