/**
 * @jest-environment node
 */

import { mbaJobsRateLimiter, getClientIdentifier, getClientIp, rateLimitResponse } from '../rateLimit';
import { NextRequest } from 'next/server';

// Each test gets a unique client ID to avoid cross-test state contamination
// since mbaJobsRateLimiter is a module-level singleton.
let counter = 0;
const uid = () => `test-client-${++counter}-${Math.random().toString(36).slice(2)}`;

describe('mbaJobsRateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('first check returns success with remaining 29 and limit 30', () => {
    const result = mbaJobsRateLimiter.check(uid());
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(29);
    expect(result.limit).toBe(30);
  });

  it('repeated checks decrement remaining', () => {
    const id = uid();
    mbaJobsRateLimiter.check(id); // 1st
    mbaJobsRateLimiter.check(id); // 2nd
    const third = mbaJobsRateLimiter.check(id); // 3rd
    expect(third.success).toBe(true);
    expect(third.remaining).toBe(27);
  });

  it('returns failure after 30 requests in a 60-second window', () => {
    const id = uid();
    for (let i = 0; i < 30; i++) {
      mbaJobsRateLimiter.check(id);
    }
    const over = mbaJobsRateLimiter.check(id);
    expect(over.success).toBe(false);
    expect(over.remaining).toBe(0);
  });

  it('resets after advancing time past the 60-second window', () => {
    const id = uid();
    // Exhaust the limit
    for (let i = 0; i < 30; i++) {
      mbaJobsRateLimiter.check(id);
    }
    expect(mbaJobsRateLimiter.check(id).success).toBe(false);

    // Move past the 60-second window
    jest.advanceTimersByTime(61_000);

    const afterReset = mbaJobsRateLimiter.check(id);
    expect(afterReset.success).toBe(true);
    expect(afterReset.remaining).toBe(29);
  });
});

describe('getClientIdentifier', () => {
  // Use a lightweight mock to avoid NextRequest instantiation complexity in tests
  const makeReq = (headers: Record<string, string>): NextRequest =>
    ({
      headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    }) as unknown as NextRequest;

  it('returns the first IP from x-forwarded-for combined with user-agent', () => {
    const req = makeReq({ 'x-forwarded-for': '1.2.3.4', 'user-agent': 'test-agent' });
    expect(getClientIdentifier(req)).toBe('1.2.3.4:test-agent');
  });

  it('takes the first IP when x-forwarded-for has multiple values', () => {
    const req = makeReq({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3', 'user-agent': 'ua' });
    expect(getClientIdentifier(req)).toBe('1.1.1.1:ua');
  });

  it('uses x-real-ip when the Netlify header is absent', () => {
    const req = makeReq({ 'x-real-ip': '5.6.7.8', 'user-agent': 'agent' });
    expect(getClientIdentifier(req)).toBe('5.6.7.8:agent');
  });

  // x-forwarded-for's first entry is whatever the client sent, so it is the
  // last resort, and Netlify's own header beats both of the others.
  it('ranks the Netlify peer above x-real-ip, and x-real-ip above x-forwarded-for', () => {
    const spoofable = { 'x-real-ip': '5.6.7.8', 'x-forwarded-for': '9.9.9.9, 1.1.1.1', 'user-agent': 'ua' };
    expect(getClientIdentifier(makeReq(spoofable))).toBe('5.6.7.8:ua');
    expect(getClientIdentifier(makeReq({ ...spoofable, 'x-nf-client-connection-ip': '203.0.113.9' }))).toBe(
      '203.0.113.9:ua'
    );
  });

  it('falls back to "unknown" when no IP headers are present', () => {
    const req = makeReq({ 'user-agent': 'browser' });
    expect(getClientIdentifier(req)).toBe('unknown:browser');
  });
});

describe('getClientIp behind Cloudflare', () => {
  const request = (headers: Record<string, string>) =>
    new NextRequest('https://example.com/api/test', { headers });

  it('keys two visitors behind one Cloudflare peer on their own addresses', () => {
    const peer = { 'x-nf-client-connection-ip': '172.71.146.9' };
    expect(getClientIp(request({ ...peer, 'cf-connecting-ip': '203.0.113.5' }))).toBe('203.0.113.5');
    expect(getClientIp(request({ ...peer, 'cf-connecting-ip': '198.51.100.77' }))).toBe('198.51.100.77');
    expect(
      getClientIp(request({ 'x-nf-client-connection-ip': '2606:4700:10::1', 'cf-connecting-ip': '2001:db8::7' }))
    ).toBe('2001:db8::7');
  });

  it('ignores cf-connecting-ip from a peer that is not Cloudflare', () => {
    expect(
      getClientIp(request({ 'x-nf-client-connection-ip': '203.0.113.9', 'cf-connecting-ip': '198.51.100.77' }))
    ).toBe('203.0.113.9');
  });

  it('keeps the Cloudflare peer when the visitor header is missing or not an address', () => {
    expect(getClientIp(request({ 'x-nf-client-connection-ip': '172.71.146.9' }))).toBe('172.71.146.9');
    expect(
      getClientIp(request({ 'x-nf-client-connection-ip': '172.71.146.9', 'cf-connecting-ip': 'not-an-ip' }))
    ).toBe('172.71.146.9');
  });
});

describe('rateLimitResponse', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns HTTP 429', () => {
    const now = Date.now();
    const result = { success: false, limit: 30, remaining: 0, reset: now + 60_000 };
    const response = rateLimitResponse(result);
    expect(response.status).toBe(429);
  });

  it('sets X-RateLimit-Remaining header to 0', () => {
    const now = Date.now();
    const result = { success: false, limit: 30, remaining: 0, reset: now + 60_000 };
    const response = rateLimitResponse(result);
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('includes retryAfter in JSON body', async () => {
    const now = Date.now();
    const result = { success: false, limit: 30, remaining: 0, reset: now + 60_000 };
    const response = rateLimitResponse(result);
    const body = await response.json();
    expect(body).toHaveProperty('retryAfter');
    expect(body.retryAfter).toBeGreaterThan(0);
  });

  it('includes error message in JSON body', async () => {
    const now = Date.now();
    const result = { success: false, limit: 30, remaining: 0, reset: now + 60_000 };
    const response = rateLimitResponse(result);
    const body = await response.json();
    expect(body).toHaveProperty('error', 'Too many requests');
  });
});
