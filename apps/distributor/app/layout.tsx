import type { Metadata } from 'next';
import { getLocale, getMessages, getTimeZone } from 'next-intl/server';
import { PortalLocaleProvider, PortalThemeProvider } from '@meridian/ui/portal-providers';
import { Toaster } from '@meridian/ui';

import { DistributorShellWrapper } from '@/components/distributor-shell-wrapper';
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
  const timeZone = await getTimeZone();
  const token = await getToken();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <PortalLocaleProvider locale={locale} messages={messages} timeZone={timeZone}>
          <PortalThemeProvider storageKey="meridian-theme-distributor">
            {token ? <DistributorShellWrapper>{children}</DistributorShellWrapper> : children}
            <Toaster />
          </PortalThemeProvider>
        </PortalLocaleProvider>
      </body>
    </html>
  );
}
