/** @type {import('next').NextConfig} */
const nextConfig = {
  // Base path for production deployment behind nginx proxy
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // Asset prefix for static assets
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // Image configuration to allow external images from backend
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '5000', pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'localhost', port: '5000', pathname: '/api/**' }, // if you ever serve via /api
    ],
  },

  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },

  // TypeScript configuration
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
