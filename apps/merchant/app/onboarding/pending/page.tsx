import { getTranslations } from 'next-intl/server';
import { IconClock } from '@tabler/icons-react';
import { AuthStatusFrame, Badge } from '@meridian/ui/server';

export default async function OnboardingPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const t = await getTranslations('merchant.onboarding');
  const params = await searchParams;
  const email = params.email ?? t('defaultEmail');

  return (
    <AuthStatusFrame
      subtitle={t('subtitle')}
      title={t('title')}
      description={t('description', { email })}
    >
      <IconClock className="mx-auto size-12 text-muted-foreground" stroke={1.5} />
      <Badge variant="warning">{t('badgeUnderReview')}</Badge>
    </AuthStatusFrame>
  );
}
