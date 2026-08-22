/**
 * Consistent logging across the app. Info/warn/debug are development-only to
 * keep production output to real failures; error always logs.
 */
const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = {
  info(message: string, data?: unknown): void {
    if (isDevelopment) console.log(`[INFO] ${message}`, data ? data : "");
  },
  warn(message: string, data?: unknown): void {
    if (isDevelopment) console.warn(`[WARN] ${message}`, data ? data : "");
  },
  debug(message: string, data?: unknown): void {
    if (isDevelopment) console.debug(`[DEBUG] ${message}`, data ? data : "");
  },
  error(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`, error ? error : "");
  },
};
