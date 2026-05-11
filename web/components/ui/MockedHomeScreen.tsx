'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
} from 'framer-motion';
import {
  Zap,
  Bell,
  ArrowUpRight,
  Lock,
  Wallet,
  Activity,
  ShoppingCart,
  Database,
} from 'lucide-react';

const LIME = '#a8db3a';
const POINTS_START = 120_700;
const POINTS_END = 120_860;
const LOOP_SECONDS = 7;

export function MockedHomeScreen() {
  const reduce = useReducedMotion();
  const points = useMotionValue(POINTS_START);

  useEffect(() => {
    if (reduce) {
      points.set(POINTS_END);
      return;
    }
    const c = animate(points, POINTS_END, {
      duration: LOOP_SECONDS,
      ease: 'easeOut',
      repeat: Infinity,
      repeatType: 'loop',
    });
    return () => c.stop();
  }, [points, reduce]);

  const pointsText = useTransform(points, (v) =>
    Math.floor(v).toLocaleString('pt-BR')
  );

  return (
    <div className="absolute inset-0 overflow-hidden text-white flex flex-col">
      {/* === Live top section (animated) === */}
      <div className="relative bg-[#070b08]">
        {/* Top edge ambient glow */}
        <div
          aria-hidden
          className="absolute -top-16 left-1/2 -translate-x-1/2 h-32 w-56 rounded-full opacity-50 blur-3xl pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${LIME}33, transparent 70%)`,
          }}
        />

        {/* Status bar */}
        <div className="relative flex items-center justify-between px-4 pt-2.5 pb-1">
          <div className="flex items-center gap-1 text-[10px] font-semibold tracking-tight">
            <span>3:11</span>
            <span className="text-white/85 ml-0.5">G</span>
            <SignalBars />
          </div>
          <div className="flex items-center gap-1.5">
            <SmallDot />
            <SmallDot />
            <Wifi />
            <BatteryCharging reduce={!!reduce} />
          </div>
        </div>

        {/* Header — greeting + bell */}
        <div className="relative flex items-center justify-between px-4 pt-2.5 pb-3">
          <div className="flex items-center gap-2.5">
            <motion.div
              className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0"
              animate={
                reduce
                  ? undefined
                  : {
                      boxShadow: [
                        '0 2px 8px rgba(168, 219, 58, 0.20)',
                        '0 2px 16px rgba(168, 219, 58, 0.55)',
                        '0 2px 8px rgba(168, 219, 58, 0.20)',
                      ],
                    }
              }
              transition={{ duration: 2.6, ease: 'easeInOut', repeat: Infinity }}
            >
              <Image
                src="/images/logo.png"
                alt="CNB"
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            </motion.div>
            <div className="leading-tight">
              <div className="text-[12.5px] font-semibold">Boa tarde, Maria!</div>
              <div className="text-[9.5px] text-white/55 mt-0.5">
                Cada kWh conta. Vamos carregar?
              </div>
            </div>
          </div>
          <button className="h-8 w-8 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center">
            <Bell className="h-3.5 w-3.5 text-white/70" strokeWidth={1.8} />
          </button>
        </div>

        {/* Points card */}
        <div className="mx-3.5 rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#0e1a10] to-[#0a130c] p-3.5 relative overflow-hidden">
          <motion.div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${LIME}aa, transparent)`,
            }}
            animate={
              reduce ? undefined : { x: ['-100%', '100%'], opacity: [0, 0.8, 0] }
            }
            transition={{
              duration: 2.4,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 1.2,
            }}
          />

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/50 tracking-wide">Seus pontos</span>
            <motion.span
              className="flex items-center gap-1 px-2 py-[3px] rounded-full"
              style={{
                border: `1px solid ${LIME}55`,
                background: `${LIME}10`,
              }}
              animate={reduce ? undefined : { opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
            >
              <span className="text-[8.5px]" style={{ color: LIME }}>✦</span>
              <span className="text-[9px] font-medium" style={{ color: LIME }}>
                Ativo
              </span>
            </motion.span>
          </div>

          <div className="mt-1.5 flex items-baseline gap-1.5">
            <motion.span
              className="font-extrabold leading-none tracking-tight tabular-nums"
              style={{ color: LIME, fontSize: 33 }}
            >
              {pointsText}
            </motion.span>
            <span className="text-[13px] font-bold" style={{ color: `${LIME}cc` }}>
              pts
            </span>
          </div>

          <div className="mt-3 h-[5px] rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, #7fb028, ${LIME})`,
              }}
              initial={{ width: '92%' }}
              animate={
                reduce
                  ? { width: '100%' }
                  : { width: ['92%', '100%', '100%', '92%'] }
              }
              transition={{
                duration: LOOP_SECONDS,
                ease: 'easeOut',
                repeat: Infinity,
                times: [0, 0.85, 0.95, 1],
              }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[9px]">
            <span className="text-white/65">
              Meta atingida — disponível para saque
            </span>
            <span className="font-semibold" style={{ color: LIME }}>
              100%
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div
              className="rounded-xl flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold"
              style={{
                background: `linear-gradient(135deg, ${LIME}, #93c530)`,
                color: '#0a1502',
              }}
            >
              <ArrowUpRight className="h-3 w-3" strokeWidth={3} />
              <span>Saque</span>
            </div>
            <div className="rounded-xl border border-white/[0.10] bg-white/[0.03] flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium text-white/85">
              <Lock className="h-3 w-3" strokeWidth={2} />
              <span>CNB Privado</span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mx-3.5 mt-2.5 grid grid-cols-4 gap-2">
          {[
            { Icon: Wallet, label: 'Wallet' },
            { Icon: Activity, label: 'DePIN' },
            { Icon: ShoppingCart, label: 'Comprar' },
            { Icon: Database, label: 'Dados' },
          ].map(({ Icon, label }) => (
            <div
              key={label}
              className="rounded-xl border border-white/[0.07] bg-white/[0.025] py-2 flex flex-col items-center gap-1"
            >
              <Icon className="h-[15px] w-[15px] text-white/75" strokeWidth={1.7} />
              <span className="text-[9px] text-white/65 font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* Soft fade into the static PNG below */}
        <div
          aria-hidden
          className="h-3 bg-gradient-to-b from-[#070b08] to-transparent"
        />
      </div>

      {/* === Static PNG bottom section (PARCEIROS / banner / activities / tab bar) === */}
      <div className="flex-1 relative overflow-hidden bg-[#070b08]">
        <Image
          src="/images/screen-home.png"
          alt=""
          width={320}
          height={692}
          priority
          aria-hidden
          className="absolute bottom-0 left-0 w-full h-auto"
        />

        {/* Soft halo over the ⚡ Carregar tab button */}
        {!reduce && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              bottom: 30,
              width: 78,
              height: 78,
              background: `radial-gradient(circle, ${LIME}55 0%, ${LIME}1f 38%, transparent 68%)`,
            }}
            animate={{
              scale: [0.92, 1.12, 0.92],
              opacity: [0.5, 0.85, 0.5],
            }}
            transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Status bar atoms ───────────────────────────────────────────────────────

function SignalBars() {
  return (
    <svg width="13" height="9" viewBox="0 0 13 9" fill="currentColor" aria-hidden>
      <rect x="0" y="6" width="2.4" height="3" rx="0.5" />
      <rect x="3.2" y="4" width="2.4" height="5" rx="0.5" />
      <rect x="6.4" y="2" width="2.4" height="7" rx="0.5" />
      <rect x="9.6" y="0" width="2.4" height="9" rx="0.5" />
    </svg>
  );
}

function SmallDot() {
  return <span className="h-[3px] w-[3px] rounded-full bg-white/85" aria-hidden />;
}

function Wifi() {
  return (
    <svg width="11" height="8" viewBox="0 0 11 8" fill="currentColor" aria-hidden>
      <path d="M5.5 8a1 1 0 100-2 1 1 0 000 2zM2.4 4.6l1 1a3 3 0 014.2 0l1-1a4.5 4.5 0 00-6.2 0zM0.5 2.7l1 1a5.7 5.7 0 018 0l1-1a7.2 7.2 0 00-10 0z" />
    </svg>
  );
}

function BatteryCharging({ reduce }: { reduce: boolean }) {
  return (
    <div className="flex items-center gap-[1px]">
      <div className="relative w-[22px] h-[10px] border border-white/85 rounded-[3px] overflow-hidden">
        <motion.div
          className="absolute inset-y-[1px] left-[1px] rounded-[1.5px]"
          style={{ background: LIME }}
          initial={{ width: '60%' }}
          animate={
            reduce ? { width: '90%' } : { width: ['45%', '95%', '45%'] }
          }
          transition={{ duration: 4.5, ease: 'easeInOut', repeat: Infinity }}
        />
        <Zap
          className="absolute inset-0 m-auto h-[8px] w-[8px] text-[#070b08] z-10"
          fill="#070b08"
          strokeWidth={3}
        />
      </div>
      <div className="w-[1.5px] h-[5px] bg-white/85 rounded-r-[1px]" />
    </div>
  );
}
