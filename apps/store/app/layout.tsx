import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getLocale, getMessages, getTimeZone } from 'next-intl/server';
import { PortalLocaleProvider, PortalThemeProvider } from '@meridian/ui/portal-providers';
import { Toaster } from '@meridian/ui';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-store-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MeridianERP Store',
  description: 'Consumer storefront',
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
    <html lang={locale} suppressHydrationWarning data-portal="store">
      <body
        className={`${inter.variable} min-h-screen bg-background font-sans antialiased`}
        data-portal="store"
      >
        <PortalLocaleProvider locale={locale} messages={messages} timeZone={timeZone}>
          <PortalThemeProvider storageKey="meridian-theme-store">
            {children}
            <Toaster />
          </PortalThemeProvider>
        </PortalLocaleProvider>
      </body>
    </html>
  );
}
