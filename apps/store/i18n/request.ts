import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import {
  defaultLocale,
  isAppLocale,
  loadMessages,
  localeCookieName,
} from '@meridian/shared';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(localeCookieName('store'))?.value;
  const locale = isAppLocale(raw) ? raw : defaultLocale;

  return {
    locale,
    messages: loadMessages(locale),
  };
});
