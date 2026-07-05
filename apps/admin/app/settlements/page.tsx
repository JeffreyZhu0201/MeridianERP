import { redirect } from 'next/navigation';

export default async function SettlementsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value || key === 'tab') continue;
    if (key === 'page') {
      query.set('batchPage', value);
    } else {
      query.set(key, value);
    }
  }
  const qs = query.toString();
  redirect(qs ? `/withdrawals?${qs}#settlements` : '/withdrawals#settlements');
}
