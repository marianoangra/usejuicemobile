'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  BellOff,
  Home,
  Target,
  Trophy,
  User,
  Zap,
} from 'lucide-react';

const LIME = '#a8db3a';

/**
 * Renders the "carregamento" (charging) screen used in the first
 * "Como funciona" step. Mirrors the JSX-driven pattern of MockedHomeScreen
 * — a fully built UI in JSX so we can layer real motion on top of the
 * concentric arcs, the percentage, and the reward state.
 *
 * All idle motion respects `prefers-reduced-motion`.
 */
export function MockedChargingScreen() {
  const reduce = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#050805] flex flex-col text-white">
      {/* Status bar */}
      <div className="relative z-20 flex items-center justify-between px-4 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold">
          <span>1:55</span>
          <BellOff className="h-2.5 w-2.5 text-white/60" strokeWidth={2.2} />
        </div>
        <div className="flex items-center gap-1.5">
          <SignalBars />
          <Wifi />
          <BatteryAt85 />
        </div>
      </div>

      {/* Top: charging visualization */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center px-2">
        {/* Star field — quiet, decorative */}
        <StarField reduce={!!reduce} />

        {/* Outer ambient glow */}
        <motion.div
          aria-hidden
          className="absolute"
          style={{
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${LIME}22 0%, ${LIME}0a 45%, transparent 70%)`,
          }}
          animate={reduce ? undefined : { opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 3.4, ease: 'easeInOut', repeat: Infinity }}
        />

        {/* Concentric arcs — three SVGs spinning at different rates */}
        <div className="relative" style={{ width: 230, height: 230 }}>
          {/* Outer arc */}
          <motion.svg
            className="absolute inset-0"
            viewBox="-100 -100 200 200"
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
          >
            <circle
              r="92"
              fill="none"
              stroke={`${LIME}30`}
              strokeWidth="1.5"
              strokeDasharray="180 100"
              strokeLinecap="round"
              transform="rotate(-90)"
            />
          </motion.svg>

          {/* Middle arc — counter-rotating, brighter */}
          <motion.svg
            className="absolute inset-0"
            viewBox="-100 -100 200 200"
            animate={reduce ? undefined : { rotate: -360 }}
            transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
          >
            <defs>
              <linearGradient
                id="mid-arc-grad"
                x1="-92"
                y1="0"
                x2="92"
                y2="0"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor={LIME} stopOpacity="0.9" />
                <stop offset="50%" stopColor={LIME} stopOpacity="0.45" />
                <stop offset="100%" stopColor={LIME} stopOpacity="0.95" />
              </linearGradient>
            </defs>
            <circle
              r="80"
              fill="none"
              stroke="url(#mid-arc-grad)"
              strokeWidth="2.5"
              strokeDasharray="170 80 60"
              strokeLinecap="round"
              transform="rotate(-90)"
            />
          </motion.svg>

          {/* Inner ring with orbiting dots */}
          <motion.svg
            className="absolute inset-0"
            viewBox="-100 -100 200 200"
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
          >
            <circle
              r="68"
              fill="none"
              stroke={`${LIME}28`}
              strokeWidth="1"
            />
            {/* Ornament dots — uneven orbit */}
            <circle cx="68" cy="0" r="2.5" fill="white" />
            <circle cx="-68" cy="0" r="2" fill="white" opacity="0.55" />
            <circle cx="0" cy="-68" r="1.6" fill="white" opacity="0.4" />
            <circle cx="0" cy="68" r="2.4" fill={LIME} />
          </motion.svg>

          {/* Center "85%" with subtle breathing pulse */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={reduce ? undefined : { scale: [1, 1.025, 1] }}
            transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
          >
            <div className="flex items-baseline">
              <span className="text-[68px] font-bold leading-none tracking-tighter">
                85
              </span>
              <span className="text-[26px] font-semibold ml-0.5 text-white/85">
                %
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reward card */}
      <div className="mx-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 flex items-center justify-between">
        <div className="leading-tight">
          <div className="text-[10.5px] text-white/55">Recompensa acumulada</div>
          <div
            className="mt-1 text-[26px] font-extrabold tracking-tight"
            style={{ color: LIME }}
          >
            +10
          </div>
          <div className="text-[10px] text-white/65 mt-0.5">
            pontos · on-chain
          </div>
        </div>
        <ChartBars reduce={!!reduce} />
      </div>

      {/* Hour progress */}
      <div className="mx-3 mt-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-white/65">Progresso da hora</span>
          <span className="font-semibold" style={{ color: LIME }}>
            58:42 restante
          </span>
        </div>
        <div className="mt-1.5 h-[3px] rounded-full bg-white/[0.08] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: LIME }}
            initial={{ width: '2%' }}
            animate={reduce ? undefined : { width: ['2%', '4.5%', '2%'] }}
            transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[9.5px] text-white/60">
          <span>+50 pts bônus ao completar 1h</span>
          <span>2%</span>
        </div>
      </div>

      {/* CTAs */}
      <div className="mx-3 mt-3 space-y-2">
        <div
          className="w-full rounded-2xl flex items-center justify-center gap-2 py-3 text-[13px] font-bold"
          style={{ background: LIME, color: '#0a1502' }}
        >
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={3} />
          Saque disponível
        </div>
        <div
          className="w-full rounded-2xl flex items-center justify-center gap-2 py-2.5 text-[12px] font-semibold border"
          style={{
            borderColor: `${LIME}55`,
            color: LIME,
            background: `${LIME}08`,
          }}
        >
          <motion.span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: LIME }}
            animate={reduce ? undefined : { opacity: [1, 0.45, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          Sessão ativa · +10 pts
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-2 text-center text-[9.5px] text-white/35">
        Saque disponível a partir de 100.000 pontos
      </div>

      {/* Tab bar */}
      <div className="mt-auto pt-3 pb-3 px-3 flex items-end justify-around relative">
        <TabIcon Icon={Home} label="Início" />
        <TabIcon Icon={Target} label="Missões" />
        <CenterTab reduce={!!reduce} />
        <TabIcon Icon={Trophy} label="Ranking" />
        <TabIcon Icon={User} label="Perfil" />
      </div>
    </div>
  );
}

// ─── Status bar atoms ──────────────────────────────────────────────────────

function SignalBars() {
  return (
    <svg
      width="13"
      height="9"
      viewBox="0 0 13 9"
      fill="currentColor"
      aria-hidden
    >
      <rect x="0" y="6" width="2.4" height="3" rx="0.5" />
      <rect x="3.2" y="4" width="2.4" height="5" rx="0.5" />
      <rect x="6.4" y="2" width="2.4" height="7" rx="0.5" />
      <rect x="9.6" y="0" width="2.4" height="9" rx="0.5" />
    </svg>
  );
}

function Wifi() {
  return (
    <svg
      width="11"
      height="8"
      viewBox="0 0 11 8"
      fill="currentColor"
      aria-hidden
    >
      <path d="M5.5 8a1 1 0 100-2 1 1 0 000 2zM2.4 4.6l1 1a3 3 0 014.2 0l1-1a4.5 4.5 0 00-6.2 0zM0.5 2.7l1 1a5.7 5.7 0 018 0l1-1a7.2 7.2 0 00-10 0z" />
    </svg>
  );
}

function BatteryAt85() {
  return (
    <div className="flex items-center gap-[1px]">
      <div className="relative w-[24px] h-[11px] rounded-[3px] overflow-hidden flex items-center pl-[1.5px]">
        <div className="absolute inset-0 rounded-[3px] border border-white/85" />
        <div
          className="relative h-[7px] rounded-[1.5px] flex items-center justify-center"
          style={{ background: LIME, width: '85%' }}
        >
          <Zap
            className="h-[7px] w-[7px] text-[#0a1502]"
            fill="#0a1502"
            strokeWidth={3}
          />
          <span className="ml-[1px] text-[7.5px] font-bold text-[#0a1502]">
            85
          </span>
        </div>
      </div>
      <div className="w-[1.5px] h-[5px] bg-white/85 rounded-r-[1px]" />
    </div>
  );
}

// ─── Charging visualization atoms ──────────────────────────────────────────

function StarField({ reduce }: { reduce: boolean }) {
  // Hand-placed positions for SSR/CSR parity, no PRNG needed
  const stars = [
    { left: '12%', top: '20%', size: 1, opacity: 0.55, delay: 0 },
    { left: '88%', top: '15%', size: 1.5, opacity: 0.7, delay: 0.6 },
    { left: '20%', top: '60%', size: 1, opacity: 0.4, delay: 1.2 },
    { left: '78%', top: '70%', size: 1.5, opacity: 0.6, delay: 1.8 },
    { left: '30%', top: '40%', size: 1, opacity: 0.45, delay: 2.4 },
    { left: '70%', top: '45%', size: 1, opacity: 0.5, delay: 3 },
    { left: '50%', top: '12%', size: 1, opacity: 0.55, delay: 3.6 },
    { left: '50%', top: '80%', size: 1, opacity: 0.4, delay: 4.2 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none">
      {stars.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: s.left,
            top: s.top,
            width: s.size * 2,
            height: s.size * 2,
            boxShadow: '0 0 4px rgba(255,255,255,0.4)',
          }}
          animate={
            reduce
              ? { opacity: s.opacity }
              : { opacity: [s.opacity * 0.4, s.opacity, s.opacity * 0.4] }
          }
          transition={{
            duration: 4,
            ease: 'easeInOut',
            repeat: Infinity,
            delay: s.delay,
          }}
        />
      ))}
    </div>
  );
}

function ChartBars({ reduce }: { reduce: boolean }) {
  // Four ascending bars suggesting accumulated reward
  const heights = [40, 55, 75, 92];
  return (
    <div className="flex items-end gap-1 h-10">
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="w-[5px] rounded-[2px]"
          style={{ background: LIME, height: `${h}%` }}
          animate={
            reduce
              ? undefined
              : { height: [`${h - 8}%`, `${h}%`, `${h - 8}%`] }
          }
          transition={{
            duration: 2.2,
            ease: 'easeInOut',
            repeat: Infinity,
            delay: i * 0.18,
          }}
        />
      ))}
    </div>
  );
}

// ─── Tab bar atoms ─────────────────────────────────────────────────────────

function TabIcon({
  Icon,
  label,
}: {
  Icon: typeof Home;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-white/55">
      <Icon className="h-4 w-4" strokeWidth={1.8} />
      <span className="text-[8.5px] font-medium">{label}</span>
    </div>
  );
}

function CenterTab({ reduce }: { reduce: boolean }) {
  return (
    <div className="relative -mt-5 flex flex-col items-center">
      {/* Halo */}
      <motion.span
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 56,
          height: 56,
          top: -4,
          background: `radial-gradient(circle, ${LIME}80 0%, ${LIME}30 40%, transparent 70%)`,
        }}
        animate={reduce ? undefined : { scale: [0.92, 1.1, 0.92], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
      />
      <div
        className="relative h-12 w-12 rounded-full flex items-center justify-center"
        style={{
          background: LIME,
          boxShadow: `0 6px 20px ${LIME}66, 0 0 0 4px ${LIME}1a`,
        }}
      >
        <Zap className="h-5 w-5 text-[#0a1502]" fill="#0a1502" strokeWidth={2.5} />
      </div>
    </div>
  );
}
