import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { LegalDoc } from '@/components/ui/LegalDoc';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pages.privacy' });
  return { title: `${t('title')} · CNB Mobile` };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'pages.privacy' });
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const doc = messages.pages.privacy;

  return (
    <>
      <PageHeader title={t('title')} />
      <LegalDoc lastUpdated={doc.lastUpdated} sections={doc.sections} />
    </>
  );
}
