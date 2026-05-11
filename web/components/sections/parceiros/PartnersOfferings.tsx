'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Target,
  Megaphone,
  Coins,
  MapPin,
  Repeat,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { cn } from '@/lib/cn';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

type Offering = {
  key: string;
  icon: LucideIcon;
  featured?: boolean;
};

const OFFERINGS: Offering[] = [
  { key: 'missions', icon: Target, featured: true },
  { key: 'banners', icon: Megaphone },
  { key: 'cashback', icon: Coins },
  { key: 'geo', icon: MapPin },
  { key: 'loyalty', icon: Repeat },
  { key: 'irl', icon: Sparkles },
];

export function PartnersOfferings() {
  const t = useTranslations('pages.parceiros.offerings');
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();

  return (
    <section id="partner-offerings" className="relative py-24 md:py-32">
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

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {OFFERINGS.map((o, i) => {
            const Icon = o.icon;
            return (
              <motion.div
                key={o.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  duration: 0.6,
                  delay: (i % 3) * 0.06 + Math.floor(i / 3) * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={cn(
                  'metal-card relative rounded-3xl p-7',
                  o.featured && 'ring-1 ring-secondary/40 shadow-glow-card'
                )}
              >
                {o.featured && (
                  <div className="absolute -top-3 left-7 inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-bg-deep px-3 py-1">
                    <Star className="h-3 w-3 text-secondary-light" />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-secondary-light">
                      {t('items.missions.featured')}
                    </span>
                  </div>
                )}

                <div
                  className={cn(
                    'inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-5',
                    o.featured
                      ? 'metal-step-icon text-secondary-light'
                      : 'metal-step-icon text-primary-light'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="text-lg font-semibold text-white tracking-tight">
                  {t(`items.${o.key}.title`)}
                </h3>

                <p className="mt-2.5 text-sm text-white/55 leading-relaxed">
                  {t(`items.${o.key}.description`)}
                </p>

                <div className="mt-5 pt-5 border-t border-white/[0.06] space-y-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                      {t('labels.metric')}
                    </div>
                    <div className="mt-1 text-xs font-medium text-secondary-light/90">
                      {t(`items.${o.key}.metric`)}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                      {t('labels.example')}
                    </div>
                    <div className="mt-1 text-xs text-white/50 leading-relaxed">
                      {t(`items.${o.key}.example`)}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
