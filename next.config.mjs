/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Enable the instrumentation.ts hook that validates env vars at startup
  experimental: {
    instrumentationHook: true,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
