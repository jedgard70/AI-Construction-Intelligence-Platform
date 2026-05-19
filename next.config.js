/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['recharts', 'victory-vendor', 'es-toolkit'],
  turbopack: {
    // Turbopack cannot resolve es-toolkit's wildcard exports map (./compat/*)
    // so we alias each subpath directly to its CJS file.
    // react-is is aliased explicitly because Turbopack fails to resolve it
    // when imported from within transpilePackages (recharts/es6/...).
    resolveAlias: {
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
