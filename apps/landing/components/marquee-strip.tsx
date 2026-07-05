const items = [
  'CRM',
  'Master SKU',
  'Allocation',
  'Procurement',
  'Funds',
  'Fulfillment',
  'Commissions',
  'Multi-tenant',
  'NestJS API',
  'PostgreSQL',
];

export function MarqueeStrip() {
  const doubled = [...items, ...items];

  return (
    <div className="relative z-[5] overflow-hidden border-y border-neutral-200/80 bg-white py-3.5" aria-hidden>
      <div className="flex w-max motion-safe:animate-marquee gap-10 whitespace-nowrap font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-neutral-400">
        {doubled.map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center gap-10">
            {item}
            <span className="text-neutral-300">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
