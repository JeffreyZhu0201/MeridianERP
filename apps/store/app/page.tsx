import { getTranslations } from 'next-intl/server';
import { BentoDashboardFrame } from '@meridian/ui';

import { StorePicker } from './_components/store-picker';

export default async function HomePage() {
  const t = await getTranslations('store');

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <BentoDashboardFrame
        title={t('home.pickerTitle')}
        description={t('home.pickerDescription')}
        columns={2}
      >
        <StorePicker />
      </BentoDashboardFrame>
    </div>
  );
}
