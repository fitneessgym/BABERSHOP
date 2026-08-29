/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['*.e2b.app', '*.arena.ai', 'localhost:3000'],
  images: { unoptimized: true },
};
export default nextConfig;
