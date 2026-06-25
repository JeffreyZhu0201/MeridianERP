import type { Metadata } from 'next';
import { getLocale, getMessages } from 'next-intl/server';
import { PortalLocaleProvider, PortalThemeProvider } from '@meridian/ui';
import './globals.css';

export const metadata: Metadata = {
  title: 'MeridianERP Admin',
  description: 'Platform administration portal',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <PortalLocaleProvider locale={locale} messages={messages}>
          <PortalThemeProvider storageKey="meridian-theme-admin">{children}</PortalThemeProvider>
        </PortalLocaleProvider>
      </body>
    </html>
  );
}
