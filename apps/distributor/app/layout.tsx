import type { Metadata } from 'next';
import { getLocale, getMessages } from 'next-intl/server';
import { PortalLocaleProvider, PortalThemeProvider } from '@meridian/ui';

import { DistributorHeader } from '@/components/distributor-header';
import { getToken } from '@/lib/auth';

import './globals.css';

export const metadata: Metadata = {
  title: 'MeridianERP Distributor',
  description: 'Distributor self-service portal',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const token = await getToken();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <PortalLocaleProvider locale={locale} messages={messages}>
          <PortalThemeProvider storageKey="meridian-theme-distributor">
            {token ? <DistributorHeader /> : null}
            <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
          </PortalThemeProvider>
        </PortalLocaleProvider>
      </body>
    </html>
  );
}
