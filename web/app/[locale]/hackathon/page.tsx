import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { Hackathon } from '@/components/sections/Hackathon';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pages.hackathon' });
  return { title: `${t('title')} · CNB Mobile` };
}

export default async function HackathonPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'pages.hackathon' });

  return (
    <>
      <PageHeader
        title={t('title')}
        intro={t('intro')}
        badge="Solana Foundation"
      />
      <Hackathon />
    </>
  );
}
