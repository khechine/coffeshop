/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@coffeeshop/shared", "@coffeeshop/database"],
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
