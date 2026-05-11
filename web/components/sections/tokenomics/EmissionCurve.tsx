'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

const HALVING = [
  { year: 1, amount: 200 },
  { year: 2, amount: 100 },
  { year: 3, amount: 50 },
  { year: 4, amount: 25 },
  { year: 5, amount: 12 },
  { year: 6, amount: 6 },
  { year: 7, amount: 4 },
  { year: 8, amount: 3 },
];

interface TooltipPayload {
  payload: { year: number; amount: number };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  yearLabel: string;
  amountLabel: string;
  amountSuffix: string;
}

function CustomTooltip({
  active,
  payload,
  yearLabel,
  amountLabel,
  amountSuffix,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const { year, amount } = payload[0].payload;
  return (
    <div className="metal-card rounded-xl px-4 py-3 text-sm">
      <div className="font-mono text-[10px] uppercase tracking-wider text-white/60">
        {yearLabel} {year}
      </div>
      <div className="mt-1 font-bold text-white">
        {amount} {amountSuffix}
      </div>
      <div className="mt-0.5 font-mono text-[10px] text-white/60">
        {amountLabel}
      </div>
    </div>
  );
}

export function EmissionCurve() {
  const t = useTranslations('tokenomics.emission');
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
            className="section-title mt-5 metal-text inline-flex items-center gap-3"
          >
            <Flame className="h-7 w-7 md:h-8 md:w-8 text-primary-light shrink-0" />
            {t('title')}
          </h2>
          <p className="mt-5 text-base md:text-lg text-white/55 leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="metal-card mt-10 rounded-3xl p-5 md:p-7"
        >
          <div className="h-[280px] md:h-[360px] -mx-2">
            {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={HALVING}
                margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="emission-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94B048" stopOpacity={0.55} />
                    <stop offset="60%" stopColor="#6B8333" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#6B8333" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="year"
                  stroke="rgba(255,255,255,0.35)"
                  tick={{ fontSize: 11, fontFamily: 'var(--font-jetbrains)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${t('yearLabel')[0]}${v}`}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.35)"
                  tick={{ fontSize: 11, fontFamily: 'var(--font-jetbrains)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}M`}
                  width={42}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(201,178,122,0.35)', strokeWidth: 1 }}
                  content={
                    <CustomTooltip
                      yearLabel={t('yearLabel')}
                      amountLabel={t('amountLabel')}
                      amountSuffix={t('amountSuffix')}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#94B048"
                  strokeWidth={2}
                  fill="url(#emission-grad)"
                  activeDot={{
                    r: 5,
                    fill: '#E8DAB1',
                    stroke: '#08100A',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Como funciona o claim — proportional emission flow (Option A) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 md:mt-20"
        >
          <div className="max-w-2xl">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {t('claim.title')}
            </h3>
            <p className="mt-3 text-sm md:text-base text-white/55 leading-relaxed">
              {t('claim.subtitle')}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['pool', 'earn', 'share', 'redeem'] as const).map((key, i) => (
              <div
                key={key}
                className="metal-card rounded-2xl p-5 md:p-6 flex flex-col gap-3"
              >
                <p className="font-mono text-[10px] uppercase tracking-wider text-secondary-light/70">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <p className="text-base md:text-lg font-bold text-white leading-tight">
                  {t(`claim.steps.${key}.label`)}
                </p>
                <p className="text-sm text-white/55 leading-relaxed">
                  {t(`claim.steps.${key}.body`)}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
