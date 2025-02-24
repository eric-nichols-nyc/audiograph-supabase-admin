/** @type {import('next').NextConfig} */
const nextConfig = {
  // Specify that we're using App Router only
  experimental: {
    appDir: true,
  },
  // Disable Pages Router
  pageExtensions: ['tsx', 'ts'],
  images: {
    domains: ['i.scdn.co'],
  },
}

module.exports = nextConfig 