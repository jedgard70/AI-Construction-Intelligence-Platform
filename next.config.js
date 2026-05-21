/** @type {import('next').NextConfig} */
// v7.1 — autonomous brain active
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['es-toolkit'],
  turbopack: {
    resolveAlias: {
      // Force recharts to its CJS build so Turbopack never touches the ES6
      // modules that pull in react-is via a static ESM import it can't resolve.
      'recharts': './node_modules/recharts/lib/index.js',
      // Explicit alias for react-is as a safety net for any remaining ESM path.
      'react-is': './node_modules/react-is/index.js',
      // es-toolkit subpath aliases (no wildcard exports map support in Turbopack)
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
