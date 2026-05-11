'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Download,
  Activity,
  TrendingUp,
  Clock,
  Globe,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

const ITEMS: Array<{ key: string; icon: LucideIcon }> = [
  { key: 'downloads', icon: Download },
  { key: 'dau', icon: Activity },
  { key: 'retention', icon: Clock },
  { key: 'sessions', icon: TrendingUp },
  { key: 'geo', icon: Globe },
  { key: 'demo', icon: Users },
];

export function PartnersKpi() {
  const t = useTranslations('pages.parceiros.kpi');
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

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  duration: 0.6,
                  delay: (i % 3) * 0.06 + Math.floor(i / 3) * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="metal-stat-card rounded-2xl p-5 md:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                    {t(`items.${item.key}.label`)}
                  </div>
                  <Icon className="h-4 w-4 text-secondary-light/70 shrink-0" />
                </div>
                <div className="mt-3 text-2xl md:text-3xl font-semibold text-white tracking-tight">
                  {t(`items.${item.key}.value`)}
                </div>
                <div className="mt-2 text-xs text-white/65 leading-relaxed">
                  {t(`items.${item.key}.note`)}
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-8 text-xs text-white/35 italic max-w-2xl">
          {t('disclaimer')}
        </p>
      </div>
    </section>
  );
}
