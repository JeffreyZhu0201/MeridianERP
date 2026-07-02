/*
 * @Author: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @Date: 2026-06-25 13:53:43
 * @LastEditors: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @LastEditTime: 2026-07-01 22:24:03
 * @FilePath: /MeridianERP/apps/admin/i18n/request.ts
 * @Description: 
 * 
 * Copyright (c) 2026 by JeffreyZhu, All Rights Reserved. 
 */
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
  const raw = cookieStore.get(localeCookieName('admin'))?.value;
  const locale = isAppLocale(raw) ? raw : defaultLocale;

  return {
    locale,
    messages: loadMessages(locale),
    timeZone: 'UTC',
  };
});
