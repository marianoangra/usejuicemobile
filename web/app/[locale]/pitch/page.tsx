import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowDown, Mail, ArrowRight } from 'lucide-react';

/* ----------------------------------------------------------------------
 * JUICE Pitch — 10-slide deck. Design tokens follow the JUICE design
 * system (dark navy bg + neon green primary, violet ONLY on badges).
 * Monospace for numbers, no emojis, WCAG AA contrast.
 * -------------------------------------------------------------------- */

const TOKENS = {
  bg: '#0B1220',
  bgCard: '#0E1626',
  primary: '#22C55E',
  primaryDim: 'rgba(34, 197, 94, 0.16)',
  text: '#E6EDF3',
  textMuted: '#94A3B8',
  textSubtle: '#64748B',
  secondary: '#8B5CF6',
  border: 'rgba(148, 163, 184, 0.10)',
  borderStrong: 'rgba(148, 163, 184, 0.18)',
} as const;

interface KPI {
  value: string;
  label: string;
  note?: string;
}

interface SlideProps {
  num: string;
  badge?: string;
  titulo: string;
  subtitle?: string;
  bullets?: readonly string[];
  kpis?: readonly KPI[];
  footnote?: string;
}

function Slide({
  num,
  badge,
  titulo,
  subtitle,
  bullets,
  kpis,
  footnote,
}: SlideProps) {
  return (
    <section
      className="relative flex min-h-[90vh] items-center px-6 py-20 md:px-12"
      style={{
        background: TOKENS.bg,
        color: TOKENS.text,
        borderTop: `1px solid ${TOKENS.border}`,
      }}
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <span
            className="font-mono text-xs tracking-[0.2em]"
            style={{ color: TOKENS.textSubtle }}
          >
            {num} / 10
          </span>
          {badge && (
            <span
              className="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{
                color: TOKENS.secondary,
                borderColor: `${TOKENS.secondary}55`,
                background: `${TOKENS.secondary}14`,
              }}
            >
              {badge}
            </span>
          )}
        </div>

        <h2 className="text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
          {titulo}
        </h2>

        {subtitle && (
          <p
            className="mt-5 max-w-3xl text-lg leading-relaxed md:text-xl"
            style={{ color: TOKENS.textMuted }}
          >
            {subtitle}
          </p>
        )}

        {kpis && kpis.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {kpis.map((kpi, i) => (
              <div
                key={i}
                className="rounded-2xl border p-5"
                style={{
                  borderColor: TOKENS.border,
                  background: TOKENS.bgCard,
                }}
              >
                <div
                  className="font-mono text-2xl font-bold leading-none md:text-3xl"
                  style={{ color: TOKENS.primary }}
                >
                  {kpi.value}
                </div>
                <div className="mt-3 text-sm leading-snug">{kpi.label}</div>
                {kpi.note && (
                  <div
                    className="mt-1.5 font-mono text-[11px]"
                    style={{ color: TOKENS.textSubtle }}
                  >
                    {kpi.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {bullets && bullets.length > 0 && (
          <ul className="mt-10 space-y-4">
            {bullets.map((b, i) => (
              <li
                key={i}
                className="flex gap-3 text-base leading-relaxed md:text-lg"
              >
                <span
                  className="mt-0.5 shrink-0 font-mono"
                  style={{ color: TOKENS.primary }}
                >
                  ›
                </span>
                <span style={{ color: 'rgba(230, 237, 243, 0.92)' }}>{b}</span>
              </li>
            ))}
          </ul>
        )}

        {footnote && (
          <p
            className="mt-10 font-mono text-xs"
            style={{ color: TOKENS.textSubtle }}
          >
            {footnote}
          </p>
        )}
      </div>
    </section>
  );
}

/* ---------------------------- Slide data ---------------------------- */

const SLIDES: readonly SlideProps[] = [
  {
    num: '02',
    badge: 'Problema',
    titulo: 'Atenção não remunerada. Carregamento é tempo morto.',
    subtitle:
      'O brasileiro carrega o celular 2-3 vezes por dia. Em média, 4 horas por dia o aparelho fica na tomada com tela ligada. Esse tempo é monetizado por anunciantes — mas zero da receita volta pro usuário.',
    bullets: [
      '4h+ por dia carregando, atenção exposta a anúncios sem retorno direto.',
      'Apps de "ganhe dinheiro" entregam centavos depois de horas de fricção.',
      'Anunciantes pagam eCPM cheio, plataforma fica com 100%.',
      'Falta um produto que devolva valor pro usuário durante o tempo de carga.',
    ],
  },
  {
    num: '03',
    badge: 'Solução',
    titulo: 'Carregue. Acumule pontos. Saque via Pix.',
    subtitle:
      'Energia ociosa de carregamento vira atenção monetizável. Detecção nativa via expo-battery, anúncios rewarded não-intrusivos, prêmio em Pix.',
    bullets: [
      '+10 pts por minuto carregando. +50 pts a cada hora cheia completada.',
      '+10 pts por login diário. +100 pts por indicação confirmada.',
      'Saque liberado a partir de 100.000 pts, liquidação Pix em segundos.',
      'Anúncios apenas na tela de carga, sem afetar o uso normal do celular.',
    ],
  },
  {
    num: '04',
    badge: 'Produto',
    titulo: 'Quatro telas. iOS + Android. Em produção.',
    subtitle:
      'App nativo nas duas lojas, com onboarding em menos de 60 segundos.',
    kpis: [
      { value: '10K', label: 'Downloads', note: 'App Store + Google Play' },
      { value: '4K', label: 'DAU', note: 'Sessões medidas/dia' },
      { value: '23 min', label: 'Tempo médio', note: 'Engajamento diário' },
      { value: '500/dia', label: 'Novas contas', note: 'Aquisição orgânica' },
    ],
    bullets: [
      'Telas: Início, Carregar, Ranking, Perfil. UX otimizada pra retenção.',
      'Stack: React Native 0.81 + Expo SDK 54 + Firebase JS SDK 10 + AdMob.',
      'Pix-out integrado via PSP regulado, liquidação típica abaixo de 3s.',
    ],
  },
  {
    num: '05',
    badge: 'Mercado',
    titulo: 'Mercado endereçável: 200M smartphones no Brasil.',
    kpis: [
      { value: '200M', label: 'TAM', note: 'Smartphones BR · Anatel 2025' },
      { value: '80M', label: 'SAM', note: 'Android 18-44 · target' },
      { value: '2M', label: 'SOM 12m', note: '2,5% do SAM' },
      { value: 'R$ 6,2bi', label: 'Ad-spend mobile BR', note: 'IDC 2025' },
    ],
    footnote: 'Fontes: Anatel, IDC LATAM, Statista, Comscore Brasil 2025.',
  },
  {
    num: '06',
    badge: 'Vantagem Injusta',
    titulo: 'Detecção nativa, loop viral, Pix.',
    bullets: [
      'Detecção de carregamento via expo-battery — sem hardware extra.',
      'K-factor projetado > 1 via incentivo de +100 pts por indicação.',
      'Gamificação: ranking semanal, sequências, missões patrocinadas.',
      'Único app no Brasil com Pix nativo dentro de economia de atenção.',
    ],
  },
  {
    num: '07',
    badge: 'Modelo de Receita',
    titulo: 'Ad-revenue dividida com o usuário. Take rate da plataforma.',
    kpis: [
      { value: 'R$ 5-12', label: 'eCPM rewarded', note: 'AdMob BR · 2026' },
      { value: '30%', label: 'Take rate', note: '70% retorna ao usuário' },
      { value: 'B2B', label: 'Sponsored Quests', note: 'Missões patrocinadas' },
      { value: '< 3s', label: 'Pix-out', note: 'Liquidação via PSP' },
    ],
    footnote:
      'Take rate ajustável conforme escala de eCPM e custo unitário de Pix-out.',
  },
  {
    num: '08',
    badge: 'GTM',
    titulo: 'Aquisição barata, indicação forte.',
    bullets: [
      'Install Referrer Android: rastreio nativo de indicação, atribuição 100%.',
      'K-factor alvo: 1,3+ via mecânica de +100 pts por indicação confirmada.',
      'CAC blended alvo: < R$ 2,00 (mix paid Android UAC + orgânico TikTok).',
      'Canais: TikTok orgânico, micro-influencers BR, UAC Android segmentado.',
    ],
    footnote:
      'CAC blended esperado · 60% do funil orgânico após M+3 de operação.',
  },
  {
    num: '09',
    badge: 'Tração & Métricas',
    titulo: 'Crescendo orgânico, sem mídia paga.',
    kpis: [
      { value: '10K', label: 'Downloads', note: 'iOS + Android' },
      { value: '4K', label: 'DAU', note: 'DAU/MAU 0,45' },
      { value: '23 min', label: 'Tempo médio/dia', note: 'Sessões logadas' },
      { value: '500/dia', label: 'Novas contas', note: 'Orgânico' },
    ],
    bullets: [
      'Retenção D1 ~38% · D7 ~18% · D30 ~9% (em ramp, sem CRM ativo ainda).',
      'ARPDAU em ramp conforme densidade de impressões e Sponsored Quests.',
      'Payback de CAC projetado em 3-4 meses no cenário de ramp.',
    ],
    footnote:
      'Métricas de Apr/2026 · curvas de retenção e cohort detalhadas sob NDA.',
  },
  {
    num: '10',
    badge: 'Equipe & CTA',
    titulo: 'Founders. Rodada. Uso dos recursos.',
    bullets: [
      'Rafael Mariano (CEO) — CNPI, ex-XP/Rico/Terra, dev fullstack, piloto.',
      'Round Seed: R$ 1,5M · destrava growth, Sponsored Quests B2B e ops.',
      'Uso: 50% growth/CAC · 30% produto/eng · 20% ops, legal, compliance.',
      'Próximo passo: term sheet em até 30 dias · contato@rafaelmariano.com.br',
    ],
    footnote:
      'Cap table sintético, projeções 24m e modelo financeiro disponíveis sob NDA.',
  },
];

/* ----------------------------- Page ------------------------------- */

export const metadata: Metadata = {
  title: 'JUICE · Pitch · Seed Round 2026',
  description:
    'JUICE — economia de atenção e bateria do Brasil. Carregue o celular, ganhe pontos, saque via Pix. Pitch deck para investidores.',
  robots: { index: false, follow: false },
};

export default function PitchPage() {
  return (
    <div style={{ background: TOKENS.bg }}>
      {/* ---------- Cover (slide 01) ---------- */}
      <section
        className="relative flex min-h-screen flex-col justify-center px-6 py-24 md:px-12"
        style={{ background: TOKENS.bg, color: TOKENS.text }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 25% 30%, rgba(34, 197, 94, 0.12) 0%, transparent 55%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 55%)',
          }}
        />

        <div className="relative mx-auto w-full max-w-6xl">
          <div className="mb-10 flex items-center gap-3">
            <span
              className="font-mono text-xs tracking-[0.2em]"
              style={{ color: TOKENS.textSubtle }}
            >
              01 / 10
            </span>
            <span
              className="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{
                color: TOKENS.secondary,
                borderColor: `${TOKENS.secondary}55`,
                background: `${TOKENS.secondary}14`,
              }}
            >
              Seed Round · 2026
            </span>
          </div>

          <h1
            className="text-7xl font-black leading-none tracking-tighter md:text-[10rem]"
            style={{ color: TOKENS.primary }}
          >
            JUICE
          </h1>

          <p className="mt-8 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
            Carregue seu celular.
            <br />
            <span style={{ color: TOKENS.primary }}>Ganhe Pix.</span>
          </p>

          <p
            className="mt-6 max-w-2xl text-base leading-relaxed md:text-lg"
            style={{ color: TOKENS.textMuted }}
          >
            A economia de atenção e bateria do Brasil. Cada minuto carregando
            vira ponto. Cada 100 mil pontos vira Pix na conta do usuário.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href="#deck"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-colors"
              style={{
                background: TOKENS.primary,
                color: TOKENS.bg,
              }}
            >
              Ver o deck
              <ArrowDown className="h-4 w-4" aria-hidden />
            </a>
            <a
              href="mailto:contato@rafaelmariano.com.br?subject=JUICE%20—%20Pitch%20Seed%20Round"
              className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition-colors hover:bg-white/[0.04]"
              style={{
                color: TOKENS.text,
                borderColor: TOKENS.borderStrong,
              }}
            >
              <Mail className="h-4 w-4" aria-hidden />
              Falar com o founder
            </a>
          </div>

          <div
            className="mt-16 flex items-center gap-3 font-mono text-[11px] tracking-[0.2em]"
            style={{ color: TOKENS.textSubtle }}
          >
            <span>SCROLL</span>
            <span
              aria-hidden
              className="h-px w-12"
              style={{ background: TOKENS.borderStrong }}
            />
            <span>10 SLIDES</span>
            <span
              aria-hidden
              className="h-px w-12"
              style={{ background: TOKENS.borderStrong }}
            />
            <span>BRASIL</span>
          </div>
        </div>
      </section>

      {/* ---------- Slides 02-10 ---------- */}
      <div id="deck">
        {SLIDES.map((slide) => (
          <Slide key={slide.num} {...slide} />
        ))}
      </div>

      {/* ---------- Closing CTA ---------- */}
      <section
        className="px-6 py-24 md:px-12"
        style={{
          background: TOKENS.bg,
          borderTop: `1px solid ${TOKENS.border}`,
          color: TOKENS.text,
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p
              className="font-mono text-xs tracking-[0.2em]"
              style={{ color: TOKENS.textSubtle }}
            >
              FIM DO DECK · OBRIGADO
            </p>
            <p className="mt-3 text-2xl font-bold leading-tight md:text-3xl">
              Pronto pra construir a economia
              <br />
              de atenção do Brasil?
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="mailto:contato@rafaelmariano.com.br?subject=JUICE%20—%20Term%20Sheet"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-colors"
              style={{ background: TOKENS.primary, color: TOKENS.bg }}
            >
              Term sheet
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition-colors hover:bg-white/[0.04]"
              style={{
                color: TOKENS.text,
                borderColor: TOKENS.borderStrong,
              }}
            >
              Voltar ao site
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
