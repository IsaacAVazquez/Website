/**
 * Consistent logging across the app. Warn is development-only to keep
 * production output to real failures; error always logs.
 */
const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = {
  warn(message: string, data?: unknown): void {
    if (isDevelopment) console.warn(`[WARN] ${message}`, data ? data : "");
  },
  error(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`, error ? error : "");
  },
};
