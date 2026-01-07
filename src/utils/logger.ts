/**
 * Simple Logger Utility
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  namespace: string;
  message: string;
  data?: any;
}

class Logger {
  private namespace: string;
  private level: LogLevel = 'info';

  constructor(namespace: string) {
    this.namespace = namespace;
    this.level = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    if (levels[level] < levels[this.level]) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.namespace}]`;

    if (data) {
      console[level as any](`${prefix} ${message}`, data);
    } else {
      console[level as any](`${prefix} ${message}`);
    }
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }
}

export function createLogger(namespace: string): Logger {
  return new Logger(namespace);
}
