/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Netlify 需要 standalone 输出
  output: 'standalone',
};

module.exports = nextConfig;
