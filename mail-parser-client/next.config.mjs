/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: false,

  webpack(config, { dev }) {
    if (dev && process.env.NEXT_DISABLE_DEV_OVERLAY === 'true') {
      // Remove the error overlay plugin
      config.plugins = config.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ReactRefreshWebpackPlugin'
      )
    }
    return config
  },

}

export default nextConfig
