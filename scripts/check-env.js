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
  'NODE_ENV',
  'NEXT_PUBLIC_APP_ENV',
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

console.log('----------------------------------');

if (!allGood) {
  console.error('❌ Some environment checks failed!');
  process.exit(1);
} else {
  console.log('✅ All environment checks passed!');
  console.log('   You can now start the application with `npm run dev`');
}

module.exports = { requiredVars, optionalVars };
