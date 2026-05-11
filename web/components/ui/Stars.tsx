'use client';

import {
  useMemo,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { motion, useReducedMotion, useMotionValue } from 'framer-motion';

// Mulberry32 - small PRNG with fixed seed for SSR/CSR parity.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface StarsProps {
  count?: number;
  seed?: number;
  className?: string;
  satellites?: boolean;
}

type Tier = 'dim' | 'normal' | 'bright';

const TINTS = {
  white: '#ffffff',
  warm: '#fff1d8',
  cool: '#dce6ff',
} as const;

interface Star {
  id: number;
  top: number;
  left: number;
  size: number;
  tier: Tier;
  color: string;
  baseOpacity: number;
  shouldTwinkle: boolean;
  twinkleAmp: number;
  twinklePeriod: number;
  twinkleDelay: number;
}

function StarField({ stars, reduce }: { stars: Star[]; reduce: boolean }) {
  return (
    <>
      {stars.map((s) => {
        const glow =
          s.tier === 'bright'
            ? `0 0 3px ${s.color}cc, 0 0 7px rgba(200, 220, 255, 0.45)`
            : s.tier === 'normal'
              ? `0 0 2px ${s.color}99`
              : undefined;
        const style: CSSProperties = {
          top: `${s.top}%`,
          left: `${s.left}%`,
          width: `${s.size}px`,
          height: `${s.size}px`,
          background: s.color,
          boxShadow: glow,
        };
        const cls = `absolute rounded-full${s.tier === 'bright' ? ' star-bright' : ''}`;
        if (s.shouldTwinkle && !reduce) {
          return (
            <motion.span
              key={s.id}
              className={cls}
              style={style}
              animate={{
                opacity: [
                  s.baseOpacity,
                  Math.min(1, s.baseOpacity + s.twinkleAmp),
                  Math.max(0.06, s.baseOpacity - s.twinkleAmp * 0.5),
                  s.baseOpacity,
                ],
              }}
              transition={{
                duration: s.twinklePeriod,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: s.twinkleDelay,
              }}
            />
          );
        }
        return (
          <span
            key={s.id}
            className={cls}
            style={{ ...style, opacity: s.baseOpacity }}
          />
        );
      })}
    </>
  );
}

export function Stars({
  count = 100,
  seed = 42,
  className,
  satellites = true,
}: StarsProps) {
  const reduce = useReducedMotion();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const yMV = useMotionValue(0);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || !height) return;

    let position = 0;
    let velocity = 0;
    let raf = 0;

    function onMove() {
      // Each mousemove event boosts upward velocity (capped).
      velocity = Math.max(velocity - 0.045, -0.35);
    }

    function tick() {
      if (velocity !== 0) {
        position += velocity;
        velocity *= 0.985;
        if (Math.abs(velocity) < 0.002) velocity = 0;
        // Wrap position into [-height, 0] so the duplicate field below
        // seamlessly fills the gap. Position is monotonically decreasing
        // but rendered y is always within one cycle.
        let wrapped = position % height;
        if (wrapped > 0) wrapped -= height;
        yMV.set(wrapped);
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduce, height, yMV]);

  const planet = useMemo(() => {
    const rnd = mulberry32(seed + 9001);
    return {
      top: 10 + rnd() * 30, // 10–40% from top
      size: 9 + rnd() * 5, // 9–14px
      duration: 110 + rnd() * 50, // 110–160s — bem suave
      delay: rnd() * 40, // initial offset so different sections aren't synced
    };
  }, [seed]);

  const stars = useMemo<Star[]>(() => {
    const rnd = mulberry32(seed);
    return Array.from({ length: count }).map((_, i) => {
      const top = rnd() * 100;
      const left = rnd() * 100;
      // Bias toward small stars — most are tiny, only a few are bright.
      const sizeBias = Math.pow(rnd(), 2.4);
      const size = 0.7 + sizeBias * 3.0;
      const tier: Tier =
        size > 2.4 ? 'bright' : size > 1.4 ? 'normal' : 'dim';

      const tintRoll = rnd();
      const tintKey: keyof typeof TINTS =
        tintRoll < 0.08 ? 'warm' : tintRoll < 0.15 ? 'cool' : 'white';

      const baseOpacity =
        tier === 'dim'
          ? 0.18 + rnd() * 0.3
          : tier === 'normal'
            ? 0.45 + rnd() * 0.4
            : 0.7 + rnd() * 0.3;

      const twinkleRoll = rnd();
      const shouldTwinkle =
        (tier === 'dim' && twinkleRoll < 0.25) ||
        (tier === 'normal' && twinkleRoll < 0.55) ||
        (tier === 'bright' && twinkleRoll < 0.7);
      const twinkleAmp =
        tier === 'bright' ? 0.35 : tier === 'normal' ? 0.22 : 0.12;
      const twinklePeriod = 1.8 + rnd() * 4;
      const twinkleDelay = rnd() * 5;

      return {
        id: i,
        top,
        left,
        size,
        tier,
        color: TINTS[tintKey],
        baseOpacity,
        shouldTwinkle,
        twinkleAmp,
        twinklePeriod,
        twinkleDelay,
      };
    });
  }, [count, seed]);

  return (
    <div
      ref={wrapperRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`}
    >
      <motion.div
        className="absolute inset-0"
        style={reduce ? undefined : { y: yMV }}
      >
        <div data-stars-field className="absolute inset-0">
          <StarField stars={stars} reduce={!!reduce} />
        </div>
        {/* Duplicate field below the original — wraps seamlessly as the
            wrapper translates upward, so the sky never empties. */}
        <div
          data-stars-field
          className="absolute inset-x-0"
          style={{ top: '100%', height: '100%' }}
        >
          <StarField stars={stars} reduce={!!reduce} />
        </div>
      </motion.div>

      {/* Outside the motion wrapper — satellites and the planet are
          independent of the mouse-driven parallax. */}
      {satellites && !reduce && (
        <>
          <span aria-hidden className="satellite satellite-1" />
          <span aria-hidden className="satellite satellite-2" />

          <motion.span
            aria-hidden
            className="absolute rounded-full"
            style={{
              top: `${planet.top}%`,
              left: '-5%',
              width: `${planet.size}px`,
              height: `${planet.size}px`,
              background:
                'radial-gradient(circle at 30% 28%, rgba(245, 222, 180, 0.95), rgba(180, 140, 80, 0.85) 55%, rgba(60, 40, 20, 0.95))',
              boxShadow:
                '0 0 4px rgba(245, 222, 180, 0.35), inset -1.5px -1.5px 3px rgba(0, 0, 0, 0.5)',
            }}
            initial={{ x: 0, opacity: 0 }}
            animate={{ x: '110vw', opacity: [0, 0.7, 0.7, 0] }}
            transition={{
              duration: planet.duration,
              repeat: Infinity,
              ease: 'linear',
              times: [0, 0.06, 0.94, 1],
              delay: planet.delay,
            }}
          />
        </>
      )}
    </div>
  );
}
