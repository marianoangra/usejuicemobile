'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
} from 'framer-motion';
import { Copy, Check, ArrowUpRight } from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

// PLACEHOLDER — substituir por endereço real da mint quando disponível.
const MINT_ADDRESS = process.env.NEXT_PUBLIC_CNB_MINT_ADDRESS ?? '';

export function Token() {
  const t = useTranslations('token');
  const [copied, setCopied] = useState(false);
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();

  // 3D tilt for the card on the right
  const cardRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const xSpring = useSpring(mouseX, { stiffness: 180, damping: 22, mass: 0.4 });
  const ySpring = useSpring(mouseY, { stiffness: 180, damping: 22, mass: 0.4 });
  const rotateX = useTransform(ySpring, [-0.5, 0.5], ['5deg', '-5deg']);
  const rotateY = useTransform(xSpring, [-0.5, 0.5], ['-5deg', '5deg']);
  const spotX = useTransform(xSpring, [-0.5, 0.5], ['0%', '100%']);
  const spotY = useTransform(ySpring, [-0.5, 0.5], ['0%', '100%']);
  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${spotX} ${spotY}, rgba(201,178,122,0.10), transparent 50%)`;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  function copy() {
    if (!MINT_ADDRESS) return;
    navigator.clipboard.writeText(MINT_ADDRESS);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section id="token" className="relative py-24 md:py-32">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <SectionBadge>{t('badge')}</SectionBadge>
            <h2 ref={titleRef} className="section-title mt-5 metal-text">{t('title')}</h2>
            <p className="mt-5 text-base md:text-lg text-white/55 leading-relaxed">
              {t('subtitle')}
            </p>
          </div>

          <div className="lg:col-span-7" style={{ perspective: '1400px' }}>
            <motion.div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{
                rotateX: reduceMotion ? 0 : rotateX,
                rotateY: reduceMotion ? 0 : rotateY,
                transformStyle: 'preserve-3d',
              }}
              className="metal-card group relative rounded-3xl p-7 md:p-9"
            >
              {/* Cursor spotlight */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: spotlight }}
              />
              {/* Mint */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                  {t('mintAddress')}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <code className="metal-stat-card flex-1 truncate rounded-xl px-4 py-3 font-mono text-xs md:text-sm text-secondary-light">
                    {MINT_ADDRESS || t('mintPlaceholder')}
                  </code>
                  {MINT_ADDRESS && (
                    <button
                      onClick={copy}
                      aria-label="Copy mint address"
                      className="metal-icon-btn inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    >
                      {copied ? <Check className="h-4 w-4 text-secondary" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Stats */}
              <dl className="mt-7 grid grid-cols-3 gap-3">
                {(['supply', 'holders', 'network'] as const).map((k) => (
                  <div key={k} className="metal-stat-card rounded-2xl p-4">
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                      {t(`stats.${k}`)}
                    </dt>
                    <dd className="mt-1.5 text-base md:text-lg font-semibold text-white truncate">
                      {t(`stats.${k}Value`)}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Links */}
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink
                  href={
                    MINT_ADDRESS
                      ? `https://solscan.io/token/${MINT_ADDRESS}`
                      : 'https://solscan.io'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                  size="sm"
                >
                  {t('links.solscan')}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </ButtonLink>
                <ButtonLink
                  href={
                    MINT_ADDRESS
                      ? `https://jup.ag/swap/SOL-${MINT_ADDRESS}`
                      : 'https://jup.ag'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                  size="sm"
                >
                  {t('links.jupiter')}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </ButtonLink>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
