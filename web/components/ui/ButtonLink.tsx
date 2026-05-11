import * as React from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'md' | 'lg' | 'sm';

interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  'inline-flex items-center justify-center gap-2 font-bold select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-deep';

const variants: Record<Variant, string> = {
  primary: 'metal-cta',
  outline: 'metal-outline',
  ghost:
    'bg-transparent text-white/70 hover:text-secondary-light transition-colors',
};

const sizes: Record<Size, string> = {
  sm: 'rounded-[10px] px-4 py-2 text-sm',
  md: 'rounded-[14px] px-7 py-3.5 text-[15px]',
  lg: 'rounded-[16px] px-8 py-4 text-base',
};

export function ButtonLink({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <a
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </a>
  );
}
