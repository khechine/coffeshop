/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@coffeeshop/shared", "@coffeeshop/database"],
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
