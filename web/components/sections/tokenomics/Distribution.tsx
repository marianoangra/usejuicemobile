'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

type SliceKey =
  | 'community'
  | 'ecosystem'
  | 'team'
  | 'treasury'
  | 'liquidity'
  | 'airdrop'
  | 'private'
  | 'public';

const SLICES: { key: SliceKey; pct: number; color: string }[] = [
  { key: 'community', pct: 40, color: '#94B048' },
  { key: 'ecosystem', pct: 15, color: '#C9B27A' },
  { key: 'team', pct: 12, color: '#6B8333' },
  { key: 'treasury', pct: 10, color: '#E8DAB1' },
  { key: 'liquidity', pct: 8, color: '#4A5E26' },
  { key: 'airdrop', pct: 7, color: '#9E8849' },
  { key: 'private', pct: 5, color: '#7A7C7E' },
  { key: 'public', pct: 3, color: '#3D5118' },
];

const TOTAL_SUPPLY = 1_000_000_000;

function formatAmount(pct: number) {
  const amount = (TOTAL_SUPPLY * pct) / 100;
  return new Intl.NumberFormat('pt-BR').format(amount);
}

export function Distribution() {
  const t = useTranslations('tokenomics.distribution');
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();
  const [active, setActive] = useState<SliceKey | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = SLICES.map((s) => ({
    name: t(`slices.${s.key}.label`),
    value: s.pct,
    color: s.color,
    key: s.key,
  }));

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

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Donut chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-square max-w-[440px] mx-auto">
              {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius="62%"
                    outerRadius="92%"
                    paddingAngle={1.5}
                    dataKey="value"
                    onMouseEnter={(_: unknown, idx: number) =>
                      setActive(SLICES[idx].key)
                    }
                    onClick={(_: unknown, idx: number) =>
                      setActive((cur) =>
                        cur === SLICES[idx].key ? null : SLICES[idx].key
                      )
                    }
                    stroke="#08100A"
                    strokeWidth={2}
                  >
                    {data.map((entry) => {
                      const isActive = active === entry.key;
                      const isDimmed = active !== null && !isActive;
                      return (
                        <Cell
                          key={entry.key}
                          fill={entry.color}
                          fillOpacity={isDimmed ? 0.3 : 1}
                          style={{
                            cursor: 'pointer',
                            outline: 'none',
                            transition: 'fill-opacity 220ms ease',
                            filter: isActive
                              ? `drop-shadow(0 0 12px ${entry.color}cc)`
                              : 'none',
                          }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              )}

              {/* Center label */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                  {t('totalLabel')}
                </span>
                <span className="mt-1 text-2xl md:text-3xl font-bold tracking-tight metal-text">
                  {t('totalValue')}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7"
          >
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SLICES.map((slice) => {
                const isActive = active === slice.key;
                return (
                  <li key={slice.key}>
                    <button
                      type="button"
                      onClick={() =>
                        setActive((cur) =>
                          cur === slice.key ? null : slice.key
                        )
                      }
                      onMouseEnter={() => setActive(slice.key)}
                      className={`group relative w-full text-left rounded-xl px-4 py-3 transition-all ${
                        isActive
                          ? 'bg-white/[0.04] ring-1 ring-secondary/30'
                          : 'hover:bg-white/[0.02] ring-1 ring-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="h-3 w-3 shrink-0 rounded-sm"
                          style={{
                            background: slice.color,
                            boxShadow: `0 0 12px ${slice.color}66`,
                          }}
                        />
                        <span className="flex-1 text-sm md:text-base font-semibold text-white truncate">
                          {t(`slices.${slice.key}.label`)}
                        </span>
                        <span className="font-mono text-base md:text-lg font-bold tabular-nums text-secondary-light">
                          {slice.pct}%
                        </span>
                      </div>
                      <div className="mt-1 ml-6 text-[12px] text-white/65">
                        {t(`slices.${slice.key}.tagline`)}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </div>

        {/* Detail drawer */}
        <AnimatePresence mode="wait">
          {active && (
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="metal-card mt-10 rounded-3xl p-6 md:p-8"
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <span
                  aria-hidden
                  className="h-3 w-3 rounded-sm"
                  style={{
                    background:
                      SLICES.find((s) => s.key === active)?.color ?? '#94B048',
                    boxShadow: `0 0 16px ${
                      SLICES.find((s) => s.key === active)?.color
                    }aa`,
                  }}
                />
                <h3 className="text-xl md:text-2xl font-bold text-white">
                  {t(`slices.${active}.label`)}
                </h3>
                <span className="font-mono text-sm font-bold text-secondary-light">
                  {SLICES.find((s) => s.key === active)?.pct}%
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-8">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                    {t('noteLabel')}
                  </p>
                  <p className="mt-2 text-sm md:text-base text-white/65 leading-relaxed">
                    {t(`slices.${active}.note`)}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                    {t('supplyLabel')}
                  </p>
                  <p className="mt-2 font-mono text-base md:text-lg font-bold tabular-nums text-white">
                    {formatAmount(
                      SLICES.find((s) => s.key === active)?.pct ?? 0
                    )}{' '}
                    <span className="text-secondary-light">$JUICE</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
