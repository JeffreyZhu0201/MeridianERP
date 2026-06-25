import { redirect } from 'next/navigation';

/** Phase 5: distributor management moved to platform admin. */
export default function DistributorsRedirectPage() {
  redirect('/');
}
