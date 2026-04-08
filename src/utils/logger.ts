import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Create child loggers for different modules
export const apiLogger = logger.child({ module: 'api' });
export const scraperLogger = logger.child({ module: 'scraper' });
export const aiLogger = logger.child({ module: 'ai' });
export const dbLogger = logger.child({ module: 'database' });
export const serviceLogger = logger.child({ module: 'service' });
