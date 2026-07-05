import { ProductPreview } from '@/components/product-preview';

export function HeroSection() {
  return (
    <section className="framer-mesh relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <div className="mx-auto max-w-4xl text-center motion-safe:animate-fade-up">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.24em] text-mist">
            Multi-tenant SaaS ERP
          </p>
          <h1 className="mt-5 font-display text-balance text-[clamp(2.5rem,7vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-ink">
            面向专业团队的
            <br />
            多租户 ERP 平台
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-mist md:text-lg">
            从工厂总部到分店、拓店员与消费者商城——配货、库存、资金与履约在同一套 API 上协同运行。
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a href="#portals" className="framer-btn-primary">
              免费开始探索
            </a>
            <a href="#capabilities" className="framer-btn-secondary">
              查看已交付能力
            </a>
          </div>
        </div>

        <div className="relative mx-auto mt-14 max-w-5xl motion-safe:animate-fade-up md:mt-20">
          <div
            className="pointer-events-none absolute -inset-x-8 top-1/2 -z-10 h-3/4 -translate-y-1/2 rounded-full bg-neutral-200/60 blur-3xl"
            aria-hidden
          />
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
