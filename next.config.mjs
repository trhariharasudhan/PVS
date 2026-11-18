/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Retail stock pages were retired: PVS weaves to order. Old links land on the right place.
  async redirects() {
    return [
      { source: '/shop', destination: '/custom-order', permanent: true },
      { source: '/shop/:path*', destination: '/custom-order', permanent: true },
      { source: '/cart', destination: '/custom-order', permanent: true },
      { source: '/checkout', destination: '/custom-order', permanent: true },
      { source: '/collections', destination: '/what-we-weave', permanent: true },
      { source: '/collections/:path*', destination: '/what-we-weave', permanent: true },
      { source: '/gallery', destination: '/our-craft', permanent: true },
      { source: '/manufacturing', destination: '/our-craft', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
