'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { SectionBadge } from '@/components/ui/SectionBadge';

type Partner = {
  key: 'bingx' | 'okx' | 'kast';
  banner: string;
  objectPosition?: string;
};

// Home strip: only the 3 active B2B partners. Kaxis, Solflare and Mind are
// showcase examples and live exclusively on /parceiros.
const PARTNERS: Partner[] = [
  { key: 'bingx', banner: '/partners/bingx.jpg' },
  { key: 'okx', banner: '/partners/okx.png' },
  { key: 'kast', banner: '/partners/kast.png' },
];

function TrustCard({
  partner,
  index,
}: {
  partner: Partner;
  index: number;
}) {
  const tCases = useTranslations('pages.parceiros.cases');
  const ref = useRef<HTMLDivElement>(null);

  const px = useMotionValue(0);
  const py = useMotionValue(0);

  // Smaller tilt than /parceiros — these cards are flatter (16:5).
  const rotX = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), {
    stiffness: 240,
    damping: 22,
    mass: 0.5,
  });
  const rotY = useSpring(useTransform(px, [-0.5, 0.5], [-6, 6]), {
    stiffness: 240,
    damping: 22,
    mass: 0.5,
  });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <Link href="/parceiros#partner-cases" className="group block">
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{
          duration: 0.6,
          delay: index * 0.06,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          rotateX: rotX,
          rotateY: rotY,
          transformPerspective: 1000,
          transformStyle: 'preserve-3d',
        }}
        className="metal-card relative overflow-hidden rounded-2xl will-change-transform"
      >
        {/* Banner strip (16:6 ratio — slightly taller, still flatter
            than the /parceiros cases) */}
        <div className="relative aspect-[16/6] w-full overflow-hidden bg-bg-deep">
          <Image
            src={partner.banner}
            alt={tCases(`items.${partner.key}.name`)}
            fill
            sizes="(min-width: 640px) 33vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            style={{ objectPosition: partner.objectPosition ?? 'center' }}
          />
        </div>

        {/* Footer line */}
        <div className="flex items-center justify-between px-4 py-3 md:px-5 md:py-3.5">
          <div>
            <div className="text-sm font-semibold text-white tracking-tight">
              {tCases(`items.${partner.key}.name`)}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/60 mt-0.5">
              {tCases(`items.${partner.key}.role`)}
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-white/60 group-hover:text-secondary-light group-hover:translate-x-0.5 transition-all" />
        </div>
      </motion.div>
    </Link>
  );
}

export function PartnersTrust() {
  const t = useTranslations('partnersTrust');

  return (
    <section className="relative py-16 md:py-24">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
      />

      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <SectionBadge>{t('badge')}</SectionBadge>
          <h2 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-white">
            {t('title')}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm md:text-base text-white/55 leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        <div
          className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4"
          style={{ perspective: '1000px' }}
        >
          {PARTNERS.map((p, i) => (
            <TrustCard key={p.key} partner={p} index={i} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/parceiros"
            className="inline-flex items-center gap-2 text-sm font-semibold text-secondary-light hover:text-secondary-light/80 transition-colors"
          >
            {t('ctaAll')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
