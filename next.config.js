// Load environment variables before anything else
require('dotenv').config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['image.tmdb.org'], // Allow images from TMDb
  },
  // Disable experimental features that might cause permission issues
  experimental: {
    serverComponentsExternalPackages: [],
    outputFileTracingRoot: undefined,
    outputFileTracingExcludes: {
      '*': ['node_modules/**']
    }
  },
  // Disable tracing to avoid permission issues
  tracing: {
    ignoreOutgoingTraceSpans: true
  },
  // Environment variables configuration
  env: {
    // These will be available on both server and client
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV || 'development',
    
    // Server-side only variables (won't be exposed to the client)
    PROWLARR_URL: process.env.PROWLARR_URL,
    PROWLARR_API_KEY: process.env.PROWLARR_API_KEY,
    TMDB_API_KEY: process.env.TMDB_API_KEY,
    REDIS_URL: process.env.REDIS_URL,
    REDIS_FEATURED_CONTENT_TTL: process.env.REDIS_FEATURED_CONTENT_TTL || '3600',
  },
  // Make sure environment variables are available at build time
  publicRuntimeConfig: {
    // Will be available on both server and client
    appEnv: process.env.NODE_ENV || 'development',
  },
  serverRuntimeConfig: {
    // Will only be available on the server side
    prowlarrUrl: process.env.PROWLARR_URL,
    prowlarrApiKey: process.env.PROWLARR_API_KEY,
    tmdbApiKey: process.env.TMDB_API_KEY,
    redisUrl: process.env.REDIS_URL,
    redisFeaturedContentTTL: parseInt(process.env.REDIS_FEATURED_CONTENT_TTL || '3600', 10),
  },
  // Enable webpack to load .env files
  webpack: (config, { isServer }) => {
    // This makes it so that environment variables are loaded at build time
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
};

module.exports = nextConfig;
