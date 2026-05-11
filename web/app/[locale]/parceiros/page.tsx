import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { JsonLd } from '@/components/seo/JsonLd';
import { PartnersHero } from '@/components/sections/parceiros/PartnersHero';
import { PartnersKpi } from '@/components/sections/parceiros/PartnersKpi';
import { PartnersAudience } from '@/components/sections/parceiros/PartnersAudience';
import { PartnersOfferings } from '@/components/sections/parceiros/PartnersOfferings';
import { PartnersFlow } from '@/components/sections/parceiros/PartnersFlow';
import { PartnersCases } from '@/components/sections/parceiros/PartnersCases';
import { PartnersTiers } from '@/components/sections/parceiros/PartnersTiers';
import { PartnersFaq } from '@/components/sections/parceiros/PartnersFaq';
import { PartnersContact } from '@/components/sections/parceiros/PartnersContact';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pages.parceiros' });
  const localePath = locale === 'pt' ? '/parceiros' : `/${locale}/parceiros`;

  return {
    title: `${t('title')} · CNB Mobile`,
    description: t('intro'),
    alternates: {
      canonical: localePath,
      languages: {
        pt: '/parceiros',
        en: '/en/parceiros',
        es: '/es/parceiros',
        'x-default': '/parceiros',
      },
    },
    openGraph: {
      title: `${t('title')} · CNB Mobile`,
      description: t('intro'),
      type: 'website',
      url: localePath,
      siteName: 'CNB Mobile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('title')} · CNB Mobile`,
      description: t('intro'),
    },
  };
}

export default async function ParceirosPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'pages.parceiros' });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Brand Partnership · DePIN Sponsored Missions',
    provider: {
      '@type': 'Organization',
      '@id': 'https://www.usejuicemobile.com/#organization',
      name: 'CNB Mobile',
    },
    description: t('intro'),
    areaServed: {
      '@type': 'Country',
      name: 'Brazil',
    },
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'Brands, exchanges, fintechs, mobility, energy, CPG',
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Sponsored Missions',
        category: 'CPCM · Cost Per Mission Completion',
      },
      {
        '@type': 'Offer',
        name: 'In-App Native Banners',
        category: 'CPM · CPC',
      },
      {
        '@type': 'Offer',
        name: 'Token Integration',
        category: 'GMV · Tokenized Volume',
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <PartnersHero />
      <PartnersKpi />
      <PartnersAudience />
      <PartnersOfferings />
      <PartnersFlow />
      <PartnersCases />
      <PartnersTiers />
      <PartnersFaq />
      <PartnersContact />
    </>
  );
}
