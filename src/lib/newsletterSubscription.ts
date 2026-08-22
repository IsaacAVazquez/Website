const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const subscriptionAttempts = new Map<string, RateLimitEntry>();

export function normalizeSubscriberEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return null;
  return EMAIL_PATTERN.test(email) ? email : null;
}

export function checkNewsletterSubscriptionRateLimit(
  identifier: string,
  now = Date.now()
): { success: boolean; retryAfterSeconds: number } {
  for (const [key, entry] of subscriptionAttempts) {
    if (entry.resetAt <= now) subscriptionAttempts.delete(key);
  }

  const current = subscriptionAttempts.get(identifier);
  if (!current || current.resetAt <= now) {
    subscriptionAttempts.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { success: true, retryAfterSeconds: 0 };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      success: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((current.resetAt - now) / 1000)
      ),
    };
  }

  current.count += 1;
  return { success: true, retryAfterSeconds: 0 };
}

export function resetNewsletterSubscriptionRateLimitForTests(): void {
  subscriptionAttempts.clear();
}
