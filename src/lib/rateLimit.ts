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

// Helper function to get client identifier
export function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";
  
  // You could also use a combination of IP + User-Agent for more granular control
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
        "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString()
      }
    }
  );
}