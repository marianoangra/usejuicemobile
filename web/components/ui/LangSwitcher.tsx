'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

function BRFlag() {
  return (
    <svg
      width="18"
      height="13"
      viewBox="0 0 28 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ display: 'block' }}
    >
      <rect width="28" height="20" rx="2" fill="#009c3b" />
      <polygon points="14,3 25,10 14,17 3,10" fill="#ffdf00" />
      <circle cx="14" cy="10" r="3.4" fill="#002776" />
    </svg>
  );
}

function USFlag() {
  return (
    <svg
      width="18"
      height="13"
      viewBox="0 0 28 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ display: 'block' }}
    >
      <rect width="28" height="20" rx="2" fill="#FFFFFF" />
      <g fill="#B22234">
        <rect width="28" height="1.54" />
        <rect y="3.08" width="28" height="1.54" />
        <rect y="6.15" width="28" height="1.54" />
        <rect y="9.23" width="28" height="1.54" />
        <rect y="12.31" width="28" height="1.54" />
        <rect y="15.38" width="28" height="1.54" />
        <rect y="18.46" width="28" height="1.54" />
      </g>
      <rect width="11.2" height="10.77" fill="#3C3B6E" />
    </svg>
  );
}

function ESFlag() {
  return (
    <svg
      width="18"
      height="13"
      viewBox="0 0 28 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ display: 'block' }}
    >
      <rect width="28" height="5" fill="#AA151B" />
      <rect y="5" width="28" height="10" fill="#F1BF00" />
      <rect y="15" width="28" height="5" fill="#AA151B" />
    </svg>
  );
}

const LANGS = [
  { code: 'pt', label: 'PT', Flag: BRFlag, name: 'Português' },
  { code: 'en', label: 'EN', Flag: USFlag, name: 'English' },
  { code: 'es', label: 'ES', Flag: ESFlag, name: 'Español' },
] as const;

interface LangSwitcherProps {
  variant?: 'header' | 'footer';
}

export function LangSwitcher({ variant = 'header' }: LangSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const current = LANGS.find((l) => l.code === locale) ?? LANGS[0];
  const CurrentFlag = current.Flag;

  function changeLocale(code: 'pt' | 'en' | 'es') {
    setOpen(false);
    router.replace(pathname, { locale: code });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Change language — current: ${current.name}`}
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors',
          variant === 'header'
            ? 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]'
            : 'bg-transparent hover:bg-white/[0.04]'
        )}
      >
        <CurrentFlag />
        {/* aria-hidden so the link's accessible name is fully driven by
            the aria-label above (which already names the current locale). */}
        <span aria-hidden="true" className="font-medium text-white/80">{current.label}</span>
        <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-white/50" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c1410]/95 backdrop-blur-md py-1 shadow-2xl"
        >
          {LANGS.map((l) => {
            const Flag = l.Flag;
            return (
              <li key={l.code}>
                <button
                  onClick={() => changeLocale(l.code)}
                  role="option"
                  aria-selected={l.code === locale}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors',
                    l.code === locale
                      ? 'text-primary bg-primary/[0.06]'
                      : 'text-white/80 hover:bg-white/[0.04]'
                  )}
                >
                  <Flag />
                  <span>{l.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
