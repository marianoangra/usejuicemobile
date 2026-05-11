import { cn } from '@/lib/cn';

interface PageHeaderProps {
  title: string;
  intro?: string;
  badge?: string;
  className?: string;
}

export function PageHeader({ title, intro, badge, className }: PageHeaderProps) {
  return (
    <header className={cn('relative pt-32 pb-12 md:pt-40 md:pb-16', className)}>
      <div aria-hidden className="absolute inset-x-0 top-0 h-96 bg-glow-tr opacity-50" />
      <div className="relative mx-auto max-w-3xl px-5 md:px-8">
        {badge && (
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/[0.08] px-3 py-1.5 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-primary">
              {badge}
            </span>
          </div>
        )}
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
          {title}
        </h1>
        {intro && (
          <p className="mt-5 text-base md:text-lg text-white/55 leading-relaxed max-w-2xl">
            {intro}
          </p>
        )}
      </div>
    </header>
  );
}
