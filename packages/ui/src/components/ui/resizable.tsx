'use client';

import * as React from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * ResizableHandle - 可调整尺寸面板的拖动手柄
 */
const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<'div'> & { withHandle?: boolean }) => (
  <div
    className={cn(
      'group relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full data-[orientation=vertical]:after:left-0 data-[orientation=vertical]:after:h-1 data-[orientation=vertical]:after:w-full data-[orientation=vertical]:after:-translate-y-1/2 data-[orientation=vertical]:after:translate-x-0',
      className
    )}
    tabIndex={0}
    role="separator"
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-muted">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </div>
);
ResizableHandle.displayName = 'ResizableHandle';

/**
 * ResizablePanelGroup - 可调整尺寸面板组容器
 */
const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => (
  <div
    className={cn('flex h-full w-full resize', className)}
    {...props}
  />
);
ResizablePanelGroup.displayName = 'ResizablePanelGroup';

/**
 * ResizablePanel - 可调整尺寸面板
 */
const ResizablePanel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    defaultSize?: number;
    minSize?: number;
  }
>(({ className, defaultSize, minSize = 0, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col',
      className
    )}
    style={{ minWidth: minSize }}
    {...props}
  />
));
ResizablePanel.displayName = 'ResizablePanel';

export { ResizablePanel, ResizablePanelGroup, ResizableHandle };
