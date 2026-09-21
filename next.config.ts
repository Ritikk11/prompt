import type {NextConfig} from 'next';
import { existsSync, readFileSync } from 'node:fs';

function loadCloudflarePublicEnv() {
  const configPath = './wrangler.jsonc';
  if (!existsSync(configPath)) return;

  try {
    const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
      vars?: Record<string, string>;
    };

    Object.entries(config.vars || {}).forEach(([key, value]) => {
      if (key.startsWith('NEXT_PUBLIC_') && !process.env[key]) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    console.warn('Unable to load public env vars from wrangler.jsonc:', error);
  }
}

loadCloudflarePublicEnv();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Hide the floating Next.js dev-tools badge; it overlaps admin UI on phones.
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    webpackBuildWorker: false,
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
    // NOTE: do not enable experimental.inlineCss here — it embeds the CSS into
    // every prerendered page inside the worker bundle, which blows past the
    // Cloudflare free-plan 3 MiB Worker size limit and fails deploy.
  },
  turbopack: {},
  // Allow access to remote image placeholder.
  images: {
    // On Cloudflare/OpenNext, proxying every remote image through /_next/image can
    // make large galleries crawl. Public uploads are already CDN-hosted, so serve
    // them directly from Supabase or Cloudflare instead of the Worker optimizer.
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uploads.aipromptmatrix.in',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'uploads.promptsoul.in',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'promptsoul.in',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fcmmcgyqovqbxbqfeaho.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  transpilePackages: ['motion'],
  async redirects() {
    return [
      // Legacy structure: prompt posts used to live at /explore/:slug. Those URLs
      // are still indexed (ranking pages that now 404) and split signals with the
      // canonical /:slug routes, so fold them together permanently.
      { source: '/explore/:slug', destination: '/:slug', permanent: true },
      // Canonical lowercase tool URLs to prevent duplicate indexing
      { source: '/tool/ChatGPT', destination: '/tool/chatgpt', permanent: true },
      { source: '/tool/Gemini', destination: '/tool/gemini', permanent: true },
    ];
  },
  async headers() {
    // Security headers applied to every route. Kept minimal + safe: no CSP here
    // (would need per-origin allowlisting for gtag/adsense/supabase and risks
    // breaking third-party embeds). HSTS + framing/MIME/referrer hardening only.
    const securityHeaders = [
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];

    // Edge CDN Caching headers for public HTML routes (s-maxage=86400 for 24h Edge cache,
    // stale-while-revalidate=604800 for 7-day background revalidation).
    const publicCacheHeader = {
      key: 'Cache-Control',
      value: 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
    };

    const publicRoutes = [
      '/',
      '/explore',
      '/tool/:path*',
      '/tag/:path*',
      '/section/:path*',
      '/guides/:path*',
      '/blog/:path*',
      '/:slug([a-zA-Z0-9_-]+)',
    ];

    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      ...publicRoutes.map((route) => ({
        source: route,
        headers: [publicCacheHeader],
      })),
    ];
  },
  webpack: (config, {dev}) => {
    // Some hosted editors disable file watching to avoid dev-server flicker.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
