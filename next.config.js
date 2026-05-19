/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  async redirects() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const dest = supabaseUrl ? '/login' : '/dashboard.html'
    return [
      { source: '/', destination: dest, permanent: false },
      // Also redirect /login to dashboard in demo mode
      ...(supabaseUrl ? [] : [{ source: '/login', destination: '/dashboard.html', permanent: false }]),
    ]
  },
}

module.exports = nextConfig
