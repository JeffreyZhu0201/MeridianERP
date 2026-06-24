import Link from 'next/link';
import { MetricCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from '@meridian/ui';
import { LeadStage } from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import {
  apiFetch,
  type MerchantDashboard,
  type OnboardingProfile,
  type PaginatedResponse,
  type Lead,
} from '@/lib/api';
import { getToken } from '@/lib/auth';

const stageVariant: Record<string, 'default' | 'warning' | 'success' | 'destructive'> = {
  [LeadStage.NEW]: 'default',
  [LeadStage.QUALIFIED]: 'warning',
  [LeadStage.WON]: 'success',
  [LeadStage.LOST]: 'destructive',
};

async function loadDashboard(token: string): Promise<MerchantDashboard> {
  try {
    return await apiFetch<MerchantDashboard>('/merchant/dashboard', {}, token);
  } catch {
    const profile = await apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(
      () => ({ businessName: 'Merchant', onboardingStatus: 'APPROVED' } as OnboardingProfile),
    );
    const leads = await apiFetch<PaginatedResponse<Lead>>('/merchant/leads?limit=5', {}, token).catch(
      () => ({ data: [], meta: { total: 0, page: 1, limit: 5 } }),
    );
    const contacts = await apiFetch<PaginatedResponse<unknown>>(
      '/merchant/contacts?limit=1',
      {},
      token,
    ).catch(() => ({ data: [], meta: { total: 0, page: 1, limit: 1 } }));
    const distributors = await apiFetch<PaginatedResponse<unknown>>(
      '/merchant/distributors?limit=1',
      {},
      token,
    ).catch(() => ({ data: [], meta: { total: 0, page: 1, limit: 1 } }));
    const openLeads = leads.data.filter(
      (l) => l.stage === LeadStage.NEW || l.stage === LeadStage.QUALIFIED,
    ).length;
    return {
      businessName: profile.businessName,
      contactsCount: contacts.meta.total,
      openLeads,
      activeDistributors: distributors.meta.total,
      recentBindings: 0,
      recentLeads: leads.data,
    };
  }
}

export default async function DashboardPage() {
  const token = await getToken();
  if (!token) return null;

  const stats = await loadDashboard(token);

  return (
    <MerchantShellWrapper businessName={stats.businessName}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {stats.businessName}
        </h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Contacts" value={stats.contactsCount} />
          <MetricCard title="Open Leads" value={stats.openLeads} />
          <MetricCard title="Active Distributors" value={stats.activeDistributors} />
          <MetricCard title="Recent Bindings" value={stats.recentBindings} />
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Recent Leads</h2>
            <div className="flex gap-2">
              <Link href="/crm/contacts" className="text-sm text-primary hover:underline">
                Add Contact
              </Link>
              <span className="text-muted-foreground">·</span>
              <Link href="/distributors" className="text-sm text-primary hover:underline">
                Add Distributor
              </Link>
            </div>
          </div>
          {stats.recentLeads.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              No leads yet
            </div>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.title}</TableCell>
                      <TableCell>
                        <Badge variant={stageVariant[lead.stage] ?? 'secondary'}>
                          {lead.stage}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.source ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(lead.updatedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>
    </MerchantShellWrapper>
  );
}
