import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Hero } from '@/components/sections/Hero';
import { PartnersTrust } from '@/components/sections/PartnersTrust';
import { Features } from '@/components/sections/Features';
import { Community } from '@/components/sections/Community';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { Hackathon } from '@/components/sections/Hackathon';
import { Founder } from '@/components/sections/Founder';
import { Waitlist } from '@/components/sections/Waitlist';
import { Faq } from '@/components/sections/Faq';
import { JsonLd } from '@/components/seo/JsonLd';
import { getPublicStats } from '@/lib/firebase';

// ISR — re-fetch the public stats doc at most every 5 min to keep the live
// counter fresh without hammering Firestore on every request.
export const revalidate = 300;

type Props = { params: Promise<{ locale: string }> };

const LOCALE_TAG: Record<string, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'meta' });
  const inLanguage = LOCALE_TAG[locale] ?? locale;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://www.usejuicemobile.com/#organization',
        name: 'Juice Mobile',
        alternateName: 'Cripto no Bolso',
        url: 'https://www.usejuicemobile.com',
        logo: {
          '@type': 'ImageObject',
          url: 'https://www.usejuicemobile.com/icon.jpg',
          width: 1024,
          height: 1024,
        },
        sameAs: [
          'https://x.com/usejuicemobile',
          'https://www.instagram.com/usejuicemobile',
          'https://t.me/grupcriptocnb',
          'https://chat.whatsapp.com/GsIEmnUPKsn2W95HEjPwW8',
          'https://github.com/marianoangra/cnbapp',
        ],
        founder: {
          '@type': 'Person',
          name: 'Rafael Mariano',
          url: 'https://rafaelmariano.com.br',
          jobTitle: 'CEO & Founder',
        },
      },
      {
        '@type': 'MobileApplication',
        '@id': 'https://www.usejuicemobile.com/#app',
        name: 'Juice Mobile',
        description: t('description'),
        operatingSystem: 'iOS, Android',
        applicationCategory: 'FinanceApplication',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'BRL',
        },
        author: { '@id': 'https://www.usejuicemobile.com/#organization' },
        publisher: { '@id': 'https://www.usejuicemobile.com/#organization' },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://www.usejuicemobile.com/#website',
        url: 'https://www.usejuicemobile.com',
        name: 'Juice Mobile',
        description: t('description'),
        publisher: { '@id': 'https://www.usejuicemobile.com/#organization' },
        inLanguage,
      },
    ],
  };

  const stats = await getPublicStats();

  return (
    <>
      <JsonLd data={jsonLd} />
      <Hero stats={stats} />
      <PartnersTrust />
      <Features />
      <Community />
      <HowItWorks />
      <Hackathon />
      <Founder />
      <Waitlist />
      <Faq />
    </>
  );
}
