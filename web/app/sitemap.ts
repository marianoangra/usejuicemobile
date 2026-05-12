import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.usejuicemobile.com';
const LOCALES = ['pt', 'en', 'es'] as const;
const DEFAULT_LOCALE = 'pt' as const;

// Pages relative to the locale root.
const PAGES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/manifesto', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/parceiros', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/token', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/hackathon', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/wallet', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/suporte', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/termos', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/privacidade', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/copyright', priority: 0.3, changeFrequency: 'yearly' },
];

function urlFor(locale: string, path: string): string {
  // localePrefix: 'as-needed' — default locale (pt) has no prefix
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  return `${BASE_URL}${prefix}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const { path, priority, changeFrequency } of PAGES) {
      entries.push({
        url: urlFor(locale, path),
        lastModified,
        changeFrequency,
        priority,
        alternates: {
          languages: {
            pt: urlFor('pt', path),
            en: urlFor('en', path),
            es: urlFor('es', path),
            'x-default': urlFor(DEFAULT_LOCALE, path),
          },
        },
      });
    }
  }

  return entries;
}
