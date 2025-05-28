/**
 * Load and validate environment variables
 * @returns {boolean} True if all required environment variables are present
 */
export function loadEnv(): boolean {
  // Check if required environment variables are present
  const requiredVars = [
    { name: 'PROWLARR_URL', value: process.env.PROWLARR_URL },
    { name: 'PROWLARR_API_KEY', value: process.env.PROWLARR_API_KEY },
    { name: 'TMDB_API_KEY', value: process.env.TMDB_API_KEY },
  ] as const;

  const missingVars = requiredVars
    .filter(({ value }) => !value)
    .map(({ name }) => name);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    return false;
  }

  console.log('[Env] All required environment variables are present');
  return true;
}

// Immediately load and validate environment variables when this module is imported
const envLoaded = loadEnv();

/**
 * Ensure that environment variables are loaded and valid
 * @throws {Error} If environment variables are not properly loaded
 * @returns {boolean} True if environment variables are valid
 */
export function ensureEnvLoaded(): boolean {
  if (!envLoaded) {
    const error = new Error('Environment variables not properly loaded');
    console.error(error.message);
    throw error;
  }
  return true;
}

/**
 * Get an environment variable value
 * @param key The environment variable key
 * @returns The environment variable value or undefined if not found
 */
export function getEnv(key: string): string | undefined {
  return process.env[key];
}
