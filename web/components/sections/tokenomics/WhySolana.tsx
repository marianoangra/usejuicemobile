'use client';

import type { ComponentType } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Zap,
  Layers,
  Image as ImageIcon,
  Globe,
  Smartphone,
  type LucideProps,
} from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

type WhyKey = 'fees' | 'compression' | 'cnft' | 'depin' | 'wallet';

const ITEMS: { key: WhyKey; Icon: ComponentType<LucideProps> }[] = [
  { key: 'fees', Icon: Zap },
  { key: 'compression', Icon: Layers },
  { key: 'cnft', Icon: ImageIcon },
  { key: 'depin', Icon: Globe },
  { key: 'wallet', Icon: Smartphone },
];

export function WhySolana() {
  const t = useTranslations('tokenomics.whySolana');
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

        <ul className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
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
              className="metal-card group rounded-2xl p-5 md:p-6"
            >
              <div className="metal-step-icon inline-flex h-10 w-10 items-center justify-center rounded-xl">
                <item.Icon className="h-4 w-4 text-secondary-light" />
              </div>
              <h3 className="mt-4 text-base md:text-lg font-bold text-white">
                {t(`items.${item.key}.title`)}
              </h3>
              <p className="mt-2 text-sm text-white/55 leading-relaxed">
                {t(`items.${item.key}.body`)}
              </p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
