'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
} from 'framer-motion';
import { Zap, Shield, Trophy, Coins, Users, Cpu, type LucideIcon } from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

const ITEMS: Array<{ key: string; icon: LucideIcon }> = [
  { key: 'charging', icon: Zap },
  { key: 'proof', icon: Shield },
  { key: 'ranking', icon: Trophy },
  { key: 'token', icon: Coins },
  { key: 'referral', icon: Users },
  { key: 'depin', icon: Cpu },
];

function FeatureCard({
  itemKey,
  icon: Icon,
  index,
  t,
}: {
  itemKey: string;
  icon: LucideIcon;
  index: number;
  t: (key: string) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const xSpring = useSpring(mouseX, { stiffness: 180, damping: 22, mass: 0.4 });
  const ySpring = useSpring(mouseY, { stiffness: 180, damping: 22, mass: 0.4 });

  const rotateX = useTransform(ySpring, [-0.5, 0.5], ['7deg', '-7deg']);
  const rotateY = useTransform(xSpring, [-0.5, 0.5], ['-7deg', '7deg']);

  const spotX = useTransform(xSpring, [-0.5, 0.5], ['0%', '100%']);
  const spotY = useTransform(ySpring, [-0.5, 0.5], ['0%', '100%']);
  const spotlight = useMotionTemplate`radial-gradient(380px circle at ${spotX} ${spotY}, rgba(201,178,122,0.10), transparent 45%)`;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.6,
        delay: (index % 3) * 0.08 + Math.floor(index / 3) * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        rotateX: reduceMotion ? 0 : rotateX,
        rotateY: reduceMotion ? 0 : rotateY,
        transformStyle: 'preserve-3d',
      }}
      className="metal-card group relative rounded-3xl p-7"
    >
      {/* Cursor spotlight — follows the mouse */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: spotlight }}
      />

      {/* Icon — lifted forward in 3D */}
      <div
        className="metal-step-icon inline-flex h-12 w-12 items-center justify-center rounded-2xl text-primary-light mb-5"
        style={{ transform: 'translateZ(30px)' }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3
        className="text-lg font-semibold tracking-tight text-white"
        style={{ transform: 'translateZ(14px)' }}
      >
        {t(`items.${itemKey}.title`)}
      </h3>
      <p
        className="mt-2.5 text-sm leading-relaxed text-white/55"
        style={{ transform: 'translateZ(6px)' }}
      >
        {t(`items.${itemKey}.description`)}
      </p>

      {/* Decorative corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </motion.div>
  );
}

export function Features() {
  const t = useTranslations('features');
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();

  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <div className="max-w-2xl">
          <SectionBadge>{t('badge')}</SectionBadge>
          <h2 ref={titleRef} className="section-title mt-5 metal-text">{t('title')}</h2>
          <p className="mt-5 max-w-xl text-base md:text-lg text-white/55 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div
          className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          style={{ perspective: '1200px' }}
        >
          {ITEMS.map((item, i) => (
            <FeatureCard
              key={item.key}
              itemKey={item.key}
              icon={item.icon}
              index={i}
              t={t}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
