/** @type {import('next').NextConfig} */
const nextConfig = {
  // Specify that we're using App Router only
  experimental: { appDir: true },
  // Disable Pages Router
  pageExtensions: ['tsx', 'ts'],
  images: {
    domains: ['i.scdn.co', 'i.ytimg.com', 'hebbkx1anhila5yf.public.blob.vercel-storage.com'],
  },
  // Make sure you don't have type checking disabled
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Optionally, also ignore ESLint errors
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
