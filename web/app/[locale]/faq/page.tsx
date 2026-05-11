import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';

type Props = { params: Promise<{ locale: string }> };

type FaqItem = { q: string; a: string };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pages.faq' });
  return { title: `${t('title')} · CNB Mobile` };
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Load raw messages so we can iterate the array.
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const t = await getTranslations({ locale, namespace: 'pages.faq' });
  const items: FaqItem[] = messages.pages.faq.items;

  // FAQPage schema lives here — the canonical FAQ destination — not on
  // the homepage section, to avoid duplicate-markup signals to Google.
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <>
      <JsonLd data={faqSchema} />
      <PageHeader title={t('title')} intro={t('intro')} />
      <section className="mx-auto max-w-3xl px-5 md:px-8 pb-24">
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
              <p className="mt-4 text-sm md:text-base text-white/60 leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
