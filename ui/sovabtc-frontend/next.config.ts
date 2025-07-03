import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbo: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  webpack: (config, { dev, isServer }) => {
    // Only apply webpack config in non-turbo mode
    if (!dev) {
      // Handle Node.js modules for client-side
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          crypto: false,
        };
      }

      // Handle SVG imports
      config.module.rules.push({
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      });
    }

    return config;
  },
  images: {
    domains: ['raw.githubusercontent.com'],
  },
  // Environment variables handling
  env: {
    NEXT_PUBLIC_APP_NAME: 'SovaBTC Protocol',
  },
};

export default nextConfig;
