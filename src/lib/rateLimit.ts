import { BlockList, isIP } from "node:net";
import { NextRequest } from "next/server";

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max number of unique tokens per interval
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

function createRateLimiter({ interval, uniqueTokenPerInterval: limit }: RateLimitConfig) {
  const store = new Map<string, { count: number; resetTime: number }>();
  return {
    check(identifier: string): RateLimitResult {
      const now = Date.now();
      for (const [key, entry] of store) if (entry.resetTime < now) store.delete(key);
      const entry = store.get(identifier) ?? { count: 0, resetTime: now + interval };
      store.set(identifier, entry);
      if (entry.count >= limit) {
        return { success: false, limit, remaining: 0, reset: entry.resetTime };
      }
      entry.count += 1;
      return { success: true, limit, remaining: limit - entry.count, reset: entry.resetTime };
    },
    reset(): void {
      store.clear();
    },
  };
}

// Public market-data fan-out is materially more expensive than ordinary API
// reads. Keep this separate so unrelated endpoints do not expand the quote
// allowance. The source migration should add a shared edge/provider quota;
// this is the local process guard.
export const investmentsQuoteRateLimiter = createRateLimiter({
  interval: 60 * 1000,
  // Seven 25-symbol batches cover the entire 151-symbol curated universe once.
  uniqueTokenPerInterval: 7,
});

export const fantasyRateLimiter = createRateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 10 // 10 requests per minute for fantasy data
});

// The jobs page issues one uncached fetch per company checkbox toggle plus
// mount/focus refreshes, so a real user can legitimately burst well past a
// handful of requests per minute. 30/min stays comfortably above that while
// still capping abusive fan-out (each uncached request hits ~30 boards).
export const mbaJobsRateLimiter = createRateLimiter({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 30,
});

// Signing up is a one-time action, so a handful of attempts an hour covers a
// typo and a retry while capping automated fan-out at the form.
export const newsletterRateLimiter = createRateLimiter({
  interval: 60 * 60 * 1000,
  uniqueTokenPerInterval: 5,
});

// Cloudflare's published ranges (cloudflare.com/ips-v4 and /ips-v6, read
// 2026-11-16).
// ponytail: a static list. A range Cloudflare adds later falls back to the
// shared peer bucket until it is added here.
const CLOUDFLARE_PEERS = new BlockList();
for (const cidr of [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32",
]) {
  const [network, prefix] = cidr.split("/");
  CLOUDFLARE_PEERS.addSubnet(network, Number(prefix), network.includes(":") ? "ipv6" : "ipv4");
}

/**
 * Resolve the client IP for rate-limiting.
 *
 * Prefers `x-nf-client-connection-ip`, which Netlify sets from the real TCP
 * peer and a client cannot forge. The custom domain is proxied by Cloudflare,
 * so that peer is a Cloudflare address many visitors share; only then is
 * `cf-connecting-ip`, which Cloudflare sets to the visitor, used instead. A
 * client that reaches the Netlify origin directly is not a Cloudflare peer, so
 * a `cf-connecting-ip` it sends is ignored. `x-forwarded-for` / `x-real-ip`
 * are only used as a fallback for non-Netlify/local runs; note the leftmost
 * `x-forwarded-for` entry is client-supplied and spoofable, so it is
 * intentionally the last resort. Returns "unknown" when nothing is available
 * (a single shared bucket).
 */
function resolveClientIp(
  getHeader: (name: string) => string | null | undefined
): string {
  const netlifyIp = getHeader("x-nf-client-connection-ip");
  if (netlifyIp) {
    const peer = netlifyIp.trim();
    const family = isIP(peer);
    if (family && CLOUDFLARE_PEERS.check(peer, family === 6 ? "ipv6" : "ipv4")) {
      const visitor = getHeader("cf-connecting-ip")?.trim();
      if (visitor && isIP(visitor)) return visitor;
    }
    return peer;
  }

  const realIp = getHeader("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const forwarded = getHeader("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export function getClientIp(request: NextRequest): string {
  return resolveClientIp((name) => request.headers.get(name));
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

// Helper function to create rate limit response.
//
// `message` is surfaced to the reader on endpoints a person submits directly
// (the newsletter form reads it straight out of the body), so those pass their
// own wording rather than the machine-facing default.
export function rateLimitResponse(
  result: RateLimitResult,
  message = "Rate limit exceeded. Please try again later."
) {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message,
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
