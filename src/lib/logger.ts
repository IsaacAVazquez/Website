/**
 * Logger utility for consistent logging across the application
 * Respects NODE_ENV to reduce noise in production
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';
  private isDevelopment = process.env.NODE_ENV !== 'production';

  /**
   * Log info messages (development only)
   */
  info(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data ? data : '');
    }
  }

  /**
   * Log warning messages (development only)
   */
  warn(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data ? data : '');
    }
  }

  /**
   * Log error messages (always logged)
   */
  error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}`, error ? error : '');
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data ? data : '');
    }
  }

  /**
   * Log performance metrics (development only)
   */
  performance(label: string, duration: number): void {
    if (this.isDevelopment) {
      console.log(`[PERF] ${label}: ${duration}ms`);
    }
  }

  /**
   * Create a structured log entry
   */
  createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export individual methods for easier imports
export const { info, warn, error, debug, performance } = logger;