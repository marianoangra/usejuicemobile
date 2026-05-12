'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Twitter } from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { trackEvent } from '@/lib/analytics';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

const EMAIL = 'contato@rafaelmariano.com.br';
const X_HANDLE = 'cnbmobile';

export function PartnersContact() {
  const t = useTranslations('pages.parceiros.contact');
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();

  const mailtoSubject = encodeURIComponent('Parceria Juice Mobile');
  const mailtoBody = encodeURIComponent(
    [
      'Oi Rafael,',
      '',
      'Vim do site usejuicemobile.com/parceiros e queria conversar sobre uma parceria.',
      '',
      '— Empresa:',
      '— Cargo:',
      '— Tipo de parceria de interesse:',
      '— Contexto / objetivo:',
      '',
      'Obrigado!',
    ].join('\n')
  );

  return (
    <section id="partner-form" className="relative py-24 md:py-32">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />

      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="metal-card relative overflow-hidden rounded-3xl p-8 md:p-12 text-center"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-secondary/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
          />

          <div className="relative">
            <SectionBadge variant="primary">{t('badge')}</SectionBadge>

            <h2
              ref={titleRef}
              className="section-title mt-5 metal-text"
            >
              {t('title')}
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-base md:text-lg text-white/65 leading-relaxed">
              {t('subtitle')}
            </p>

            <div className="mt-9 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3">
              <a
                href={`mailto:${EMAIL}?subject=${mailtoSubject}&body=${mailtoBody}`}
                onClick={() =>
                  trackEvent('partner_contact_clicked', { channel: 'email' })
                }
                className="metal-cta inline-flex items-center justify-center gap-2 rounded-[16px] px-8 py-4 text-base font-bold"
              >
                <Mail className="h-4 w-4" />
                {t('ctaEmail')}
                <ArrowRight className="h-4 w-4" />
              </a>

              <a
                href={`https://x.com/${X_HANDLE}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent('partner_contact_clicked', { channel: 'x' })
                }
                className="metal-outline inline-flex items-center justify-center gap-2 rounded-[16px] px-8 py-4 text-base font-bold"
              >
                <Twitter className="h-4 w-4" />
                {t('ctaX')}
              </a>
            </div>

            <div className="mt-8 pt-8 border-t border-white/[0.06]">
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                {t('founderLabel')}
              </p>
              <p className="mt-2 text-sm text-white/65">
                <span className="text-white font-semibold">
                  {t('founderName')}
                </span>{' '}
                · {t('founderRole')}
              </p>
              <p className="mt-3 text-xs text-white/60">{t('note')}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
