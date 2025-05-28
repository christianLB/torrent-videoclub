const http = require('http');
const { exec } = require('child_process');

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
  exec('redis-cli ping', (error, stdout) => {
    if (error) {
      console.error('Redis check failed:', error.message);
      resolve(false);
    } else if (stdout.trim() === 'PONG') {
      console.log('Redis is healthy');
      resolve(true);
    } else {
      console.error('Unexpected Redis response:', stdout);
      resolve(false);
    }
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
