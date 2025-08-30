import type { Logger } from './registry/types';

export const createLogger = (prefix: string): Logger => {
  const formatMessage = (level: string, message: string) => {
    return `[${new Date().toISOString()}] [${prefix}] [${level}] ${message}`;
  };

  return {
    debug: (message: string, ...args: any[]) => {
      console.debug(formatMessage('DEBUG', message), ...args);
    },
    info: (message: string, ...args: any[]) => {
      console.info(formatMessage('INFO', message), ...args);
    },
    warn: (message: string, ...args: any[]) => {
      console.warn(formatMessage('WARN', message), ...args);
    },
    error: (message: string, ...args: any[]) => {
      console.error(formatMessage('ERROR', message), ...args);
    },
  };
};
