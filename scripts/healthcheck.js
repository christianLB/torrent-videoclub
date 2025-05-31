const http = require('http');
const Redis = require('ioredis');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

const checkApp = () => new Promise((resolve) => {
  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('Application is healthy');
      resolve(true);
    } else {
      console.error(`Health check failed with status code: ${res.statusCode}`);
      resolve(false);
    }
  });

  req.on('error', (error) => {
    console.error('Health check error:', error.message);
    resolve(false);
  });

  req.on('timeout', () => {
    console.error('Health check timed out');
    req.destroy();
    resolve(false);
  });

  req.end();
});

const checkRedis = () => new Promise((resolve) => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redis = new Redis(redisUrl, { 
    maxRetriesPerRequest: 1, 
    connectTimeout: 3000, // 3 seconds connection timeout
    lazyConnect: true // Explicitly connect
  });

  redis.connect().then(() => {
    redis.ping((err, result) => {
      if (err) {
        console.error('Redis ping failed:', err.message);
        redis.quit();
        resolve(false);
      } else if (result === 'PONG') {
        console.log('Redis is healthy');
        redis.quit();
        resolve(true);
      } else {
        console.error('Unexpected Redis response:', result);
        redis.quit();
        resolve(false);
      }
    });
  }).catch(connectError => {
    console.error('Failed to connect to Redis:', connectError.message);
    // No need to call quit() if connect() itself failed and lazyConnect was used
    // as the connection might not have been established.
    // If redis.status is 'connecting' or 'reconnecting', quit() might be appropriate.
    if (redis.status !== 'end') {
        redis.disconnect(); // Use disconnect for lazyConnect if connect fails
    }
    resolve(false);
  });

  // Handle explicit connection errors for the client itself, not just ping
  redis.on('error', (error) => {
    // This listener catches errors like ECONNREFUSED that occur after initial connection attempt
    // or during operations if not caught by specific command callbacks.
    // console.error('Redis client error:', error.message); // Potentially noisy, already handled by connect().catch
    // No resolve(false) here as it might be called multiple times or after already resolved.
    // The connect().catch() and ping callback should be the primary resolvers.
  });
});

// Run health checks
Promise.all([checkApp(), checkRedis()])
  .then(([appHealthy, redisHealthy]) => {
    if (appHealthy && redisHealthy) {
      process.exit(0); // Exit with success code
    } else {
      process.exit(1); // Exit with error code
    }
  })
  .catch((error) => {
    console.error('Health check error:', error);
    process.exit(1);
  });
