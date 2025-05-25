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
}

module.exports = nextConfig
