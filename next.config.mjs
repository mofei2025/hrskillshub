import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['geoip-lite'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.aliyuncs.com' },
      { protocol: 'http', hostname: '*.aliyuncs.com' },
      { protocol: 'https', hostname: '*.githubusercontent.com' },
    ],
  },
}

export default withNextIntl(nextConfig)
