import type { Metadata } from 'next';
import { getLocale, getMessages, getTimeZone } from 'next-intl/server';
import { PortalLocaleProvider, PortalThemeProvider } from '@meridian/ui/portal-providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'MeridianERP Merchant',
  description: 'Merchant portal',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const timeZone = await getTimeZone();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <PortalLocaleProvider locale={locale} messages={messages} timeZone={timeZone}>
          <PortalThemeProvider storageKey="meridian-theme-merchant">{children}</PortalThemeProvider>
        </PortalLocaleProvider>
      </body>
    </html>
  );
}
