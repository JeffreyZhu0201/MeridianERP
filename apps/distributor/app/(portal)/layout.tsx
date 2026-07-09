import { DistributorShellWrapper } from '@/components/distributor-shell-wrapper';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <DistributorShellWrapper>{children}</DistributorShellWrapper>;
}
