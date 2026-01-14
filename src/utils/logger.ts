/**
 * Environment-aware logging utility.
 * Suppresses logs in production to prevent information leakage.
 */

import { ENABLE_LOGGING, ENV } from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Determines if a log at the given level should be output.
 * In production, only errors are logged.
 */
function shouldLog(level: LogLevel): boolean {
  if (!ENABLE_LOGGING) {
    // In production, only log errors
    return level === 'error';
  }
  return true;
}

/**
 * Format a log message with timestamp and level.
 */
function formatMessage(level: LogLevel, prefix: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${prefix}] ${message}`;
}

/**
 * Create a namespaced logger instance.
 * @param namespace - Prefix for all log messages (e.g., 'API', 'Storage')
 */
export function createLogger(namespace: string) {
  return {
    /**
     * Debug-level logging. Only in development.
     */
    debug: (message: string, ...args: unknown[]) => {
      if (shouldLog('debug')) {
        console.log(formatMessage('debug', namespace, message), ...args);
      }
    },

    /**
     * Info-level logging. Development and staging only.
     */
    info: (message: string, ...args: unknown[]) => {
      if (shouldLog('info')) {
        console.log(formatMessage('info', namespace, message), ...args);
      }
    },

    /**
     * Warning-level logging. Development and staging only.
     */
    warn: (message: string, ...args: unknown[]) => {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', namespace, message), ...args);
      }
    },

    /**
     * Error-level logging. Always logged.
     */
    error: (message: string, ...args: unknown[]) => {
      if (shouldLog('error')) {
        console.error(formatMessage('error', namespace, message), ...args);
      }
    },
  };
}

// Pre-created loggers for common modules
export const apiLogger = createLogger('API');
export const storageLogger = createLogger('Storage');
export const readerLogger = createLogger('ReaderMode');
export const themeLogger = createLogger('Theme');
export const linksLogger = createLogger('Links');

/**
 * Default logger for general use.
 */
export const logger = createLogger('App');

/**
 * Get the current environment for debugging.
 */
export function getEnvironmentInfo(): string {
  return `Environment: ${ENV}, Logging: ${ENABLE_LOGGING ? 'enabled' : 'disabled'}`;
}
