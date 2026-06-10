import type {NextConfig} from 'next';

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
  },
  turbopack: {},
  // Allow access to remote image placeholder.
  images: {
    // On Cloudflare/OpenNext, proxying every remote image through /_next/image can
    // make large galleries crawl. Public uploads are already CDN-hosted, so serve
    // them directly from Supabase/Cloudinary/ImgBB instead of the Worker optimizer.
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
