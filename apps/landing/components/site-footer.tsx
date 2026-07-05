import { portals } from '@/lib/portals';

const footerLinks = [
  { href: '#portals', label: '入口' },
  { href: '#capabilities', label: '能力' },
  { href: '#stack', label: '架构' },
];

export function SiteFooter() {
  return (
    <footer className="framer-dark-section relative z-[5] border-t border-white/10 py-14">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-lg font-semibold tracking-[-0.02em] text-white">
              MeridianERP
            </p>
            <p className="mt-2 font-mono text-xs text-neutral-500">
              v1.0.9 · QTWBJFXT20250904
            </p>
          </div>

          <nav aria-label="页脚导航">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-400">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-8 font-mono text-xs text-neutral-500">
          {portals.map((p) => (
            <li key={p.id}>
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-neutral-300"
              >
                {p.titleEn} :{p.port}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
