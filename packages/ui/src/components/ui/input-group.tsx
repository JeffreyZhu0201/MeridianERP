import * as React from 'react';
import { cn } from '../../lib/utils';

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center', className)}
    {...props}
  />
));
InputGroup.displayName = 'InputGroup';

const InputGroupAddon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-center px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md border border-input',
      className
    )}
    {...props}
  />
));
InputGroupAddon.displayName = 'InputGroupAddon';

export { InputGroup, InputGroupAddon };
