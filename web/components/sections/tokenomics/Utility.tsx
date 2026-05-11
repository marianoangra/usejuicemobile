'use client';

import type { ComponentType } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Banknote,
  Zap,
  Sparkles,
  Vote,
  ShoppingBag,
  type LucideProps,
} from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

type UtilityKey = 'withdraw' | 'boost' | 'nft' | 'dao' | 'marketplace';

const ITEMS: { key: UtilityKey; Icon: ComponentType<LucideProps> }[] = [
  { key: 'withdraw', Icon: Banknote },
  { key: 'boost', Icon: Zap },
  { key: 'nft', Icon: Sparkles },
  { key: 'dao', Icon: Vote },
  { key: 'marketplace', Icon: ShoppingBag },
];

export function Utility() {
  const t = useTranslations('tokenomics.utility');
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
            className="section-title mt-5 metal-text"
          >
            {t('title')}
          </h2>
          <p className="mt-5 text-base md:text-lg text-white/55 leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        <ul className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {ITEMS.map((item, i) => (
            <motion.li
              key={item.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                duration: 0.6,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="metal-card group rounded-3xl p-6 md:p-7"
            >
              <div className="metal-step-icon inline-flex h-12 w-12 items-center justify-center rounded-2xl">
                <item.Icon className="h-5 w-5 text-secondary-light" />
              </div>
              <h3 className="mt-5 text-lg md:text-xl font-bold text-white">
                {t(`items.${item.key}.title`)}
              </h3>
              <p className="mt-2 text-sm md:text-base text-white/55 leading-relaxed">
                {t(`items.${item.key}.body`)}
              </p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
