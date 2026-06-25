import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
          'border border-border bg-background hover:bg-accent hover:text-accent-foreground dark:border-border/50 dark:bg-transparent dark:hover:bg-muted/50':
            variant === 'outline',
          'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
          'h-9 px-4 text-sm': size === 'default',
          'h-8 px-3 text-xs': size === 'sm',
          'h-11 px-6 text-sm': size === 'lg',
          'size-9 p-0': size === 'icon',
          'size-7 p-0': size === 'icon-sm',
        },
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
