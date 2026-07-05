import type { PortalLink } from '@/lib/portals';
import { portalEmbedUrl } from '@/lib/portal-embed';

import { PortalUiPreview } from './portal-ui-preview';

function PortalCard({
  portal,
  featured,
}: {
  portal: PortalLink;
  featured?: boolean;
}) {
  const embedSrc = portalEmbedUrl(portal);

  return (
    <article
      className={`framer-card group relative flex flex-col overflow-hidden rounded-2xl transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-24px_rgba(0,0,0,0.2)] ${
        featured ? 'md:col-span-2 md:row-span-2' : ''
      }`}
    >
      <div className={`relative ${featured ? 'h-28 md:h-48' : 'h-28'}`}>
        <PortalUiPreview
          src={embedSrc}
          width={1280}
          height={720}
          title={`${portal.title} 界面预览`}
          className="absolute inset-0"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/50 to-transparent px-4 pb-3 pt-8">
          <span className="font-mono text-[0.625rem] uppercase tracking-widest text-white/80">
            {portal.titleEn}
          </span>
          <span className="rounded-full bg-white/15 px-2 py-0.5 font-mono text-[0.625rem] text-white backdrop-blur-sm">
            :{portal.port}
          </span>
        </div>
      </div>

      <div className={`relative flex flex-1 flex-col p-5 ${featured ? 'md:p-8' : ''}`}>
        <h3
          className={`font-display font-semibold tracking-[-0.02em] text-ink ${
            featured ? 'text-2xl md:text-3xl' : 'text-lg'
          }`}
        >
          {portal.title}
        </h3>
        <p
          className={`mt-2 flex-1 text-mist ${featured ? 'max-w-md text-base leading-relaxed' : 'text-sm leading-relaxed'}`}
        >
          {portal.description}
        </p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ink">
          打开门户
          <span className="transition-transform group-hover:translate-x-1" aria-hidden>
            →
          </span>
        </span>
      </div>

      <a
        href={portal.href}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
      >
        <span className="sr-only">打开 {portal.title}</span>
      </a>
    </article>
  );
}

export function PortalGrid({ portals }: { portals: PortalLink[] }) {
  const [admin, merchant, store, distributor] = portals;

  if (!admin || !merchant || !store || !distributor) return null;

  return (
    <section id="portals" className="relative z-[5] scroll-mt-20 bg-white py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-mist">
            Shipped with Meridian
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.875rem,4vw,3rem)] font-semibold tracking-[-0.035em] text-ink">
            四个门户，一套平台
          </h2>
          <p className="mt-4 text-base leading-relaxed text-mist">
            独立前端共享 NestJS API。本地开发各跑不同端口，预览区嵌入真实门户界面。
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3 md:grid-rows-2 md:gap-5">
          <PortalCard portal={admin} featured />
          <PortalCard portal={merchant} />
          <PortalCard portal={store} />
          <PortalCard portal={distributor} />
        </div>
      </div>
    </section>
  );
}
