import { redirect } from 'next/navigation';

import { requirePluginInstalled } from '@/lib/plugins';

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const allowed = await requirePluginInstalled('crm');
  if (!allowed) {
    redirect('/plugins?highlight=crm');
  }
  return children;
}
