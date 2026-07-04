'use client';

import * as React from 'react';
import { Toaster as SonnerToaster, toast } from 'sonner';

const Toaster = () => {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full',
          title: 'text-sm font-semibold',
          description: 'text-sm opacity-90',
          actionButton:
            'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 disabled:pointer-events-none disabled:opacity-50',
          cancelButton:
            'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 disabled:pointer-events-none disabled:opacity-50',
        },
      }}
    />
  );
};

export { Toaster, toast };
