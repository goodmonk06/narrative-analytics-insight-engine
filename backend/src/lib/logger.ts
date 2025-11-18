import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          colorize: true,
        },
      }
    : undefined,
});

export type Logger = typeof logger;

// Contextual logger factory
export function createLogger(context: string) {
  return logger.child({ context });
}

// Log helpers for common patterns
export const log = {
  info: (msg: string, data?: object) => logger.info(data, msg),
  warn: (msg: string, data?: object) => logger.warn(data, msg),
  error: (msg: string, error?: Error | unknown, data?: object) => {
    if (error instanceof Error) {
      logger.error({ ...data, err: error }, msg);
    } else {
      logger.error({ ...data, error }, msg);
    }
  },
  debug: (msg: string, data?: object) => logger.debug(data, msg),
  trace: (msg: string, data?: object) => logger.trace(data, msg),
};
