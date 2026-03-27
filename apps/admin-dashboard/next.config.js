/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@coffeeshop/shared", "@coffeeshop/database"],
};

module.exports = nextConfig;
