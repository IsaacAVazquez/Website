import { NextRequest } from "next/server";

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max number of unique tokens per interval
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  private getKey(identifier: string): string {
    return `rate_limit:${identifier}`;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  check(identifier: string): { success: boolean; limit: number; remaining: number; reset: number } {
    this.cleanupExpired();
    
    const key = this.getKey(identifier);
    const now = Date.now();
    const resetTime = now + this.config.interval;

    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = {
        count: 1,
        resetTime: resetTime
      };
      return {
        success: true,
        limit: this.config.uniqueTokenPerInterval,
        remaining: this.config.uniqueTokenPerInterval - 1,
        reset: resetTime
      };
    }

    if (this.store[key].count >= this.config.uniqueTokenPerInterval) {
      return {
        success: false,
        limit: this.config.uniqueTokenPerInterval,
        remaining: 0,
        reset: this.store[key].resetTime
      };
    }

    this.store[key].count++;
    return {
      success: true,
      limit: this.config.uniqueTokenPerInterval,
      remaining: this.config.uniqueTokenPerInterval - this.store[key].count,
      reset: this.store[key].resetTime
    };
  }

  reset(): void {
    this.store = {};
  }
}

// Create rate limiters for different endpoints
export const apiRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 30 // 30 requests per minute
});

export const authRateLimiter = new RateLimiter({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 5 // 5 attempts per 15 minutes
});

export const fantasyRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 10 // 10 requests per minute for fantasy data
});

// The jobs page issues one uncached fetch per company checkbox toggle plus
// mount/focus refreshes, so a real user can legitimately burst well past a
// handful of requests per minute. 30/min stays comfortably above that while
// still capping abusive fan-out (each uncached request hits ~30 boards).
export const mbaJobsRateLimiter = new RateLimiter({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 30,
});

export const emailDigestRateLimiter = new RateLimiter({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 3 // 3 email sends per client per hour
});

/**
 * Resolve the client IP for rate-limiting.
 *
 * Prefers `x-nf-client-connection-ip`, which Netlify sets from the real TCP
 * peer and a client cannot forge. `x-forwarded-for` / `x-real-ip` are only used
 * as a fallback for non-Netlify/local runs; note the leftmost `x-forwarded-for`
 * entry is client-supplied and spoofable, so it is intentionally the last
 * resort. Returns "unknown" when nothing is available (a single shared bucket).
 */
export function getClientIp(request: NextRequest): string {
  const netlifyIp = request.headers.get("x-nf-client-connection-ip");
  if (netlifyIp) {
    return netlifyIp.trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

// Helper function to get client identifier.
//
// NOTE: this appends the User-Agent, which a client controls — so it is only
// suitable for coarse, non-security-critical throttling (a client can multiply
// its allowance by rotating the UA). For endpoints where the limit is a real
// abuse control (e.g. sending email), use `getClientIp` instead so the bucket
// is keyed on identity the client cannot trivially rotate.
export function getClientIdentifier(request: NextRequest): string {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  return `${ip}:${userAgent}`;
}

// Helper function to create rate limit response
export function rateLimitResponse(result: ReturnType<RateLimiter["check"]>) {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
        "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
        "Cache-Control": "no-store",
      }
    }
  );
}
