/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['mnfzmxiaunjnzasrdjik.supabase.co', 'avatars.githubusercontent.com'],
  },
  // Required for Socket.IO custom server
  webpack: (config) => {
    config.externals.push({ bufferutil: 'bufferutil', 'utf-8-validate': 'utf-8-validate' })
    return config
  },
}

module.exports = nextConfig
