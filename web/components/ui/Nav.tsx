'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Menu, X as CloseIcon } from 'lucide-react';
import { JuiceWordmark } from './JuiceWordmark';
import { LangSwitcher } from './LangSwitcher';
import { cn } from '@/lib/cn';

export function Nav() {
  const t = useTranslations('nav');
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const navItems = [
    { href: '/#features', label: t('features') },
    { href: '/#how-it-works', label: t('howItWorks') },
    { href: '/manifesto', label: t('manifesto') },
    { href: '/tokenomics', label: t('tokenomics') },
    { href: '/hackathon', label: t('hackathon') },
    { href: '/parceiros', label: t('parceiros') },
  ];

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-bg-deep/85 backdrop-blur-md border-b border-white/[0.06]'
            : 'bg-transparent border-b border-transparent'
        )}
      >
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-3.5 md:px-8">
          <Link href="/" aria-label="JUICE" className="inline-flex items-center">
            <JuiceWordmark className="h-7 w-auto md:h-8" />
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <NavItem href={item.href} label={item.label} />
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-2">
            <SocialLinks />
            <LangSwitcher />
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/80 hover:bg-white/[0.04]"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 top-[60px] z-40 bg-bg-deep/98 backdrop-blur-md md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-auto max-w-[1280px] px-5 py-6"
            onClick={(e) => e.stopPropagation()}
          >
            <ul className="flex flex-col gap-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3.5 text-base text-white/85 hover:bg-white/[0.04]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center gap-3">
              <SocialLinks />
              <LangSwitcher />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SocialLinks() {
  return (
    <div className="flex items-center gap-1">
      <a
        href="https://x.com/usejuicemobile"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="X (Twitter)"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      <a
        href="https://t.me/grupcriptocnb"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Telegram"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden>
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      </a>
    </div>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  const className =
    'nav-link relative rounded-lg px-3 py-2 text-sm text-white/65 hover:text-white transition-colors';
  return (
    <Link href={href} className={className}>
      <span className="relative inline-block">
        {label}
        <span aria-hidden className="nav-link-trail" />
      </span>
    </Link>
  );
}

