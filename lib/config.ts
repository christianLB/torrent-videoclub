// Server-side configuration
type ServerConfig = {
  prowlarr: {
    url: string;
    apiKey: string;
  };
  tmdb: {
    apiKey: string;
  };
  redis: {
    url: string;
    featuredContentTTL: number;
  };
  features: {
    useRealData: boolean;
    useTMDb: boolean;
  };
};

// Debug environment variables
console.log('[Config] Loading server configuration from environment variables', {
  PROWLARR_URL: process.env.PROWLARR_URL ? 'SET' : 'NOT SET',
  PROWLARR_API_KEY: process.env.PROWLARR_API_KEY ? 'SET' : 'NOT SET',
  TMDB_API_KEY: process.env.TMDB_API_KEY ? 'SET' : 'NOT SET',
  REDIS_URL: process.env.REDIS_URL || 'default: redis://localhost:6379'
});

export const serverConfig: ServerConfig = {
  prowlarr: {
    url: process.env.PROWLARR_URL || '',
    apiKey: process.env.PROWLARR_API_KEY || '',
  },
  tmdb: {
    apiKey: process.env.TMDB_API_KEY || '',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    featuredContentTTL: parseInt(process.env.REDIS_FEATURED_CONTENT_TTL || '3600', 10),
  },
  features: {
    useRealData: !!(process.env.PROWLARR_URL && process.env.PROWLARR_API_KEY && process.env.TMDB_API_KEY),
    useTMDb: !!process.env.TMDB_API_KEY,
  },
};

// Debug the computed config
console.log('[Config] Server configuration loaded:', {
  'prowlarr.url': serverConfig.prowlarr.url ? 'SET' : 'NOT SET',
  'prowlarr.apiKey': serverConfig.prowlarr.apiKey ? 'SET' : 'NOT SET',
  'tmdb.apiKey': serverConfig.tmdb.apiKey ? 'SET' : 'NOT SET',
  'features.useRealData': serverConfig.features.useRealData,
  'features.useTMDb': serverConfig.features.useTMDb
});

// Validate required configuration on startup
const validateConfig = () => {
  // Only validate in production or when explicitly enabled
  if (process.env.NODE_ENV === 'test') return;
  
  const requiredVars = [
    { name: 'PROWLARR_URL', value: serverConfig.prowlarr.url },
    { name: 'PROWLARR_API_KEY', value: serverConfig.prowlarr.apiKey },
    { name: 'TMDB_API_KEY', value: serverConfig.tmdb.apiKey },
  ].filter(v => !v.value);

  if (requiredVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    requiredVars.forEach(v => console.error(`  - ${v.name}`));
    
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Fatal: Required environment variables are missing in production');
      process.exit(1);
    }
    
    console.warn('⚠️  Running in development mode with mock data');
  } else {
    console.log('✅ All required environment variables are set');
    console.log(`🌐 Prowlarr URL: ${serverConfig.prowlarr.url ? 'Configured' : 'Not configured'}`);
    console.log(`🔑 TMDb API: ${serverConfig.tmdb.apiKey ? 'Configured' : 'Not configured'}`);
  }
};

// Run validation when the module loads
validateConfig();

export default serverConfig;
