/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'framer-motion', 'recharts'],
  },
  // Reduce bundle size by excluding unnecessary modules
  swcMinify: true,
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};
export default nextConfig;