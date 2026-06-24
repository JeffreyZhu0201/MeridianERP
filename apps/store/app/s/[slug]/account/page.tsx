import { Card, CardContent } from '@meridian/ui';

import { StoreShellWrapper } from '@/components/store-shell-wrapper';
import { apiFetch, storePath, type Cart } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface AccountPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { slug } = await params;
  const token = await getToken();

  const cart = await apiFetch<Cart>(storePath(slug, 'cart'), {}, token).catch(() => null);
  const storeName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <StoreShellWrapper storeSlug={slug} storeName={storeName} cartCount={cartCount}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">My account</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Order history and account settings will appear here once the store orders API is
              connected.
            </p>
          </CardContent>
        </Card>
      </div>
    </StoreShellWrapper>
  );
}
