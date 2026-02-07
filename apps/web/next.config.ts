import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@medplus/db', '@medplus/scheduling', '@medplus/documents'],
};

export default nextConfig;
