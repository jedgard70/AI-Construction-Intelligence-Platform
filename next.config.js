const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['recharts', 'victory-vendor', 'es-toolkit'],
  webpack(config) {
    // Webpack cannot resolve es-toolkit's wildcard exports map (./compat/*)
    // at build time, so we alias each subpath directly to its CJS file.
    const esToolkitSubpaths = [
      'get', 'isPlainObject', 'last', 'maxBy', 'minBy',
      'omit', 'range', 'sortBy', 'sumBy', 'throttle', 'uniqBy',
    ]
    esToolkitSubpaths.forEach(fn => {
      config.resolve.alias[`es-toolkit/compat/${fn}`] =
        path.resolve(__dirname, `node_modules/es-toolkit/compat/${fn}.js`)
    })
    return config
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
