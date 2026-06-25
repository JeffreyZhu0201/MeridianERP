'use client';

import * as React from 'react';
import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';
import { XIcon } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Button } from './button';

function SidebarSheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sidebar-sheet" {...props} />;
}

function SidebarSheetContent({
  className,
  children,
  side = 'left',
  showCloseButton = false,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton?: boolean;
}) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/50" />
      <SheetPrimitive.Popup
        data-slot="sidebar-sheet-content"
        data-side={side}
        className={cn(
          'fixed z-50 flex h-full flex-col bg-sidebar text-sidebar-foreground shadow-lg transition ease-in-out',
          side === 'left' && 'inset-y-0 left-0 border-r',
          side === 'right' && 'inset-y-0 right-0 border-l',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close
            render={
              <Button variant="ghost" className="absolute right-3 top-3" size="icon-sm" />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Popup>
    </SheetPrimitive.Portal>
  );
}

function SidebarSheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('sr-only flex flex-col gap-0.5 p-4', className)} {...props} />;
}

function SidebarSheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      className={cn('text-base font-medium text-foreground', className)}
      {...props}
    />
  );
}

function SidebarSheetDescription({ className, ...props }: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  SidebarSheet,
  SidebarSheetContent,
  SidebarSheetHeader,
  SidebarSheetTitle,
  SidebarSheetDescription,
};
