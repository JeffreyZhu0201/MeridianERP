import { IconClock } from '@tabler/icons-react';
import { Badge, Card, CardContent } from '@meridian/ui';

export default async function OnboardingPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const email = params.email ?? 'your email';

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="space-y-4 p-8">
          <IconClock className="mx-auto size-12 text-muted-foreground" stroke={1.5} />
          <h1 className="text-xl font-semibold">Application Under Review</h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ll notify you at {email} once approved.
          </p>
          <Badge variant="warning">Under Review</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
