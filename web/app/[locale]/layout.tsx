import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Nav } from '@/components/ui/Nav';
import { BackToTop } from '@/components/ui/BackToTop';
import { Footer } from '@/components/sections/Footer';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  // localePrefix: 'as-needed' — default locale (pt) is served from root.
  const localePath = locale === 'pt' ? '/' : `/${locale}`;
  const ogLocale =
    locale === 'pt' ? 'pt_BR' : locale === 'en' ? 'en_US' : 'es_ES';

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    alternates: {
      canonical: localePath,
      languages: {
        pt: '/',
        en: '/en',
        es: '/es',
        'x-default': '/',
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      locale: ogLocale,
      url: localePath,
      siteName: 'CNB Mobile',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/favicon.ico',
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'pt' | 'en' | 'es')) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <Nav />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <BackToTop />
    </NextIntlClientProvider>
  );
}
