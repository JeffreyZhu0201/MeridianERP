export function CtaSection() {
  return (
    <section className="relative z-[5] border-t border-neutral-200 bg-white py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 text-center md:px-6">
        <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-semibold tracking-[-0.04em] text-ink">
          开始使用 MeridianERP
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base text-mist">
          选择对应门户进入系统，或在本地一键启动全部服务。
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href="#portals" className="framer-btn-primary">
            选择入口
          </a>
          <a href="#stack" className="framer-btn-secondary">
            查看架构
          </a>
        </div>
      </div>
    </section>
  );
}
