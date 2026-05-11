'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Check, AlertCircle, Sparkles } from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { WalletConnectButton } from '@/components/ui/WalletConnectButton';
import { SolanaProvider } from '@/components/providers/SolanaProvider';
import { insertWaitlist } from '@/lib/firebase';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AirdropForm() {
  return (
    <SolanaProvider>
      <AirdropFormInner />
    </SolanaProvider>
  );
}

function AirdropFormInner() {
  const t = useTranslations('pages.airdrop');
  const locale = useLocale();
  const search = useSearchParams();
  const { publicKey, connected } = useWallet();
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const prefill = search.get('email');
    if (prefill && EMAIL_RE.test(prefill)) setEmail(prefill);
  }, [search]);

  const fromApp = search.get('from') === 'app';
  const uid = search.get('uid');
  const wallet = connected && publicKey ? publicKey.toBase58() : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'submitting') return;

    if (!EMAIL_RE.test(email.trim())) {
      setStatus('error');
      setErrorMsg(t('errorEmail'));
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    const result = await insertWaitlist({
      email: email.trim().toLowerCase(),
      walletAddress: wallet,
      locale,
      source: fromApp ? 'app-redirect' : 'web-airdrop',
      uid: uid ?? null,
    });

    if (result.ok) {
      setStatus('success');
      trackEvent('airdrop_signup', {
        locale,
        hasWallet: !!wallet,
        fromApp,
      });
    } else {
      setStatus('error');
      setErrorMsg(t('errorGeneric'));
      trackEvent('airdrop_signup_failed', { locale, error: result.error });
    }
  }

  return (
    <section className="relative pt-32 pb-24 md:pt-40 md:pb-32">
      <div aria-hidden className="absolute inset-x-0 top-0 h-96 bg-glow-tr opacity-50" />
      <div className="relative mx-auto max-w-[1280px] px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <SectionBadge variant="primary">
            <Sparkles className="h-3 w-3" />
            {t('badge')}
          </SectionBadge>
          <h1 ref={titleRef} className="section-title mt-5 metal-text">
            {t('title')}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base md:text-lg text-white/55 leading-relaxed">
            {t('subtitle')}
          </p>

          {fromApp && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/[0.06] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-secondary-light">
              <Check className="h-3 w-3" />
              {t('fromAppBadge')}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-12 max-w-xl"
        >
          <div className="metal-card relative overflow-hidden rounded-3xl p-6 md:p-8">
            <div aria-hidden className="absolute inset-0 bg-glow-tr opacity-40" />
            <div className="relative">
              <form onSubmit={onSubmit} className="space-y-5">
                {/* Step 1 — email */}
                <div>
                  <label
                    htmlFor="airdrop-email"
                    className="block font-mono text-[11px] uppercase tracking-wider text-white/65"
                  >
                    {t('step1Label')}
                  </label>
                  <div className="relative mt-2">
                    <Mail
                      aria-hidden
                      className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
                    />
                    <input
                      id="airdrop-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === 'error') setStatus('idle');
                      }}
                      disabled={status === 'submitting' || status === 'success'}
                      placeholder={t('emailPlaceholder')}
                      className="w-full rounded-[14px] border border-white/10 bg-white/[0.04] pl-11 pr-4 py-3.5 text-[15px] text-white placeholder:text-white/35 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Step 2 — wallet */}
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/65">
                    {t('step2Label')}
                    <span className="ml-2 text-white/55 normal-case">
                      {t('step2Optional')}
                    </span>
                  </label>
                  <div className="mt-2">
                    <WalletConnectButton className="w-full" />
                  </div>
                  <p className="mt-2 text-xs text-white/60 leading-relaxed">
                    {t('step2Help')}
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === 'submitting' || status === 'success'}
                  className={cn(
                    'inline-flex w-full items-center justify-center gap-2 rounded-[14px] px-7 py-3.5 text-[15px] font-bold',
                    status === 'success' ? 'metal-cta-champagne' : 'metal-cta',
                    'disabled:opacity-70 disabled:cursor-not-allowed',
                  )}
                >
                  {status === 'success' ? (
                    <>
                      <Check className="h-4 w-4" />
                      {t('success')}
                    </>
                  ) : status === 'submitting' ? (
                    t('submitting')
                  ) : (
                    <>
                      {t('submit')}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                {status === 'error' && (
                  <p
                    role="alert"
                    className="inline-flex items-center gap-2 text-sm text-red-300/90"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {errorMsg}
                  </p>
                )}

                {status === 'success' && (
                  <p className="text-sm text-white/65 leading-relaxed">
                    {wallet
                      ? t('successWithWallet')
                      : t('successWithoutWallet')}
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Reassurance row */}
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            {(['noSpam', 'firstAccess', 'noPurchase'] as const).map((key) => (
              <li
                key={key}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-white/55"
              >
                {t(`reassurance.${key}`)}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
