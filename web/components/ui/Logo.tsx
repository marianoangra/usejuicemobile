import Image from 'next/image';
import { cn } from '@/lib/cn';

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}

export function Logo({ className, showWordmark = true, size = 32 }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        aria-hidden
        className="relative inline-flex items-center justify-center overflow-hidden rounded-[8px]"
        style={{ width: size, height: size }}
      >
        <Image
          src="/images/logo.png"
          alt=""
          width={size}
          height={size}
          priority
          className="h-full w-full object-cover"
          sizes={`${size}px`}
        />
      </span>
      {showWordmark && (
        <span className="font-bold tracking-tight text-white text-[15px]">
          CNB<span className="text-primary"> Mobile</span>
        </span>
      )}
    </span>
  );
}
