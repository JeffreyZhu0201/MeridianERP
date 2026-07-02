/*
 * @Author: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @Date: 2026-06-25 13:53:43
 * @LastEditors: Jeffrey Zhu JeffreyZhu0201@gmail.com
 * @LastEditTime: 2026-07-02 14:54:37
 * @FilePath: /MeridianERP/packages/shared/src/i18n/load-messages.ts
 * @Description: Load messages for the given locale
 * 
 * Copyright (c) 2026 by JeffreyZhu, All Rights Reserved. 
 */
import type { AppLocale } from './config.js';
import { enMessages } from './messages/en/index.js';
import { zhCNMessages } from './messages/zh-CN/index.js';

/**
 * @description: Catalogs for the given locale
 * @return {*}
 */
const catalogs = {
  en: enMessages,
  'zh-CN': zhCNMessages,
} satisfies Record<AppLocale, typeof enMessages | typeof zhCNMessages>;

/**
 * @description: Load messages for the given locale
 * @param {AppLocale} locale
 * @return {*}
 */
export function loadMessages(locale: AppLocale) {
  return catalogs[locale];
}

export type Messages = typeof enMessages;
