import Constants from 'expo-constants';

/**
 * Environment type for the application.
 * - development: Local development with localhost API
 * - staging: Staging environment for testing
 * - production: Production environment for end users
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Determines the current environment from Expo config extras.
 * Falls back to 'development' if not specified.
 */
function getEnvironment(): Environment {
  const env = Constants.expoConfig?.extra?.environment;
  if (env === 'staging' || env === 'production') {
    return env;
  }
  return 'development';
}

export const ENV: Environment = getEnvironment();

/**
 * Environment-specific configuration values.
 */
type EnvironmentConfig = {
  API_BASE_URL: string;
  ENABLE_DEV_MODE: boolean;
  ENABLE_LOGGING: boolean;
};

const CONFIG: Record<Environment, EnvironmentConfig> = {
  development: {
    API_BASE_URL: 'https://api-staging-7b4d.up.railway.app',
    ENABLE_DEV_MODE: true,
    ENABLE_LOGGING: true,
  },
  staging: {
    API_BASE_URL: 'https://api-staging-7b4d.up.railway.app',
    ENABLE_DEV_MODE: false,
    ENABLE_LOGGING: true,
  },
  production: {
    API_BASE_URL: 'https://api.ntrl.app',
    ENABLE_DEV_MODE: false,
    ENABLE_LOGGING: false,
  },
};

/**
 * The base URL for the NTRL API.
 * Changes based on environment (localhost for dev, staging URL for staging, production URL for prod).
 */
export const API_BASE_URL = CONFIG[ENV].API_BASE_URL;

/**
 * Whether development mode features are enabled.
 * Only true in development environment.
 */
export const ENABLE_DEV_MODE = CONFIG[ENV].ENABLE_DEV_MODE;

/**
 * Whether logging is enabled.
 * Disabled in production to prevent information leakage.
 */
export const ENABLE_LOGGING = CONFIG[ENV].ENABLE_LOGGING;

/**
 * Check if running in production environment.
 */
export const isProduction = ENV === 'production';

/**
 * Check if running in development environment.
 */
export const isDevelopment = ENV === 'development';
