'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Smartphone,
  Leaf,
  Wallet,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

const PERSONAS: Array<{ key: string; icon: LucideIcon }> = [
  { key: 'mobile', icon: Smartphone },
  { key: 'sustainable', icon: Leaf },
  { key: 'web3', icon: Wallet },
  { key: 'urban', icon: Building2 },
];

export function PartnersAudience() {
  const t = useTranslations('pages.parceiros.audience');
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

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PERSONAS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="metal-card rounded-3xl p-6 md:p-7"
              >
                <div className="metal-step-icon inline-flex h-11 w-11 items-center justify-center rounded-2xl text-primary-light">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white tracking-tight">
                  {t(`personas.${p.key}.title`)}
                </h3>
                <p className="mt-2 text-sm text-white/55 leading-relaxed">
                  {t(`personas.${p.key}.description`)}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
