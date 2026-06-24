import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@meridian/ui', '@meridian/shared'],
  output: 'standalone',
};

export default nextConfig;
