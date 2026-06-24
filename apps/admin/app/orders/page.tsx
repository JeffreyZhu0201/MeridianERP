import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch, type PaginatedResponse, type PlatformOrder } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { OrdersTable } from './_components/orders-table';

interface OrdersPageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const token = await getToken();
  if (!token) return null;

  const params = await searchParams;
  const query = new URLSearchParams();
  query.set('page', params.page ?? '1');
  query.set('limit', '20');
  if (params.status) query.set('status', params.status);

  let orders: PlatformOrder[] = [];
  try {
    const res = await apiFetch<PaginatedResponse<PlatformOrder>>(
      `/platform/orders?${query.toString()}`,
      {},
      token,
    );
    orders = res.data;
  } catch {
    orders = [];
  }

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Cross-tenant order list (read-only)
        </p>
        <OrdersTable orders={orders} />
      </div>
    </AdminShellWrapper>
  );
}
