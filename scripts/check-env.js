const fs = require('fs');
const path = require('path');

// Try to load .env file if it exists
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  console.warn('⚠️  No .env file found. Using environment variables from system.');
}

// Required environment variables
const requiredVars = [
  'PROWLARR_URL',
  'PROWLARR_API_KEY',
  'TMDB_API_KEY'
];

// Optional environment variables
const optionalVars = [
  'REDIS_URL',
  'NODE_ENV',
  'NEXT_PUBLIC_APP_ENV',
  'REDIS_PASSWORD'
];

console.log('🔍 Checking environment variables...');
console.log('----------------------------------');

// Check required variables
let allGood = true;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.error(`❌ ${varName} is not set`);
    allGood = false;
  } else {
    const displayValue = varName.includes('KEY') || varName.includes('SECRET') || varName.includes('PASSWORD')
      ? `${value.substring(0, 5)}...${value.substring(value.length - 3)}`
      : value;
    console.log(`✅ ${varName.padEnd(20)} = ${displayValue}`);
  }
});

// Check optional variables
if (optionalVars.length > 0) {
  console.log('\n🔧 Optional variables:');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.log(`   ${varName.padEnd(20)} = (not set)`);
    } else {
      const displayValue = varName.includes('KEY') || varName.includes('SECRET') || varName.includes('PASSWORD')
        ? `${value.substring(0, 5)}...${value.substring(value.length - 3)}`
        : value;
      console.log(`   ${varName.padEnd(20)} = ${displayValue}`);
    }
  });
}

// Check Redis connection if REDIS_URL is set, but don't fail the script if it's unavailable
if (process.env.REDIS_URL) {
  try {
    console.log(`🔄 Redis URL configured: ${process.env.REDIS_URL}`);
    console.log('ℹ️  Redis connection check skipped in development mode');
    console.log('   The application will attempt to connect at runtime and use fallbacks if needed');
    
    // In development mode, we don't want to block the app from starting if Redis is unavailable
    // For production, you would want to ensure Redis is available
    if (process.env.NODE_ENV === 'production') {
      try {
        const redis = require('ioredis');
        const redisClient = new redis({
          host: new URL(process.env.REDIS_URL).hostname,
          port: new URL(process.env.REDIS_URL).port || 6379,
          password: process.env.REDIS_PASSWORD,
          connectTimeout: 1000, // Short timeout for check
          retryStrategy: () => null // Disable retries for this check
        });
        
        // Use a timeout to avoid hanging
        const timeout = setTimeout(() => {
          console.warn('⚠️  Redis connection check timed out');
          redisClient.disconnect();
        }, 2000);
        
        redisClient.ping().then(() => {
          clearTimeout(timeout);
          console.log('✅ Redis connection successful');
          redisClient.quit();
        }).catch((err) => {
          clearTimeout(timeout);
          console.warn('⚠️  Redis connection check failed:', err.message);
          console.log('   This is okay in development, the app will use fallbacks');
          redisClient.disconnect();
        });
      } catch (error) {
        console.warn('⚠️  Redis connection check error:', error.message);
      }
    }
  } catch (error) {
    console.warn('⚠️  Error checking Redis:', error.message);
    console.log('   This is okay in development, the app will use fallbacks');
  }
}

console.log('----------------------------------');

if (!allGood) {
  console.error('❌ Some environment checks failed!');
  process.exit(1);
} else {
  console.log('✅ All environment checks passed!');
  console.log('   You can now start the application with `npm run dev`');
}

module.exports = { requiredVars, optionalVars };
