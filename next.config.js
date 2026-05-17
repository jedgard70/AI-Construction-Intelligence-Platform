/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard.html',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
