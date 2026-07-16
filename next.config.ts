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
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    webpackBuildWorker: false,
    // Inline the (~25KB) global stylesheet into the HTML instead of loading it
    // as a separate render-blocking request — removes ~340ms from the mobile
    // critical rendering path (PSI "render blocking requests").
    inlineCss: true,
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
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        port: '',
        pathname: '/**',
      }
    ],
  },
  transpilePackages: ['motion'],
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
