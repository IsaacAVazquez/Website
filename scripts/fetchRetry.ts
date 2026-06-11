/**
 * Shared retry-with-backoff helper for snapshot fetch scripts. Works with any
 * error that exposes an HTTP `status` and response `headers` (the shape of
 * `FantasyProsPublicFetchError` and `FantasyAdpFetchError`): 429/503 and 5xx
 * are retried with exponential backoff plus jitter, `Retry-After` is honored
 * on 429s, and other 4xx errors fail immediately — there is no point
 * hammering a source with a malformed request, and a 404 means the URL shape
 * changed and needs human attention.
 */

const MAX_BACKOFF_MS = 60_000;
const JITTER_MS = 500;

interface HttpStatusError {
  status: number;
  headers: Headers;
}

function isHttpStatusError(error: unknown): error is HttpStatusError {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as HttpStatusError).status === "number" &&
    typeof (error as HttpStatusError).headers?.get === "function"
  );
}

function isRetryableError(error: unknown): boolean {
  if (isHttpStatusError(error)) {
    if (error.status === 429 || error.status === 503) {
      return true;
    }
    if (error.status >= 400 && error.status < 500) {
      return false;
    }
    return error.status >= 500;
  }
  return true;
}

/**
 * Honor `Retry-After` on 429 responses. Header is either an integer number of
 * seconds or an HTTP-date; both forms are normalized to ms. Returns null when
 * no header is present so the caller falls back to its exponential schedule.
 */
function getRetryAfterMs(error: unknown): number | null {
  if (!isHttpStatusError(error) || error.status !== 429) {
    return null;
  }
  const header = error.headers.get("retry-after");
  if (!header) {
    return null;
  }

  const seconds = Number.parseInt(header, 10);
  if (Number.isFinite(seconds) && String(seconds) === header.trim()) {
    return Math.max(0, seconds * 1000);
  }

  const dateMs = Date.parse(header);
  if (Number.isFinite(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return null;
}

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 4,
  backoffBaseMs = 1500
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error)) {
        const status = isHttpStatusError(error) ? ` (HTTP ${error.status})` : "";
        console.error(
          `[retry] ${label} failed with non-retryable error${status}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        throw error;
      }

      if (attempt < attempts) {
        const exponential = Math.min(backoffBaseMs * 2 ** (attempt - 1), MAX_BACKOFF_MS);
        const jitter = Math.floor(Math.random() * JITTER_MS);
        const retryAfter = getRetryAfterMs(error);
        const wait = retryAfter !== null ? retryAfter + jitter : exponential + jitter;

        console.warn(
          `[retry] ${label} attempt ${attempt}/${attempts} failed (${
            error instanceof Error ? error.message : String(error)
          }). Retrying in ${wait}ms${retryAfter !== null ? " (honored Retry-After)" : ""}.`
        );
        await pause(wait);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`[retry] ${label} failed after ${attempts} attempts`);
}
