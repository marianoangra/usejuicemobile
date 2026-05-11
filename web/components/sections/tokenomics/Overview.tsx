'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

const ROW_KEYS = ['name', 'ticker', 'chain', 'supply', 'decimals', 'address'] as const;

const MINT_ADDRESS = process.env.NEXT_PUBLIC_CNB_MINT_ADDRESS ?? '';

export function Overview() {
  const t = useTranslations('tokenomics.overview');
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();
  const [copied, setCopied] = useState(false);

  function copyAddress() {
    if (!MINT_ADDRESS) return;
    navigator.clipboard.writeText(MINT_ADDRESS);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="relative py-20 md:py-24">
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
        >
          <SectionBadge>{t('badge')}</SectionBadge>
          <h2
            ref={titleRef}
            className="section-title mt-5 metal-text"
          >
            {t('title')}
          </h2>
          <p className="mt-5 max-w-2xl text-base md:text-lg text-white/55 leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="metal-card mt-10 rounded-3xl overflow-hidden"
        >
          <dl className="divide-y divide-white/[0.06]">
            {ROW_KEYS.map((key) => {
              const row = t.raw(`rows.${key}`) as [string, string];
              const isAddress = key === 'address';
              const displayValue =
                isAddress && MINT_ADDRESS ? MINT_ADDRESS : row[1];
              return (
                <div
                  key={key}
                  className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-6 px-5 md:px-7 py-4 md:py-5"
                >
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-white/60 self-center">
                    {row[0]}
                  </dt>
                  <dd className="flex items-center gap-3 self-center">
                    <span
                      className={
                        isAddress
                          ? 'font-mono text-sm md:text-base text-secondary-light truncate'
                          : 'text-base md:text-lg font-semibold text-white'
                      }
                    >
                      {displayValue}
                    </span>
                    {isAddress && MINT_ADDRESS && (
                      <button
                        onClick={copyAddress}
                        aria-label="Copy contract address"
                        className="metal-icon-btn inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-secondary" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </motion.div>
      </div>
    </section>
  );
}
