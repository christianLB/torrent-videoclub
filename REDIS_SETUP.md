# Redis Caching Setup for Torrent VideoClub

This document provides instructions for setting up and configuring Redis caching for the Torrent VideoClub application.

## Overview

Torrent VideoClub uses Redis as the single source of truth for caching featured content and other frequently accessed data. Redis is used exclusively on the server-side to avoid any client-side module resolution issues.

## Required Environment Variables

Add the following variables to your `.env.local` file:

```
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_FEATURED_CONTENT_TTL=86400  # 24 hours in seconds
```

## Redis Installation

### For Development

#### Windows
1. Download and install Redis for Windows from [https://github.com/microsoftarchive/redis/releases](https://github.com/microsoftarchive/redis/releases)
2. Start Redis server using: `redis-server`

#### Mac
1. Install using Homebrew: `brew install redis`
2. Start Redis server: `brew services start redis`

#### Linux
1. Install using apt: `sudo apt install redis-server`
2. Start Redis server: `sudo systemctl start redis-server`

### For Production

For production environments, we recommend using a managed Redis service like:
- Redis Cloud
- AWS ElastiCache for Redis
- Azure Cache for Redis
- Google Cloud Memorystore for Redis

## Cache Management

The application provides a built-in cache management UI at `/admin/cache`. From this interface, you can:

1. Check Redis connection status
2. Refresh the featured content cache
3. Clear all caches

## Cache Structure

The Redis cache uses the following key patterns:

- `featured:content` - The main featured content including categories
- `featured:category:{categoryId}` - Individual category data

## Redis Service

The application uses a dedicated `RedisService` for all Redis operations, ensuring Redis is only used in server-side contexts. The service is implemented in `lib/services/server/redis-service.ts`.

## Automatic Cache Refreshing

The cache is automatically refreshed in the background via API routes. This ensures that users always see relatively fresh data without waiting for cache misses.

## TTL Configuration

- The default TTL for featured content is 24 hours (86400 seconds)
- You can adjust this value using the `REDIS_FEATURED_CONTENT_TTL` environment variable

## Troubleshooting

### Common Issues

1. **Redis Connection Failures**
   - Ensure Redis is running on the configured host and port
   - Check that the REDIS_URL is correct in your environment variables

2. **Module Resolution Errors**
   - If you see errors about `ioredis` not being found, ensure you're only using Redis in server-side contexts

3. **Cache Not Refreshing**
   - Verify Redis connection status in the admin panel
   - Check server logs for any Redis operation errors
