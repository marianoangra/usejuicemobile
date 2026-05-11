import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['pt', 'en', 'es'],
  defaultLocale: 'pt',
  localePrefix: 'as-needed',
  // Brazil-first product: `/` always serves PT immediately, no Accept-Language
  // sniffing redirect. Lighthouse measured a ~921ms penalty from the previous
  // behavior (PT default → 307 → /en for browsers reporting en-US), which
  // hurt mobile perf scores for the global audience that hits the apex first.
  //
  // Trade-off: EN/ES users hitting `/` see PT initially and need one click on
  // LangSwitcher. After that the URL itself carries the locale (/en/...,
  // /es/...) and bookmarks/links/search results work without middleware help.
  localeDetection: false,
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
