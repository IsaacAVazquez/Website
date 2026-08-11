/**
 * Logger utility for consistent logging across the application
 * Respects NODE_ENV to reduce noise in production
 */

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  /**
   * Log info messages (development only)
   */
  info(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data ? data : '');
    }
  }

  /**
   * Log warning messages (development only)
   */
  warn(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data ? data : '');
    }
  }

  /**
   * Log error messages (always logged)
   */
  error(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`, error ? error : '');
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data ? data : '');
    }
  }

}

// Export singleton instance
export const logger = new Logger();