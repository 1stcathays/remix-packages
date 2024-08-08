import type { LoggerOptions } from 'pino';
import logger from 'pino';

export function createLogger(options?: Partial<LoggerOptions>) {
  return logger({
    level: 'info',
    redact: ['headers.Authorization'],
    ...options,
  });
}
