import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Wallet } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pages.wallet' });
  return { title: `${t('title')} · CNB Mobile` };
}

export default async function WalletPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'pages.wallet' });

  return (
    <>
      <PageHeader title={t('title')} intro={t('intro')} />
      <section className="mx-auto max-w-2xl px-5 md:px-8 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-border-glow/40 bg-card-gradient p-10 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="relative">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.08] border border-primary/25 text-primary">
              <Wallet className="h-6 w-6" />
            </div>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-wider text-primary">
              {t('comingSoon')}
            </p>
            <p className="mt-3 text-white/60 leading-relaxed">{t('intro')}</p>
          </div>
        </div>
      </section>
    </>
  );
}
