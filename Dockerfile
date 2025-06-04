# Build stage
FROM node:20-alpine AS builder

# Build arguments
ARG PROWLARR_URL
ARG PROWLARR_API_KEY
ARG TMDB_API_KEY
ARG MONGODB_URI

# Set environment variables
ENV PROWLARR_URL=$PROWLARR_URL
ENV PROWLARR_API_KEY=$PROWLARR_API_KEY
ENV TMDB_API_KEY=$TMDB_API_KEY
ENV MONGODB_URI=$MONGODB_URI

WORKDIR /app

# Install build dependencies
# RUN apk add --no-cache git python3 make g++ # Confirmed not needed by build test

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies
RUN npm ci --include=dev

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Build arguments needed at runtime
ARG PROWLARR_URL
ARG PROWLARR_API_KEY
ARG TMDB_API_KEY
ARG MONGODB_URI

# Set environment variables for runtime
ENV PROWLARR_URL=$PROWLARR_URL
ENV PROWLARR_API_KEY=$PROWLARR_API_KEY
ENV TMDB_API_KEY=$TMDB_API_KEY
ENV MONGODB_URI=$MONGODB_URI

# Install runtime dependencies
RUN apk add --no-cache tini

# Copy built application from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/scripts ./scripts

# Install only production dependencies (prunes devDependencies from copied node_modules)
RUN npm ci --only=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node scripts/healthcheck.js

# Expose the port the app will run on
EXPOSE 3000

# Use tini as init process
ENTRYPOINT ["/sbin/tini", "--"]

# Command to run the application
CMD ["npm", "start"]
