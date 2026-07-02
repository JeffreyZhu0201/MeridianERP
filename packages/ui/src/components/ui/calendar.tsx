'use client';

import * as React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { cn } from '../../lib/utils';

export type CalendarProps = React.ComponentProps<'div'>;

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative flex flex-col rounded-md border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  )
);
Calendar.displayName = 'Calendar';

const CalendarHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-1 pb-4', className)}
    {...props}
  />
);
CalendarHeader.displayName = 'CalendarHeader';

const CalendarHeading = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    role="heading"
    aria-level={3}
    className={cn('flex items-center justify-between py-1', className)}
    {...props}
  />
);
CalendarHeading.displayName = 'CalendarHeading';

const CalendarNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center space-x-1', className)} {...props} />
);
CalendarNav.displayName = 'CalendarNav';

const CalendarPrevButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      'inline-flex items-center justify-center rounded-md p-1 opacity-50 hover:opacity-100',
      className
    )}
    {...props}
  >
    <ChevronLeftIcon className="h-4 w-4" />
  </button>
));
CalendarPrevButton.displayName = 'CalendarPrevButton';

const CalendarNextButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      'inline-flex items-center justify-center rounded-md p-1 opacity-50 hover:opacity-100',
      className
    )}
    {...props}
  >
    <ChevronRightIcon className="h-4 w-4" />
  </button>
));
CalendarNextButton.displayName = 'CalendarNextButton';

const CalendarGrid = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) => (
  <table className={cn('w-full border-collapse', className)} {...props} />
);
CalendarGrid.displayName = 'CalendarGrid';

const CalendarHead = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn('', className)} {...props} />
);
CalendarHead.displayName = 'CalendarHead';

const CalendarRow = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('flex w-full', className)} {...props} />
);
CalendarRow.displayName = 'CalendarRow';

const CalendarHeadCell = ({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      'h-8 w-8 p-0 text-center text-sm font-medium text-muted-foreground',
      className
    )}
    {...props}
  />
);
CalendarHeadCell.displayName = 'CalendarHeadCell';

const CalendarBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody
    className={cn('divide-y divide-border', className)}
    {...props}
  />
);
CalendarBody.displayName = 'CalendarBody';

const CalendarCell = ({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={cn(
      'h-9 w-9 p-0 text-center text-sm [&:has([aria-selected])]:bg-accent',
      className
    )}
    {...props}
  />
);
CalendarCell.displayName = 'CalendarCell';

export {
  Calendar,
  CalendarHeader,
  CalendarHeading,
  CalendarNav,
  CalendarPrevButton,
  CalendarNextButton,
  CalendarGrid,
  CalendarHead,
  CalendarRow,
  CalendarHeadCell,
  CalendarBody,
  CalendarCell,
};
