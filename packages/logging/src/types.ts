export type LogLevel = 'debug' | 'error' | 'info' | 'trace' | 'warn';

export type LogFn = {
  /**
   * Log details with optional message
   */
  <T extends object>(detail: T, msg?: string): void;

  /**
   * Log simple message
   */
  (msg: string): void;
};

export type Logger = Record<LogLevel, LogFn>;

export type LoggerOptions = {
  /**
   * Logging level
   */
  level?: LogLevel;

  /**
   * List of paths within details to redact from log output.
   * values matching the paths are replaced with [Redacted]
   */
  redact?: string[];
};
