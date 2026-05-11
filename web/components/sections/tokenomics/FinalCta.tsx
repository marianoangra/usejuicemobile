'use client';

import type { ComponentType } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Send,
  MessageCircle,
  Twitter,
  FileText,
  type LucideProps,
} from 'lucide-react';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

type CtaKey = 'telegram' | 'discord' | 'twitter' | 'whitepaper';

const CTAS: { key: CtaKey; envKey?: string; fallback?: string; Icon: ComponentType<LucideProps> }[] = [
  {
    key: 'telegram',
    envKey: 'NEXT_PUBLIC_TELEGRAM_URL',
    Icon: Send,
  },
  {
    key: 'discord',
    envKey: 'NEXT_PUBLIC_DISCORD_URL',
    Icon: MessageCircle,
  },
  {
    key: 'twitter',
    envKey: 'NEXT_PUBLIC_TWITTER_URL',
    Icon: Twitter,
  },
  {
    key: 'whitepaper',
    fallback: '#',
    Icon: FileText,
  },
];

function getHref(envKey: string | undefined, fallback: string | undefined) {
  if (envKey && typeof process !== 'undefined') {
    const v = process.env[envKey as keyof NodeJS.ProcessEnv];
    if (v) return v;
  }
  return fallback ?? '#';
}

export function FinalCta() {
  const t = useTranslations('tokenomics.finalCta');
  const tDisclaimer = useTranslations('tokenomics');
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
          className="metal-card relative overflow-hidden rounded-3xl p-8 md:p-12"
        >
          {/* Subtle olive radial accent */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                'radial-gradient(circle at 80% 0%, rgba(148,176,72,0.10) 0%, transparent 55%)',
            }}
          />

          <div className="relative">
            <h2
              ref={titleRef}
              className="text-3xl md:text-5xl font-bold tracking-tight metal-text"
            >
              {t('title')}
            </h2>
            <p className="mt-4 max-w-xl text-base md:text-lg text-white/60 leading-relaxed">
              {t('subtitle')}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {CTAS.map((cta) => {
                const href = getHref(cta.envKey, cta.fallback);
                const isExternal = href.startsWith('http');
                return (
                  <a
                    key={cta.key}
                    href={href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="metal-outline inline-flex items-center gap-2.5 rounded-[14px] px-5 py-3 text-sm font-bold transition-all hover:translate-y-[-1px]"
                  >
                    <cta.Icon className="h-4 w-4" />
                    {t(cta.key)}
                  </a>
                );
              })}
            </div>
          </div>
        </motion.div>

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-white/35">
          {tDisclaimer('disclaimer')}
        </p>
      </div>
    </section>
  );
}
