'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const toggleGroupVariants = cva(
  'inline-flex items-center justify-center rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleGroupVariants>
>({ variant: 'default' });

const ToggleGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof toggleGroupVariants>
>(({ className, variant, ...props }, ref) => (
  <ToggleGroupContext.Provider value={{ variant }}>
    <div
      ref={ref}
      className={cn('inline-flex gap-1', toggleGroupVariants({ variant }), className)}
      {...props}
    />
  </ToggleGroupContext.Provider>
));
ToggleGroup.displayName = 'ToggleGroup';

const toggleGroupItemVariants = cva(
  'inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1.5 text-sm font-medium transition-colors rounded-md',
  {
    variants: {
      variant: {
        default:
          'hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
        outline:
          'border border-transparent hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
      },
      size: {
        default: 'h-9',
        sm: 'h-8 px-2',
        lg: 'h-10 px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof toggleGroupItemVariants>
>(({ className, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);

  return (
    <button
      type="button"
      ref={ref}
      className={cn(
        toggleGroupItemVariants({
          variant: variant || context.variant,
          size,
        }),
        className
      )}
      {...props}
    />
  );
});
ToggleGroupItem.displayName = 'ToggleGroupItem';

export { ToggleGroup, ToggleGroupItem, toggleGroupVariants };
