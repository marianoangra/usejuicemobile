'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Twitter, Github, Send, MessageCircle } from 'lucide-react';
import { JuiceWordmark } from '@/components/ui/JuiceWordmark';
import { LangSwitcher } from '@/components/ui/LangSwitcher';
import { StoreButtons } from '@/components/ui/StoreButtons';

/*
 * Social links — set via env vars to keep the source clean:
 *   NEXT_PUBLIC_TWITTER_URL
 *   NEXT_PUBLIC_TELEGRAM_URL
 *   NEXT_PUBLIC_DISCORD_URL
 *   NEXT_PUBLIC_GITHUB_URL
 *
 * Links with no env var are hidden (we don't render dead/placeholder links).
 */
const SOCIALS: Array<{ key: string; href: string | undefined; Icon: typeof Twitter; label: string }> = [
  { key: 'twitter', href: process.env.NEXT_PUBLIC_TWITTER_URL, Icon: Twitter, label: 'X / Twitter' },
  { key: 'telegram', href: process.env.NEXT_PUBLIC_TELEGRAM_URL, Icon: Send, label: 'Telegram' },
  { key: 'discord', href: process.env.NEXT_PUBLIC_DISCORD_URL, Icon: MessageCircle, label: 'Discord' },
  { key: 'github', href: process.env.NEXT_PUBLIC_GITHUB_URL, Icon: Github, label: 'GitHub' },
];

export function Footer() {
  const t = useTranslations('footer');

  const companyHrefs = {
    manifesto: '/manifesto',
    pitch: '/pitch',
    hackathon: '/hackathon',
    founder: '/#founder',
  } as const;
  const companyLinks: Array<keyof typeof companyHrefs> = [
    'manifesto',
    'pitch',
    'hackathon',
    'founder',
  ];

  const productHrefs = {
    features: '/#features',
    howItWorks: '/#how-it-works',
    token: '/token',
    tokenomics: '/tokenomics',
    parceiros: '/parceiros',
    airdrop: '/airdrop',
    download: '/#waitlist',
  } as const;
  const productLinks: Array<keyof typeof productHrefs> = [
    'features',
    'howItWorks',
    'token',
    'tokenomics',
    'parceiros',
    'airdrop',
    'download',
  ];

  const legalHrefs = {
    terms: '/termos',
    privacy: '/privacidade',
    privacyEn: '/privacidade',
    copyright: '/copyright',
    cloakPrivacy: 'https://www.cloak.ag/privacy',
  } as const;
  const legalLinks: Array<keyof typeof legalHrefs> = [
    'terms',
    'privacy',
    'privacyEn',
    'copyright',
    'cloakPrivacy',
  ];

  const supportHrefs = {
    helpCenter: '/suporte',
    faq: '/faq',
    deleteAccount: '/delete-account',
  } as const;
  const supportLinks: Array<keyof typeof supportHrefs> = [
    'helpCenter',
    'faq',
    'deleteAccount',
  ];

  const visibleSocials = SOCIALS.filter((s) => !!s.href);

  return (
    <footer className="relative mt-12 border-t border-white/[0.06] bg-bg-deep">
      {/* Download banner */}
      <div className="mx-auto max-w-[1280px] px-5 md:px-8 pt-14 pb-2">
        <div className="metal-card relative overflow-hidden rounded-3xl p-8 md:p-10">
          <div aria-hidden className="absolute inset-0 bg-glow-tr opacity-60" />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {t('downloadTitle')}
              </h3>
              <p className="mt-2 text-sm md:text-base text-white/55 max-w-md">
                {t('downloadSubtitle')}
              </p>
            </div>
            <StoreButtons />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-5 md:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand column */}
          <div className="md:col-span-4">
            <JuiceWordmark className="h-8 w-auto" />
            <p className="mt-4 max-w-xs text-sm text-white/50 leading-relaxed">
              {t('tagline')}
            </p>
            <div className="mt-3 inline-flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/65">
                Brazil
              </span>
              <BrazilFlag />
            </div>
            {visibleSocials.length > 0 && (
              <div className="mt-6 flex items-center gap-2">
                {visibleSocials.map(({ key, href, Icon, label }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/60 hover:text-primary hover:border-primary/30 hover:bg-primary/[0.05] transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link grid: 4 columns */}
          <div className="md:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
              {/* Company */}
              <div>
                <h4 className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                  {t('company')}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {companyLinks.map((key) => (
                    <li key={key}>
                      <Link
                        href={companyHrefs[key]}
                        className="text-sm text-white/70 hover:text-white transition-colors"
                      >
                        {t(`companyLinks.${key}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Product */}
              <div>
                <h4 className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                  {t('product')}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {productLinks.map((key) => (
                    <li key={key}>
                      <Link
                        href={productHrefs[key]}
                        className="text-sm text-white/70 hover:text-white transition-colors"
                      >
                        {t(`productLinks.${key}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                  {t('legal')}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {legalLinks.map((key) => {
                    const href = legalHrefs[key];
                    const isExternal = href.startsWith('http');
                    return (
                      <li key={key}>
                        {isExternal ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-white/70 hover:text-white transition-colors"
                          >
                            {t(`legalLinks.${key}`)}
                          </a>
                        ) : (
                          <Link
                            href={href}
                            {...(key === 'privacyEn' ? { locale: 'en' as const } : {})}
                            className="text-sm text-white/70 hover:text-white transition-colors"
                          >
                            {t(`legalLinks.${key}`)}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                  {t('support')}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {supportLinks.map((key) => (
                    <li key={key}>
                      <Link
                        href={supportHrefs[key]}
                        className="text-sm text-white/70 hover:text-white transition-colors"
                      >
                        {t(`supportLinks.${key}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar: powered by + lang + copyright */}
        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-5">
            <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-white/55 hover:text-white transition-colors"
              aria-label="Powered by Solana"
            >
              <span>{t('poweredBy')}</span>
              <SolanaWordmark />
            </a>
            <LangSwitcher variant="footer" />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-xs text-white/60">{t('copyright')}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/55">
              Mainnet · Solana · v1.0
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function BrazilFlag() {
  return (
    <span aria-hidden className="brazil-flag inline-block">
      <svg
        width="22"
        height="16"
        viewBox="0 0 28 20"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <rect width="28" height="20" rx="1.5" fill="#009c3b" />
        <polygon points="14,3 25,10 14,17 3,10" fill="#ffdf00" />
        <circle cx="14" cy="10" r="3.4" fill="#002776" />
      </svg>
    </span>
  );
}

function SolanaWordmark() {
  return (
    <svg
      width="68"
      height="11"
      viewBox="0 0 100 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="sol-grad" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="12"
        fontFamily="system-ui, sans-serif"
        fontSize="13"
        fontWeight="700"
        letterSpacing="0.5"
        fill="url(#sol-grad)"
      >
        SOLANA
      </text>
    </svg>
  );
}
