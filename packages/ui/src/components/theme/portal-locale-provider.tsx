'use client';

import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import type { ReactNode } from 'react';

export interface PortalLocaleProviderProps {
  locale: string;
  messages: AbstractIntlMessages;
  children: ReactNode;
}

export function PortalLocaleProvider({ locale, messages, children }: PortalLocaleProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
