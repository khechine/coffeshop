/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@coffeeshop/shared", "@coffeeshop/database"],
  output: 'standalone',
};
 bitumen

module.exports = nextConfig;
