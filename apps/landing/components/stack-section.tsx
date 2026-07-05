import { apiUrl } from '@/lib/portals';

const stackItems = [
  { label: 'API', value: apiUrl, mono: true },
  { label: 'Contracts', value: '@meridian/shared', mono: false },
  { label: 'UI', value: '@meridian/ui', mono: false },
  { label: 'Database', value: 'PostgreSQL + Prisma', mono: false },
  { label: 'Jobs', value: 'Redis + BullMQ', mono: false },
  { label: 'Docs', value: 'docs/PRODUCT.md', mono: true },
];

export function StackSection() {
  return (
    <section id="stack" className="framer-dark-section relative z-[5] scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-neutral-500">
            Full platform
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.875rem,4vw,3rem)] font-semibold tracking-[-0.035em] text-white">
            不只是界面，而是完整架构
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-400">
            所有门户通过 NestJS API 通信。PostgreSQL 承载业务数据，Redis 与 BullMQ 处理异步任务与缓存。
          </p>
        </div>

        <dl className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stackItems.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:bg-white/[0.07]"
            >
              <dt className="font-mono text-[0.625rem] uppercase tracking-widest text-neutral-500">
                {item.label}
              </dt>
              <dd
                className={`mt-2 text-sm text-neutral-200 ${item.mono ? 'font-mono break-all' : ''}`}
              >
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
