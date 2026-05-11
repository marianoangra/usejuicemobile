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
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

type Partner = {
  key: 'bingx' | 'okx' | 'kast' | 'kaxis' | 'solflare' | 'mind';
  url: string;
  banner: string;
};

// Default URLs are real affiliate links — env vars can override per-deploy.
const PARTNERS: Partner[] = [
  {
    key: 'bingx',
    url:
      process.env.NEXT_PUBLIC_BINGX_URL ??
      'https://bingxdao.com/partner/rafaelmariano/',
    banner: '/partners/bingx.jpg',
  },
  {
    key: 'okx',
    url:
      process.env.NEXT_PUBLIC_OKX_URL ??
      'https://okx.com/join/RAFAELMARIANO',
    banner: '/partners/okx.png',
  },
  {
    key: 'kast',
    url:
      process.env.NEXT_PUBLIC_KAST_URL ??
      'https://join.kast.xyz/click?offer_id=6&pub_id=96',
    banner: '/partners/kast.png',
  },
  {
    key: 'kaxis',
    url: 'https://kaxis.club/',
    banner: '/partners/kaxis.png',
  },
  {
    key: 'solflare',
    url: 'https://www.solflare.com/',
    banner: '/partners/solflare.jpg',
  },
  {
    key: 'mind',
    url: 'https://www.mindprotocol.xyz/',
    banner: '/partners/mind.jpg',
  },
];

function PartnerCard({
  partner,
  index,
}: {
  partner: Partner;
  index: number;
}) {
  const t = useTranslations('pages.parceiros.cases');
  const ref = useRef<HTMLAnchorElement>(null);

  // Mouse position relative to the card's center, in [-0.5, 0.5].
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  // Map mouse position to tilt angles. py drives rotateX (vertical mouse
  // tilts the card up/down), px drives rotateY (horizontal mouse tilts
  // the card left/right). Spring smooths both for natural follow-through.
  const rotX = useSpring(useTransform(py, [-0.5, 0.5], [9, -9]), {
    stiffness: 220,
    damping: 22,
    mass: 0.5,
  });
  const rotY = useSpring(useTransform(px, [-0.5, 0.5], [-9, 9]), {
    stiffness: 220,
    damping: 22,
    mass: 0.5,
  });

  // Banner pops slightly forward in z-space for added depth on tilt.
  const bannerZ = useSpring(useTransform(px, [-0.5, 0.5], [0, 0]), {
    stiffness: 220,
    damping: 22,
  });

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
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

  const hasLink = partner.url !== '#';

  return (
    <motion.a
      ref={ref}
      href={hasLink ? partner.url : undefined}
      target={hasLink ? '_blank' : undefined}
      rel={hasLink ? 'noopener noreferrer' : undefined}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.7,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        rotateX: rotX,
        rotateY: rotY,
        transformPerspective: 1200,
        transformStyle: 'preserve-3d',
      }}
      className="metal-card group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl will-change-transform"
    >
      {/* Banner */}
      <motion.div
        className="relative aspect-[16/9] w-full overflow-hidden bg-bg-deep"
        style={{ z: bannerZ, transformStyle: 'preserve-3d' }}
      >
        <Image
          src={partner.banner}
          alt={t(`items.${partner.key}.name`)}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          priority={index === 0}
        />
        {/* Subtle gradient at the bottom for legibility transition */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-black/40"
        />
      </motion.div>

      {/* Body */}
      <div className="relative flex flex-1 flex-col p-6 md:p-7">
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-secondary/30 bg-secondary/[0.08] px-3 py-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-secondary-light" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-secondary-light">
            {t(`items.${partner.key}.role`)}
          </span>
        </div>

        <p className="mt-4 flex-1 text-sm leading-relaxed text-white/65">
          {t(`items.${partner.key}.description`)}
        </p>

        {hasLink && (
          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-secondary-light transition-colors group-hover:text-secondary-light/80">
            {t(`items.${partner.key}.cta`)}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
        )}
      </div>
    </motion.a>
  );
}

export function PartnersCases() {
  const t = useTranslations('pages.parceiros.cases');
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();

  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="max-w-2xl">
          <SectionBadge>{t('badge')}</SectionBadge>
          <h2 ref={titleRef} className="section-title mt-5 metal-text">
            {t('title')}
          </h2>
          <p className="mt-5 max-w-xl text-base md:text-lg text-white/55 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div
          id="partner-cases"
          className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3"
          style={{ perspective: '1200px' }}
        >
          {PARTNERS.map((p, i) => (
            <PartnerCard key={p.key} partner={p} index={i} />
          ))}
        </div>

        <p className="mt-8 max-w-3xl text-xs italic text-white/35 leading-relaxed">
          {t('affiliateDisclosure')}
        </p>
      </div>
    </section>
  );
}
