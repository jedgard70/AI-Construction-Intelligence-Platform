/** @type {import('next').NextConfig} */
// v7.1 — autonomous brain active — deployed via GitHub API
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['es-toolkit'],
  turbopack: {
    resolveAlias: {
      'recharts': './node_modules/recharts/lib/index.js',
      'react-is': './node_modules/react-is/index.js',
      ...Object.fromEntries(
        ['get', 'isPlainObject', 'last', 'maxBy', 'minBy',
         'omit', 'range', 'sortBy', 'sumBy', 'throttle', 'uniqBy']
          .map(fn => [`es-toolkit/compat/${fn}`, `./node_modules/es-toolkit/compat/${fn}.js`])
      ),
    },
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
