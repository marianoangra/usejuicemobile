import * as React from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  highlighted?: boolean;
}

export function Card({ className, highlighted, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card-gradient rounded-3xl p-7 transition-all duration-300',
        'border',
        highlighted
          ? 'border-primary/55 shadow-glow-card'
          : 'border-border-glow/50 hover:border-primary/50 hover:shadow-glow-card',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
