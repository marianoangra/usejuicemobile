'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  PenLine,
  ClipboardCheck,
  Rocket,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

const STEPS: Array<{ key: string; icon: LucideIcon }> = [
  { key: 'brief', icon: PenLine },
  { key: 'curate', icon: ClipboardCheck },
  { key: 'deliver', icon: Rocket },
  { key: 'measure', icon: BarChart3 },
];

export function PartnersFlow() {
  const t = useTranslations('pages.parceiros.flow');
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();

  return (
    <section className="relative py-24 md:py-32">
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

        <div className="mt-14 relative">
          {/* Horizontal connector */}
          <div
            aria-hidden
            className="absolute left-12 right-12 top-12 hidden lg:block h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative"
                >
                  <div className="relative metal-card rounded-3xl p-6 md:p-7 z-10">
                    <div className="metal-step-icon inline-flex h-12 w-12 items-center justify-center rounded-2xl text-secondary-light">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.32em] font-medium text-secondary-light/85">
                      {t(`steps.${step.key}.label`)}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-white tracking-tight">
                      {t(`steps.${step.key}.title`)}
                    </h3>
                    <p className="mt-2.5 text-sm text-white/55 leading-relaxed">
                      {t(`steps.${step.key}.description`)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
