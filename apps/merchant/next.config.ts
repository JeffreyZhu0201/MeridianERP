import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  transpilePackages: ['@meridian/ui', '@meridian/shared'],
  output: 'standalone',
};

export default withNextIntl(nextConfig);
