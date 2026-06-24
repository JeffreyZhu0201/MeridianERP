import Link from 'next/link';
import { Card, CardContent } from '@meridian/ui';

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 p-6 pt-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">MeridianERP Store</h1>
          <p className="text-sm text-muted-foreground">
            Visit a store at <code className="text-foreground">/s/your-store-slug</code>
          </p>
          <Link
            href="/s/demo"
            className="inline-block text-sm text-primary hover:underline"
          >
            Try demo store →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
