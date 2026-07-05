'use client';

import { useState } from 'react';
import { portalEmbedUrl } from '@/lib/portal-embed';
import { portals } from '@/lib/portals';

import { PortalUiPreview } from './portal-ui-preview';

export function ProductPreview() {
  const [active, setActive] = useState(portals[0]?.id ?? 'admin');
  const portal = portals.find((p) => p.id === active) ?? portals[0];

  if (!portal) return null;

  const embedSrc = portalEmbedUrl(portal);

  return (
    <div className="framer-mock overflow-hidden rounded-2xl md:rounded-[1.25rem]">
      <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-neutral-300" />
          <span className="size-2.5 rounded-full bg-neutral-300" />
          <span className="size-2.5 rounded-full bg-neutral-300" />
        </div>
        <div className="mx-auto flex min-w-0 max-w-md flex-1 items-center justify-center rounded-md bg-white px-3 py-1.5 font-mono text-[0.625rem] text-mist ring-1 ring-neutral-200 md:text-xs">
          <span className="truncate">{portal.href.replace(/^https?:\/\//, '')}</span>
        </div>
      </div>

      <div className="flex min-h-[280px] flex-col md:min-h-[380px] md:flex-row">
        <aside className="flex gap-1 overflow-x-auto border-b border-neutral-100 bg-white p-2 md:w-44 md:flex-col md:gap-0.5 md:border-b-0 md:border-r md:p-3">
          {portals.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(p.id)}
              className={`shrink-0 rounded-lg px-3 py-2 text-left text-xs transition-colors md:text-sm ${
                active === p.id
                  ? 'bg-neutral-100 font-medium text-ink'
                  : 'text-mist hover:bg-neutral-50 hover:text-ink'
              }`}
            >
              {p.title}
            </button>
          ))}
        </aside>

        <div className="relative min-h-[240px] flex-1 md:min-h-0">
          <PortalUiPreview
            key={embedSrc}
            src={embedSrc}
            width={1280}
            height={720}
            title={`${portal.title} 界面预览`}
            className="absolute inset-0"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-neutral-100 bg-white px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[0.625rem] uppercase tracking-widest text-mist">
            {portal.titleEn}
          </p>
          <p className="truncate text-sm text-mist">{portal.description}</p>
        </div>
        <a
          href={portal.href}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-sm font-medium text-ink underline-offset-4 hover:underline"
        >
          打开 →
        </a>
      </div>
    </div>
  );
}
