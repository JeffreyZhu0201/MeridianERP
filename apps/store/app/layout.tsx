import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
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
  const headerList = await headers();
  const isEmbedPreview = headerList.get('x-embed-preview') === '1';

  return (
    <html
      lang={locale}
      className={isEmbedPreview ? 'dark' : undefined}
      suppressHydrationWarning
      data-portal="store"
    >
      <body className={`${inter.variable} min-h-screen bg-background font-sans antialiased`}>
        <PortalLocaleProvider locale={locale} messages={messages} timeZone={timeZone}>
          <PortalThemeProvider
            storageKey="meridian-theme-store"
            forcedTheme={isEmbedPreview ? 'dark' : undefined}
          >
            {children}
            <Toaster />
          </PortalThemeProvider>
        </PortalLocaleProvider>
      </body>
    </html>
  );
}
