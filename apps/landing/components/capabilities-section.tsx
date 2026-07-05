const capabilities = [
  {
    title: '总部管控',
    body: '主 SKU 目录、分店配货、旗舰配送队列、分店进货发货、资金 KPI 与拓店分润。',
    tag: 'Admin',
  },
  {
    title: '分店运营',
    body: 'CRM 插件、库存与采购、订单核销、总部进货与门店资金视图。',
    tag: 'Merchant',
  },
  {
    title: '拓店分润',
    body: '配货确认计提佣金，结算批次导出后拓店员方可提现。',
    tag: 'Distributor',
  },
  {
    title: '统一商城',
    body: '旗舰目录与消费者结账，分店自提或配送，无下游分销商绑定。',
    tag: 'Store',
  },
];

export function CapabilitiesSection() {
  return (
    <section id="capabilities" className="relative z-[5] scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-mist">
            Not just modules
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.875rem,4vw,3rem)] font-semibold tracking-[-0.035em] text-ink">
            已交付的端到端能力
          </h2>
          <p className="mt-4 text-base leading-relaxed text-mist">
            Phase 1 至 Phase 5 已上线。租户隔离、角色权限与共享合约，面向真实履约与资金闭环。
          </p>
        </div>

        <ul className="mt-16 grid gap-5 sm:grid-cols-2">
          {capabilities.map((item, index) => (
            <li
              key={item.title}
              className="framer-card rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-0.5 md:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-sm tabular-nums text-neutral-300">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider text-mist">
                  {item.tag}
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-[-0.02em] text-ink md:text-2xl">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-mist md:text-base">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
