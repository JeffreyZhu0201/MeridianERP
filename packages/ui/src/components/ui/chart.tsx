import * as React from 'react';
import { cn } from '../../lib/utils';

const Chart = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('', className)}
    {...props}
  />
));
Chart.displayName = 'Chart';

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { config?: Record<string, unknown> }
>(({ className, config, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
ChartContainer.displayName = 'ChartContainer';

export { Chart, ChartContainer };
