import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'www.usejuicemobile.com' },
      { protocol: 'https', hostname: 'usejuicemobile.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Surface the static pitch deck under a friendlier URL.
        { source: '/demoday', destination: '/pitch.html' },
        // Working copy of the deck — iterate independently without touching /demoday.
        { source: '/demoday2', destination: '/demoday2/pitch.html' },
        // Next iteration on top of /demoday2 — keep /demoday2 stable.
        { source: '/demoday3', destination: '/demoday3/pitch.html' },
        // Working copy on top of /demoday3 — iterate sem mexer em /demoday3.
        { source: '/demoday4', destination: '/demoday4/pitch.html' },
        // Verbal pitch script — plain-text companion to the deck.
        { source: '/txt', destination: '/PITCH_SCRIPT.txt' },
      ],
    };
  },
  async redirects() {
    return [
      // Alias domains → canonical usejuicemobile.com (preserve path).
      // Also requires each domain to be added to the Vercel project
      // and DNS pointed at Vercel.
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value:
              '(www\\.)?(cnbmobile\\.(com|net|online|xyz|store|app)|cryptoinpocket\\.com)',
          },
        ],
        destination: 'https://www.usejuicemobile.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
