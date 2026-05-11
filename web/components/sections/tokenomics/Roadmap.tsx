'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

const MILESTONE_KEYS = [
  'whitepaper',
  'audit',
  'snapshot',
  'ido',
  'wallet',
  'marketplace',
] as const;

interface Milestone {
  title: string;
  when: string;
  status: 'done' | 'pending';
}

export function Roadmap() {
  const t = useTranslations('tokenomics.roadmap');
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
            className="section-title mt-5 metal-text"
          >
            {t('title')}
          </h2>
          <p className="mt-5 text-base md:text-lg text-white/55 leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        <ol className="mt-12 relative">
          {/* Vertical line */}
          <span
            aria-hidden
            className="absolute left-[19px] md:left-[23px] top-2 bottom-2 w-px bg-gradient-to-b from-secondary/50 via-white/10 to-transparent"
          />

          {MILESTONE_KEYS.map((key, i) => {
            const m = t.raw(`milestones.${key}`) as Milestone;
            const done = m.status === 'done';
            return (
              <motion.li
                key={key}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.07,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative flex items-start gap-4 md:gap-6 pb-8 last:pb-0"
              >
                {/* Marker */}
                <div
                  className={`relative z-10 flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full ${
                    done
                      ? 'metal-step-icon'
                      : 'bg-bg-deep ring-1 ring-white/10'
                  }`}
                >
                  {done ? (
                    <Check className="h-4 w-4 md:h-5 md:w-5 text-secondary-light" />
                  ) : (
                    <Circle className="h-3 w-3 md:h-4 md:w-4 text-white/55" />
                  )}
                </div>

                {/* Content */}
                <div
                  className={`flex-1 pt-1 md:pt-1.5 ${
                    done ? '' : 'opacity-80'
                  }`}
                >
                  <div className="font-mono text-[11px] uppercase tracking-wider text-white/60">
                    {m.when}
                  </div>
                  <div className="mt-1 text-base md:text-lg font-semibold text-white">
                    {m.title}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
