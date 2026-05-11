import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { Token } from '@/components/sections/Token';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pages.token' });
  return { title: `${t('title')} · CNB Mobile` };
}

export default async function TokenPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'pages.token' });

  return (
    <>
      <PageHeader title={t('title')} intro={t('intro')} badge="SPL · Mainnet" />
      <Token />
    </>
  );
}
