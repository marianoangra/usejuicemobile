'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Calculator, ArrowRight, AlertTriangle } from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

const RATIO = 1000; // 1000 points = 1 $JUICE
const MIN_WITHDRAW = 100; // 100 $JUICE

const ptBR = new Intl.NumberFormat('pt-BR');

export function PointsConverter() {
  const t = useTranslations('tokenomics.converter');
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();
  const [points, setPoints] = useState<string>('100000');

  const numericPoints = useMemo(() => {
    const cleaned = points.replace(/\D/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
  }, [points]);

  const juice = numericPoints / RATIO;
  const belowMin = juice < MIN_WITHDRAW;
  const pointsForMin = MIN_WITHDRAW * RATIO;
  const pointsRemaining = Math.max(0, pointsForMin - numericPoints);

  function onPointsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 12);
    setPoints(cleaned);
  }

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

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Rules card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="metal-card rounded-3xl p-6 md:p-8 lg:col-span-5"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/60">
              1 : {RATIO}
            </p>
            <p className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-white">
              {t('ratio')}
            </p>
            <p className="mt-6 text-sm md:text-base text-white/55 leading-relaxed">
              {t('minWithdraw')}
            </p>
          </motion.div>

          {/* Calculator card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="metal-card rounded-3xl p-6 md:p-8 lg:col-span-7"
          >
            <div className="flex items-center gap-3">
              <div className="metal-step-icon inline-flex h-10 w-10 items-center justify-center rounded-xl">
                <Calculator className="h-4 w-4 text-secondary-light" />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                {t('calculatorTitle')}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 sm:gap-5 items-end">
              {/* Input */}
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                  {t('inputLabel')}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={points ? ptBR.format(numericPoints) : ''}
                  onChange={onPointsChange}
                  placeholder="100.000"
                  aria-label={t('inputLabel')}
                  className="mt-2 w-full bg-transparent border-b border-white/15 focus:border-secondary/60 outline-none transition-colors py-2 text-2xl md:text-3xl font-bold tabular-nums text-white placeholder:text-white/20"
                />
              </label>

              {/* Arrow */}
              <div className="hidden sm:flex items-center justify-center pb-3 text-white/55">
                <ArrowRight className="h-5 w-5" />
              </div>

              {/* Output */}
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                  {t('outputLabel')}
                </span>
                <div className="mt-2 py-2 border-b border-transparent">
                  <span className="text-2xl md:text-3xl font-bold tabular-nums metal-text">
                    {ptBR.format(juice)}
                  </span>
                  <span className="ml-2 text-sm md:text-base font-semibold text-secondary-light">
                    {t('outputUnit')}
                  </span>
                </div>
              </div>
            </div>

            {belowMin && numericPoints > 0 && (
              <div className="mt-5 inline-flex items-start gap-2 rounded-xl border border-secondary/25 bg-secondary/[0.06] px-3 py-2 text-xs md:text-sm text-secondary-light">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {t('minWarning')} —{' '}
                  <span className="font-mono font-bold tabular-nums">
                    {ptBR.format(pointsRemaining)}
                  </span>{' '}
                  {t('minWarningSuffix')}
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
