import { type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        {
          'bg-primary/10 text-primary': variant === 'default',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
          'bg-destructive/10 text-destructive': variant === 'destructive',
          'border border-input text-foreground': variant === 'outline',
          'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400': variant === 'success',
          'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400': variant === 'warning',
        },
        className,
      )}
      {...props}
    />
  );
}
