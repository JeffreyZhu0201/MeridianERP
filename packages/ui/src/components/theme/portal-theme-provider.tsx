'use client';

import { ThemeProvider } from '@meridian/ui';

export function PortalThemeProvider({
  storageKey,
  children,
}: {
  storageKey: string;
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey={storageKey}
    >
      {children}
    </ThemeProvider>
  );
}
