'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { insertLead } from '@/lib/firebase';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Waitlist() {
  const t = useTranslations('waitlist');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();

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

    const result = await insertLead({
      email: email.trim().toLowerCase(),
      locale,
      source: 'website-waitlist',
    });

    if (result.ok) {
      setStatus('success');
      setEmail('');
      trackEvent('waitlist_submitted', { locale, source: 'website-waitlist' });
    } else {
      setStatus('error');
      setErrorMsg(t('errorGeneric'));
      trackEvent('waitlist_failed', { locale, error: result.error });
    }
  }

  return (
    <section id="waitlist" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-[1280px] px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto max-w-3xl text-center"
        >
          <SectionBadge>{t('badge')}</SectionBadge>
          <h2 ref={titleRef} className="section-title mt-5 metal-text">{t('title')}</h2>
          <p className="mx-auto mt-5 max-w-xl text-base md:text-lg text-white/55 leading-relaxed">
            {t('subtitle')}
          </p>

          <form
            onSubmit={onSubmit}
            className="mx-auto mt-9 flex w-full max-w-md flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Mail
                aria-hidden
                className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60"
              />
              <input
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
                aria-label={t('emailPlaceholder')}
                className="w-full rounded-[14px] border border-white/10 bg-white/[0.04] pl-11 pr-4 py-3.5 text-[15px] text-white placeholder:text-white/35 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'submitting' || status === 'success'}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-[14px] px-7 py-3.5 text-[15px] font-bold',
                status === 'success' ? 'metal-cta-champagne' : 'metal-cta',
                'disabled:opacity-70 disabled:cursor-not-allowed'
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
          </form>

          {status === 'error' && (
            <p
              role="alert"
              className="mt-4 inline-flex items-center gap-2 text-sm text-red-300/90"
            >
              <AlertCircle className="h-4 w-4" />
              {errorMsg}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
