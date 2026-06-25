'use client';

import { type ReactNode } from 'react';
import type { PortalId } from '@meridian/shared';

import { cn } from '../../lib/utils';
import { LocaleToggle } from '../theme/locale-toggle';
import { ModeToggle } from '../theme/mode-toggle';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '../ui/sidebar';

export interface ErpShellProps {
  /** Sidebar header slot — brand / business name */
  sidebarHeader?: ReactNode;
  /** Navigation content inside SidebarContent */
  sidebar: ReactNode;
  /** Optional sidebar footer */
  sidebarFooter?: ReactNode;
  /** Left side of top bar after SidebarTrigger */
  headerStart?: ReactNode;
  /** Right cluster before locale/theme toggles */
  headerEnd?: ReactNode;
  portal: PortalId;
  children: ReactNode;
  className?: string;
}

/**
 * FW-SHELL-ERP — dashboard-01 + sidebar-03 layout with theme toggle in header.
 */
export function ErpShell({
  sidebarHeader,
  sidebar,
  sidebarFooter,
  headerStart,
  headerEnd,
  portal,
  children,
  className,
}: ErpShellProps) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="sidebar">
        {sidebarHeader ? <SidebarHeader>{sidebarHeader}</SidebarHeader> : null}
        <SidebarContent>{sidebar}</SidebarContent>
        {sidebarFooter ? <SidebarFooter>{sidebarFooter}</SidebarFooter> : null}
      </Sidebar>
      <SidebarInset className={className}>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          {headerStart}
          <div className="ml-auto flex items-center gap-2">
            {headerEnd}
            <LocaleToggle portal={portal} />
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 md:gap-6 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
