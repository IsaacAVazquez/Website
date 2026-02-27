/**
 * Authenticated Yahoo Finance client
 *
 * Yahoo Finance requires a crumb token (obtained via cookie handshake)
 * for programmatic API access. This module handles:
 * 1. Fetching and caching the crumb + cookie pair
 * 2. Making authenticated requests with automatic timeout
 *
 * If auth fails (rate-limited, network error, etc.), requests fall back to
 * unauthenticated mode — chart endpoints may still work, quoteSummary won't.
 */

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// In-memory cache for crumb + cookie
let authCache: { crumb: string; cookie: string; expiry: number } | null = null;

// Negative cache: avoid hammering Yahoo if auth keeps failing
let authFailedUntil = 0;

// Rate limit tracking: stop all requests when Yahoo returns 429
let rateLimitedUntil = 0;
let consecutive429s = 0;

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const FAIL_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes backoff on failure
const BASE_RATE_LIMIT_MS = 60 * 1000; // 1 minute base backoff on 429
const MAX_RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minute max backoff
const AUTH_TIMEOUT_MS = 5_000; // 5s timeout for each auth request

/** Check if Yahoo Finance requests are currently rate-limited */
export function isRateLimited(): boolean {
  return Date.now() < rateLimitedUntil;
}

/** Validate a stock ticker symbol format */
export function isValidSymbol(symbol: string): boolean {
  return /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/.test(symbol);
}

/** Fetch with a timeout via AbortController */
function fetchWithTimeout(
  url: string,
  opts: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() =>
    clearTimeout(timeoutId)
  );
}

/** Extract a cookie string from a Set-Cookie header value */
function parseCookieHeader(setCookieHeader: string): string {
  return setCookieHeader
    .split(/,(?=\s*[A-Za-z0-9_\-]+=)/)
    .map((c) => c.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
}

/** Validate a crumb string looks like a real Yahoo crumb */
function isValidCrumb(crumb: string): boolean {
  return !!(crumb && crumb.length > 2 && crumb.length < 30 && !crumb.includes("<") && !crumb.includes("Too Many") && !crumb.includes("{"));
}

/** Try fetching a crumb from a given Yahoo host, optionally with a cookie */
async function tryFetchCrumb(cookie = ""): Promise<string | null> {
  for (const host of ["query1", "query2"]) {
    try {
      const res = await fetchWithTimeout(
        `https://${host}.finance.yahoo.com/v1/test/getcrumb`,
        {
          headers: {
            "User-Agent": USER_AGENT,
            Accept: "text/plain",
            ...(cookie ? { Cookie: cookie } : {}),
          },
          cache: "no-store",
        },
        AUTH_TIMEOUT_MS
      );
      if (!res.ok) continue;
      const crumb = (await res.text()).trim();
      if (isValidCrumb(crumb)) return crumb;
    } catch {
      // try next host
    }
  }
  return null;
}

/**
 * Fetch a fresh crumb + cookie pair from Yahoo Finance.
 * Tries multiple strategies in order:
 * 1. Crumb without any cookie (works in some environments)
 * 2. Cookie from finance.yahoo.com + crumb
 * 3. Cookie from fc.yahoo.com + crumb (original approach)
 */
async function fetchAuth(): Promise<{ crumb: string; cookie: string }> {
  // Strategy 1: Try crumb with no cookie first (sometimes works)
  const directCrumb = await tryFetchCrumb();
  if (directCrumb) {
    return { crumb: directCrumb, cookie: "" };
  }

  // Strategy 2: Get cookie from main Yahoo Finance page
  try {
    const mainRes = await fetchWithTimeout(
      "https://finance.yahoo.com/",
      {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml,*/*" },
        cache: "no-store",
      },
      AUTH_TIMEOUT_MS
    );
    const rawCookie2 = mainRes.headers.get("set-cookie") || "";
    if (rawCookie2) {
      const cookie2 = parseCookieHeader(rawCookie2);
      const crumb2 = await tryFetchCrumb(cookie2);
      if (crumb2) return { crumb: crumb2, cookie: cookie2 };
    }
  } catch {
    // fall through to strategy 3
  }

  // Strategy 3: Original approach — cookie from fc.yahoo.com
  const cookieRes = await fetchWithTimeout(
    "https://fc.yahoo.com",
    {
      headers: { "User-Agent": USER_AGENT },
      redirect: "manual",
      cache: "no-store",
    },
    AUTH_TIMEOUT_MS
  );
  const rawCookie3 = cookieRes.headers.get("set-cookie") || "";
  if (!rawCookie3) {
    throw new Error("No Set-Cookie header from Yahoo");
  }
  const cookie3 = parseCookieHeader(rawCookie3);
  const crumb3 = await tryFetchCrumb(cookie3);
  if (crumb3) return { crumb: crumb3, cookie: cookie3 };

  throw new Error("All Yahoo Finance auth strategies failed");
}

/**
 * Get cached or fresh Yahoo Finance auth credentials.
 * Returns { crumb: "", cookie: "" } on failure (degraded mode).
 */
export async function getYahooAuth(): Promise<{
  crumb: string;
  cookie: string;
}> {
  // Return cached values if still valid
  if (authCache && Date.now() < authCache.expiry) {
    return { crumb: authCache.crumb, cookie: authCache.cookie };
  }

  // Don't retry if we recently failed (avoids hammering Yahoo)
  if (Date.now() < authFailedUntil) {
    return { crumb: "", cookie: "" };
  }

  try {
    const { crumb, cookie } = await fetchAuth();
    authCache = { crumb, cookie, expiry: Date.now() + CACHE_TTL_MS };
    authFailedUntil = 0;
    return { crumb, cookie };
  } catch (error) {
    console.error("Yahoo Finance auth failed:", error);
    authFailedUntil = Date.now() + FAIL_CACHE_TTL_MS;
    return { crumb: "", cookie: "" };
  }
}

/**
 * Make an authenticated fetch to Yahoo Finance with timeout.
 *
 * - Appends crumb parameter to the URL
 * - Sets Cookie and User-Agent headers
 * - Aborts after `timeoutMs` (default 10s)
 */
export async function yahooFetch(
  url: string,
  timeoutMs = 10_000
): Promise<Response> {
  // If we're rate-limited, fail fast instead of hammering Yahoo
  if (Date.now() < rateLimitedUntil) {
    return new Response("Rate limited", { status: 429 });
  }

  const { crumb, cookie } = await getYahooAuth();

  // Append crumb to URL
  const separator = url.includes("?") ? "&" : "?";
  const authenticatedUrl = crumb
    ? `${url}${separator}crumb=${encodeURIComponent(crumb)}`
    : url;

  const response = await fetchWithTimeout(
    authenticatedUrl,
    {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      cache: "no-store",
    },
    timeoutMs
  );

  // If we get a 401/403, invalidate the auth cache so next call refreshes
  if (response.status === 401 || response.status === 403) {
    authCache = null;
  }

  // If we get rate-limited, apply exponential backoff
  if (response.status === 429) {
    consecutive429s++;
    const backoff = Math.min(BASE_RATE_LIMIT_MS * Math.pow(2, consecutive429s - 1), MAX_RATE_LIMIT_MS);
    rateLimitedUntil = Date.now() + backoff;
  } else {
    consecutive429s = 0;
  }

  return response;
}
