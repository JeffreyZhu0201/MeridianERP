import Link from 'next/link';
import { IconArrowLeft } from '@tabler/icons-react';

interface AdminBackLinkProps {
  href: string;
  label: string;
}

export function AdminBackLink({ href, label }: AdminBackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
    >
      <IconArrowLeft stroke={1.5} className="size-4" aria-hidden />
      {label}
    </Link>
  );
}
