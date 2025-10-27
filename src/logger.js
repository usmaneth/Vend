import pino from 'pino';
import { config } from './config.js';

/**
 * Configured logger instance using Pino
 * Provides structured logging for the application
 */
export const logger = pino({
  level: config.logLevel,
  transport: config.nodeEnv === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        }
      }
    : undefined,
});
