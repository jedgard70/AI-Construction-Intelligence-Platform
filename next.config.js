/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['recharts', 'victory-vendor', 'es-toolkit'],
  turbopack: {
    // Turbopack cannot resolve es-toolkit's wildcard exports map (./compat/*)
    // so we alias each subpath directly to its CJS file.
    resolveAlias: Object.fromEntries(
      ['get', 'isPlainObject', 'last', 'maxBy', 'minBy',
       'omit', 'range', 'sortBy', 'sumBy', 'throttle', 'uniqBy']
        .map(fn => [`es-toolkit/compat/${fn}`, `./node_modules/es-toolkit/compat/${fn}.js`])
    ),
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
