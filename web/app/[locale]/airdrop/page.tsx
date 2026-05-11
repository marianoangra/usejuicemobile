import { Suspense } from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { AirdropForm } from '@/components/sections/AirdropForm';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pages.airdrop' });
  return {
    title: `${t('metaTitle')} · JUICE`,
    description: t('metaDescription'),
  };
}

export default async function AirdropPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Suspense required because AirdropForm uses useSearchParams() — Next.js
  // bails out of static rendering for the form subtree but the rest of the
  // route still prerenders.
  return (
    <Suspense fallback={null}>
      <AirdropForm />
    </Suspense>
  );
}
