'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Building2, User, Mail, MessageSquare, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { SectionBadge } from '@/components/ui/SectionBadge';
import { insertPartnerInquiry, type PartnershipType } from '@/lib/firebase';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { useMetalSpotlight } from '@/lib/useMetalSpotlight';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PARTNERSHIP_TYPES: PartnershipType[] = [
  'sponsored_missions',
  'banners',
  'token_integration',
  'data_insights',
  'other',
];

export function PartnersContact() {
  const t = useTranslations('pages.parceiros.contact');
  const locale = useLocale();
  const titleRef = useMetalSpotlight<HTMLHeadingElement>();

  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [partnershipType, setPartnershipType] = useState<PartnershipType>('sponsored_missions');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'submitting' || status === 'success') return;

    const company = companyName.trim();
    const name = contactName.trim();
    const mail = email.trim().toLowerCase();
    const msg = message.trim();

    if (company.length < 2) { setStatus('error'); setErrorMsg(t('errorCompany')); return; }
    if (name.length < 2) { setStatus('error'); setErrorMsg(t('errorName')); return; }
    if (!EMAIL_RE.test(mail)) { setStatus('error'); setErrorMsg(t('errorEmail')); return; }
    if (msg.length < 10) { setStatus('error'); setErrorMsg(t('errorMessage')); return; }

    setStatus('submitting');
    setErrorMsg('');

    const result = await insertPartnerInquiry({
      companyName: company,
      contactName: name,
      email: mail,
      partnershipType,
      message: msg,
      locale,
      source: 'website-parceiros',
    });

    if (result.ok) {
      setStatus('success');
      trackEvent('partner_inquiry_submitted', { locale, type: partnershipType });
    } else {
      setStatus('error');
      setErrorMsg(result.error === 'rate_limit' ? t('errorRateLimit') : t('errorGeneric'));
      trackEvent('partner_inquiry_failed', { locale, error: result.error });
    }
  }

  function clearErrorOnChange() {
    if (status === 'error') { setStatus('idle'); setErrorMsg(''); }
  }

  const disabled = status === 'submitting' || status === 'success';

  return (
    <section id="partner-form" className="relative py-24 md:py-32 scroll-mt-24">
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
          className="metal-card relative overflow-hidden rounded-3xl p-8 md:p-12"
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
            <div className="text-center">
              <SectionBadge variant="primary">{t('badge')}</SectionBadge>
              <h2 ref={titleRef} className="section-title mt-5 metal-text">
                {t('title')}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base md:text-lg text-white/65 leading-relaxed">
                {t('subtitle')}
              </p>
            </div>

            {status === 'success' ? (
              <div
                role="status"
                className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{t('successTitle')}</h3>
                <p className="mt-2 text-sm text-white/70">{t('successBody')}</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-10 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    icon={<Building2 className="h-4 w-4" />}
                    label={t('fieldCompany')}
                    name="company"
                  >
                    <input
                      type="text"
                      required
                      autoComplete="organization"
                      maxLength={120}
                      value={companyName}
                      disabled={disabled}
                      onChange={(e) => { setCompanyName(e.target.value); clearErrorOnChange(); }}
                      placeholder={t('placeholderCompany')}
                      className={inputCls}
                    />
                  </Field>

                  <Field
                    icon={<User className="h-4 w-4" />}
                    label={t('fieldName')}
                    name="name"
                  >
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      maxLength={120}
                      value={contactName}
                      disabled={disabled}
                      onChange={(e) => { setContactName(e.target.value); clearErrorOnChange(); }}
                      placeholder={t('placeholderName')}
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field
                  icon={<Mail className="h-4 w-4" />}
                  label={t('fieldEmail')}
                  name="email"
                >
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    maxLength={200}
                    value={email}
                    disabled={disabled}
                    onChange={(e) => { setEmail(e.target.value); clearErrorOnChange(); }}
                    placeholder={t('placeholderEmail')}
                    className={inputCls}
                  />
                </Field>

                <Field label={t('fieldType')} name="type">
                  <select
                    required
                    value={partnershipType}
                    disabled={disabled}
                    onChange={(e) => { setPartnershipType(e.target.value as PartnershipType); clearErrorOnChange(); }}
                    className={cn(
                      inputCls,
                      'appearance-none bg-[length:14px] bg-[right_14px_center] bg-no-repeat pr-10',
                    )}
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='rgba(255,255,255,0.5)'><path d='M4.94 5.72L8 8.78l3.06-3.06.94.94L8 10.66 4 6.66l.94-.94z'/></svg>\")",
                    }}
                  >
                    {PARTNERSHIP_TYPES.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#0d1421] text-white">
                        {t(`type.${opt}`)}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  icon={<MessageSquare className="h-4 w-4 mt-3" />}
                  label={t('fieldMessage')}
                  name="message"
                  iconAlignTop
                >
                  <textarea
                    required
                    rows={5}
                    maxLength={2000}
                    value={message}
                    disabled={disabled}
                    onChange={(e) => { setMessage(e.target.value); clearErrorOnChange(); }}
                    placeholder={t('placeholderMessage')}
                    className={cn(inputCls, 'resize-y min-h-[120px] py-3.5')}
                  />
                </Field>

                {status === 'error' && (
                  <p
                    role="alert"
                    className="inline-flex items-center gap-2 text-sm text-red-300/90"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={disabled}
                  className="metal-cta inline-flex items-center justify-center gap-2 rounded-[16px] px-8 py-4 text-base font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {status === 'submitting' ? t('submitting') : t('submit')}
                  {status !== 'submitting' && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            )}

            <div className="mt-8 pt-8 border-t border-white/[0.06] text-center">
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/60">
                {t('founderLabel')}
              </p>
              <p className="mt-2 text-sm text-white/65">
                <span className="text-white font-semibold">{t('founderName')}</span>{' '}
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

const inputCls =
  'w-full rounded-[14px] border border-white/10 bg-white/[0.04] pl-11 pr-4 py-3.5 text-[15px] text-white placeholder:text-white/35 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors disabled:opacity-60';

function Field({
  icon,
  label,
  name,
  children,
  iconAlignTop,
}: {
  icon?: React.ReactNode;
  label: string;
  name: string;
  children: React.ReactNode;
  iconAlignTop?: boolean;
}) {
  return (
    <label htmlFor={name} className="block text-left">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/60">
        {label}
      </span>
      <div className="relative">
        {icon && (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute left-4 text-white/60',
              iconAlignTop ? 'top-3' : 'top-1/2 -translate-y-1/2',
            )}
          >
            {icon}
          </span>
        )}
        {/* Children inherit the icon padding via inputCls (pl-11). When there's no icon,
            collapse the left padding to pl-4 so labels still align with the rest. */}
        <div className={cn(!icon && '[&>*]:!pl-4')}>{children}</div>
      </div>
    </label>
  );
}
