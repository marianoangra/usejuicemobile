import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Mail } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

type Props = { params: Promise<{ locale: string }> };
type FaqItem = { q: string; a: string };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pages.support' });
  return { title: `${t('title')} · CNB Mobile` };
}

export default async function SupportPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'pages.support' });
  const email = t('email');

  const messages = (await import(`@/messages/${locale}.json`)).default;
  const items: FaqItem[] = messages.pages.support.items;

  return (
    <>
      <PageHeader title={t('title')} intro={t('intro')} />
      <section className="mx-auto max-w-3xl px-5 md:px-8 pb-24 space-y-14">
        {/* Email contact card */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-5">
            {t('contactTitle')}
          </h2>
          <div className="metal-card rounded-2xl p-6 md:p-8">
            <p className="text-sm md:text-base text-white/65 leading-relaxed">
              {t('emailDescription')}
            </p>
            <a
              href={`mailto:${email}`}
              className="mt-4 inline-flex items-center gap-3 text-lg md:text-xl font-semibold text-primary hover:underline underline-offset-4 break-all"
            >
              <Mail className="h-5 w-5 shrink-0" />
              {email}
            </a>
            <p className="mt-5 text-xs md:text-sm text-white/65">
              {t('responseTime')}
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-5">
            {t('faqTitle')}
          </h2>
          <div className="space-y-3">
            {items.map((item, i) => (
              <details
                key={i}
                className="metal-accordion group rounded-2xl p-5 md:p-6 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
                  <span className="text-base md:text-lg font-semibold text-white">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-white/60 transition-transform group-open:rotate-45"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 1V11M1 6H11"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </summary>
                <p className="mt-4 text-sm md:text-base text-white/65 leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
