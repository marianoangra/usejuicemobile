import { cn } from '@/lib/cn';

interface SectionBadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary';
}

export function SectionBadge({
  children,
  className,
  variant = 'default',
}: SectionBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
        variant === 'primary'
          ? 'metal-badge-primary text-secondary-light'
          : 'metal-badge text-white/55',
        'section-badge font-mono',
        className
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          variant === 'primary' ? 'bg-secondary' : 'bg-white/45'
        )}
      />
      {children}
    </div>
  );
}
