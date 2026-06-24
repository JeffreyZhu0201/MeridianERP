import Link from 'next/link';
import { Suspense } from 'react';
import { MetricCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { StatusBadge } from '@/components/status-badge';
import { apiFetch, type DashboardStats, type PaginatedResponse, type MerchantListItem } from '@/lib/api';
import { getToken } from '@/lib/auth';

async function loadDashboard(token: string): Promise<DashboardStats> {
  try {
    return await apiFetch<DashboardStats>('/platform/dashboard', {}, token);
  } catch {
    const merchants = await apiFetch<PaginatedResponse<MerchantListItem>>(
      '/platform/merchants?limit=5',
      {},
      token,
    );
    const all = await apiFetch<PaginatedResponse<MerchantListItem>>(
      '/platform/merchants?limit=100',
      {},
      token,
    );
    const pending = all.data.filter(
      (m) => m.onboardingStatus === 'SUBMITTED' || m.onboardingStatus === 'UNDER_REVIEW',
    ).length;
    return {
      totalMerchants: all.meta.total,
      pendingReview: pending,
      activeDistributors: 0,
      bindingsLast30Days: 0,
      recentMerchants: merchants.data,
    };
  }
}

export default async function DashboardPage() {
  const token = await getToken();
  if (!token) return null;

  const stats = await loadDashboard(token);

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total Merchants" value={stats.totalMerchants} />
          <MetricCard title="Pending Review" value={stats.pendingReview} />
          <MetricCard title="Active Distributors" value={stats.activeDistributors} />
          <MetricCard title="Bindings (30d)" value={stats.bindingsLast30Days} />
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Recent Merchants</h2>
            <Link href="/merchants" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {stats.recentMerchants.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              No merchants yet
            </div>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentMerchants.map((merchant) => (
                    <TableRow key={merchant.id}>
                      <TableCell className="font-medium">{merchant.businessName}</TableCell>
                      <TableCell>
                        <StatusBadge status={merchant.onboardingStatus} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {merchant.submittedAt
                          ? new Date(merchant.submittedAt).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/merchants/${merchant.id}`} className="text-sm text-primary hover:underline">
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>
    </AdminShellWrapper>
  );
}
