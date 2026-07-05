'use client';

import { useEffect, useState } from 'react';

const links = [
  { href: '#portals', label: '入口' },
  { href: '#capabilities', label: '能力' },
  { href: '#stack', label: '架构' },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        scrolled ? 'framer-nav-scrolled' : 'border-transparent bg-transparent'
      }`}
    >
      <nav
        className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:h-[3.75rem] md:px-6"
        aria-label="主导航"
      >
        <a
          href="#"
          className="font-display text-[0.9375rem] font-semibold tracking-[-0.03em] text-ink md:text-base"
        >
          Meridian
        </a>

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-full px-3.5 py-1.5 text-sm text-mist transition-colors hover:bg-neutral-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="#capabilities"
            className="hidden text-sm text-mist transition-colors hover:text-ink sm:inline-flex min-h-9 items-center px-3"
          >
            了解更多
          </a>
          <a href="#portals" className="framer-btn-primary min-h-9 px-4 text-sm md:min-h-10 md:px-5">
            进入系统
          </a>
        </div>
      </nav>
    </header>
  );
}
