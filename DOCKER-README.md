# Docker Setup Guide

This guide will help you set up the Torrent VideoClub application using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- Required environment variables (see [Environment Variables](#environment-variables))

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/torrent-videoclub.git
   cd torrent-videoclub
   ```

2. Copy the example environment file and update it with your configuration:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Build and start the services:
   ```bash
   docker-compose up --build -d
   ```

4. Access the application at http://localhost:3000

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development

# Redis
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=your-secure-password

# Prowlarr
PROWLARR_URL=http://your-prowlarr-instance:9696
PROWLARR_API_KEY=your-prowlarr-api-key

# TMDb
TMDB_API_KEY=your-tmdb-api-key
```

## Available Services

- **Web Application**: http://localhost:3000
- **Redis Commander** (if enabled): http://localhost:8081

## Development

For development, you can mount your local source code into the container:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## Production

For production, make sure to:

1. Set `NODE_ENV=production`
2. Update all API keys and secrets
3. Configure proper SSL/TLS
4. Set up proper monitoring and logging

## Troubleshooting

### View Logs

```bash
docker-compose logs -f
```

### Run Commands in Container

```bash
docker-compose exec app sh
```

### Reset Database

To reset the Redis database:

```bash
docker-compose down -v
```

## License

[Your License Here]
