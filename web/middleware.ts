import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Runs on every request to a non-static, non-API path. With
// `localeDetection: false` in i18n/routing.ts the middleware no longer
// redirects based on Accept-Language — `/` always serves PT directly,
// and /en, /es are reached only via explicit URL or LangSwitcher.
// This eliminates the ~921ms first-paint redirect penalty that Lighthouse
// surfaced on mobile audits.
export default createMiddleware(routing);

export const config = {
  // Match all paths except API, _next, _vercel, and static files (anything
  // with a dot in the last segment, e.g. /favicon.ico, /robots.txt).
  matcher: ['/((?!api|_next|_vercel|demoday|submission|proposta|txt|.*\\..*).*)'],
};
