'use client';

import type { PortalId } from '@meridian/shared';

import { LocaleToggle } from './locale-toggle';
import { ModeToggle } from './mode-toggle';

export function AuthToolbar({ portal }: { portal: PortalId }) {
  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
      <LocaleToggle portal={portal} />
      <ModeToggle />
    </div>
  );
}
