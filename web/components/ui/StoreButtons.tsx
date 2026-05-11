import { cn } from '@/lib/cn';

const APP_STORE_URL =
  process.env.NEXT_PUBLIC_APP_STORE_URL ??
  'https://apps.apple.com/br/app/cnb-mobile/id6762065336';

const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
  'https://play.google.com/store/apps/details?id=com.cnb.cnbappv2';

const SEEKER_URL =
  process.env.NEXT_PUBLIC_SEEKER_URL ?? 'https://solanamobile.com/seeker';

interface StoreButtonsProps {
  className?: string;
  size?: 'md' | 'lg';
}

export function StoreButtons({ className, size = 'md' }: StoreButtonsProps) {
  // min-w pinned to the natural width of the longest pair
  // ("Download on the / App Store") so all three buttons share width.
  const dim =
    size === 'lg'
      ? { wh: 'h-[52px] min-w-[184px]', textTop: 'text-[10px]', textBot: 'text-[17px]' }
      : { wh: 'h-[44px] min-w-[160px]', textTop: 'text-[9px]', textBot: 'text-[14px]' };

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Download on the App Store"
        className={cn(
          'group inline-flex items-center gap-2.5 rounded-[12px] border border-white/15 bg-black px-4 transition-all',
          'hover:border-white/30 hover:bg-[#0c0c0c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          dim.wh
        )}
      >
        <AppleLogo />
        {/* aria-hidden so the link's accessible name is just the aria-label
            instead of the textContent concatenation of the two inner spans
            (which Lighthouse flags as label-content-name-mismatch). */}
        <span aria-hidden="true" className="flex flex-col items-start leading-none">
          <span className={cn('text-white/70', dim.textTop)}>Download on the</span>
          <span className={cn('font-semibold text-white', dim.textBot)}>App Store</span>
        </span>
      </a>

      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Get it on Google Play"
        className={cn(
          'group inline-flex items-center gap-2.5 rounded-[12px] border border-white/15 bg-black px-4 transition-all',
          'hover:border-white/30 hover:bg-[#0c0c0c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          dim.wh
        )}
      >
        <GoogleplayLogo />
        <span aria-hidden="true" className="flex flex-col items-start leading-none">
          <span className={cn('text-white/70', dim.textTop)}>Get it on</span>
          <span className={cn('font-semibold text-white', dim.textBot)}>Google Play</span>
        </span>
      </a>

      <a
        href={SEEKER_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Get it on Seeker"
        className={cn(
          'group inline-flex items-center gap-2.5 rounded-[12px] border border-white/15 bg-black px-4 transition-all',
          'hover:border-white/30 hover:bg-[#0c0c0c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          dim.wh
        )}
      >
        <SeekerLogo />
        <span aria-hidden="true" className="flex flex-col items-start leading-none">
          <span className={cn('text-white/70', dim.textTop)}>Get it on</span>
          <span className={cn('font-semibold text-white', dim.textBot)}>Seeker</span>
        </span>
      </a>
    </div>
  );
}

function AppleLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M17.05 12.04c-.03-3.16 2.58-4.68 2.7-4.75-1.47-2.15-3.76-2.45-4.57-2.49-1.95-.2-3.8 1.15-4.79 1.15-.99 0-2.51-1.12-4.13-1.09-2.13.03-4.09 1.24-5.18 3.14-2.21 3.83-.57 9.5 1.59 12.61 1.05 1.52 2.31 3.23 3.96 3.17 1.59-.06 2.19-1.03 4.11-1.03 1.92 0 2.46 1.03 4.14.99 1.71-.03 2.79-1.55 3.83-3.08 1.21-1.77 1.71-3.49 1.74-3.58-.04-.02-3.34-1.28-3.4-5.04zM13.92 3.05C14.79 1.99 15.38.52 15.21-.95c-1.26.05-2.79.84-3.69 1.89-.81.94-1.51 2.44-1.32 3.88 1.4.11 2.84-.71 3.72-1.77z" />
    </svg>
  );
}

function SeekerLogo() {
  // Solana Mobile mark — three slanted parallelograms in the
  // signature purple→green Solana gradient.
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="seeker-sol-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9945ff" />
          <stop offset="50%" stopColor="#14f195" />
          <stop offset="100%" stopColor="#19fb9b" />
        </linearGradient>
      </defs>
      <path
        d="M4.5 17.6 L7.6 14.5 L20 14.5 L16.9 17.6 Z"
        fill="url(#seeker-sol-grad)"
      />
      <path
        d="M4.5 12 L7.6 8.9 L20 8.9 L16.9 12 Z"
        fill="url(#seeker-sol-grad)"
      />
      <path
        d="M4.5 6.4 L7.6 3.3 L20 3.3 L16.9 6.4 Z"
        fill="url(#seeker-sol-grad)"
      />
    </svg>
  );
}

function GoogleplayLogo() {
  return (
    <svg
      viewBox="0 0 512 512"
      width="22"
      height="22"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fill="#00d4ff"
        d="M325.3 234.3 104.6 13l280.8 161.2-60.1 60.1z"
      />
      <path
        fill="#ffce00"
        d="m104.6 499 220.7-221.3 60.1 60.1L104.6 499z"
      />
      <path
        fill="#ff3a44"
        d="m385.4 337.8-60.1-60.1 76.7-76.7 76.7 44.1c19.5 11 19.5 33.3 0 44.4l-93.3 48.3z"
      />
      <path
        fill="#00f076"
        d="M104.6 13c-7.4 5.4-12.9 13.6-12.9 24.2v437.5c0 10.6 5.5 18.8 12.9 24.2l220.7-221.3L104.6 13z"
      />
    </svg>
  );
}
