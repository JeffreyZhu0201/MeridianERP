import type { AppLocale } from './config.js';
import { enMessages } from './messages/en/index.js';
import { zhCNMessages } from './messages/zh-CN/index.js';

const catalogs = {
  en: enMessages,
  'zh-CN': zhCNMessages,
} satisfies Record<AppLocale, typeof enMessages | typeof zhCNMessages>;

export function loadMessages(locale: AppLocale) {
  return catalogs[locale];
}

export type Messages = typeof enMessages;
