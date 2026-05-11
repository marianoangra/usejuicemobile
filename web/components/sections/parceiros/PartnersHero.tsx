'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { Stars } from '@/components/ui/Stars';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

type Slide =
  | { kind: 'partner'; name: string; src: string }
  | { kind: 'cta' };

const SLIDES: readonly Slide[] = [
  { kind: 'partner', name: 'BingX', src: '/partners/bingx.jpg' },
  { kind: 'partner', name: 'OKX', src: '/partners/okx.png' },
  { kind: 'partner', name: 'KAST', src: '/partners/kast.png' },
  { kind: 'partner', name: 'Kaxis Club', src: '/partners/kaxis.png' },
  { kind: 'partner', name: 'Solflare', src: '/partners/solflare.jpg' },
  { kind: 'partner', name: 'Mind Protocol', src: '/partners/mind.jpg' },
  { kind: 'cta' },
] as const;

export function PartnersHero() {
  const t = useTranslations('pages.parceiros.hero');
  const headlineRef = useMetalSpotlight<HTMLSpanElement>();
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSlideIdx((i) => (i + 1) % SLIDES.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[slideIdx];

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      <div aria-hidden className="absolute inset-0 bg-hero-gradient" />
      <div aria-hidden className="absolute inset-0 bg-grid opacity-60" />
      <Stars count={90} seed={47} />
      <div aria-hidden className="absolute inset-0 bg-glow-tr" />
      <div aria-hidden className="absolute inset-0 bg-glow-bl" />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[420px] z-10"
        style={{
          background: `linear-gradient(to bottom,
            rgba(4, 11, 26, 0) 0%,
            rgba(4, 11, 26, 0.05) 18%,
            rgba(4, 11, 26, 0.18) 35%,
            rgba(4, 11, 26, 0.38) 52%,
            rgba(4, 11, 26, 0.62) 68%,
            rgba(4, 11, 26, 0.82) 82%,
            rgba(4, 11, 26, 0.95) 92%,
            rgba(4, 11, 26, 1) 100%
          )`,
        }}
      />

      <div className="relative z-20 mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left: copy */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <SectionBadge variant="primary">{t('badge')}</SectionBadge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="partners-headline mt-6 text-white"
            >
              <span className="block whitespace-normal sm:whitespace-nowrap">
                {t('headlineLine1')}
              </span>
              <span ref={headlineRef} className="metal-text block whitespace-normal sm:whitespace-nowrap">
                {t('headlineLine2')}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="hero-subtitle mt-7 max-w-xl"
            >
              {t('subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-9 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <a
                href="#partner-form"
                className="metal-cta inline-flex items-center justify-center gap-2 rounded-[16px] px-8 py-4 text-base font-bold"
              >
                {t('ctaPrimary')}
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#partner-offerings"
                className="metal-outline inline-flex items-center justify-center gap-2 rounded-[16px] px-8 py-4 text-base font-bold"
              >
                {t('ctaSecondary')}
                <ArrowDown className="h-4 w-4" />
              </a>
            </motion.div>
          </div>

          {/* Right: outdoor / billboard */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-8 bg-glow-tr opacity-50 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-8 bg-glow-bl opacity-30 blur-3xl"
              />

              {/* Top mast */}
              <div className="relative mx-auto mb-2 flex justify-center">
                <div className="h-1 w-28 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>

              {/* Billboard frame */}
              <div className="relative aspect-[16/10] rounded-2xl border border-white/10 bg-[#0a1424] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/[0.04] overflow-hidden">
                {/* Inner bezel */}
                <div className="absolute inset-1.5 rounded-xl overflow-hidden bg-black">
                  <AnimatePresence mode="wait">
                    {slide.kind === 'partner' ? (
                      <motion.div
                        key={slide.name}
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={slide.src}
                          alt={slide.name}
                          fill
                          sizes="(max-width: 768px) 90vw, 28rem"
                          className="object-cover"
                          priority={slideIdx === 0}
                        />
                        <div
                          aria-hidden
                          className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20"
                        />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                          <span className="rounded-md bg-black/70 backdrop-blur-sm px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-white/80 border border-white/10">
                            {t('billboard.currentLabel')}
                          </span>
                          <span className="rounded-md bg-black/70 backdrop-blur-sm px-2 py-1 text-xs font-bold text-white border border-white/10">
                            {slide.name}
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="cta"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 flex flex-col items-center justify-center px-6"
                      >
                        <div
                          aria-hidden
                          className="absolute inset-0 bg-gradient-to-br from-primary/[0.12] via-transparent to-secondary/[0.10]"
                        />
                        <div
                          aria-hidden
                          className="absolute inset-0 bg-grid opacity-30"
                        />
                        <span className="relative text-[10px] font-mono uppercase tracking-[0.4em] text-white/50">
                          {t('billboard.availableLabel')}
                        </span>
                        <span className="metal-text relative mt-3 text-3xl md:text-4xl font-black leading-tight tracking-tight text-center">
                          {t('billboard.yourBrandHere')}
                        </span>
                        <span className="relative mt-3 text-xs text-white/65">
                          {t('billboard.availableSub')}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Live indicator */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/80 backdrop-blur-sm px-2 py-1 border border-white/10">
                    <span className="relative flex h-1.5 w-1.5">
                      <span
                        aria-hidden
                        className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"
                      />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-white/85">
                      {t('billboard.liveLabel')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Support legs */}
              <div className="relative mx-auto mt-1 flex w-3/5 justify-between">
                <div className="h-10 w-1 bg-gradient-to-b from-white/15 to-transparent" />
                <div className="h-10 w-1 bg-gradient-to-b from-white/15 to-transparent" />
              </div>

              {/* Progress dots */}
              <div className="relative mt-3 flex justify-center gap-1.5">
                {SLIDES.map((_, i) => (
                  <span
                    key={i}
                    aria-hidden
                    className={`h-1 rounded-full transition-all duration-500 ${
                      i === slideIdx ? 'w-6 bg-primary' : 'w-1 bg-white/20'
                    }`}
                  />
                ))}
              </div>

              {/* Stats strip */}
              <div className="relative mt-5 grid grid-cols-3 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
                <div className="px-2 py-3 text-center">
                  <div className="text-base md:text-lg font-bold text-white tabular-nums">10K</div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-wider text-white/50">
                    {t('billboard.statDownloads')}
                  </div>
                </div>
                <div className="border-x border-white/[0.06] px-2 py-3 text-center">
                  <div className="text-base md:text-lg font-bold text-white tabular-nums">4K</div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-wider text-white/50">
                    {t('billboard.statDau')}
                  </div>
                </div>
                <div className="px-2 py-3 text-center">
                  <div className="text-base md:text-lg font-bold text-white tabular-nums">23</div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-wider text-white/50">
                    {t('billboard.statTime')}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
