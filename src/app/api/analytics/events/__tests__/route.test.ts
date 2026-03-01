/**
 * @jest-environment node
 */

import { POST, GET } from '../route';
import { NextRequest } from 'next/server';

// Helper to build a POST request with a JSON body
const postRequest = (body: unknown): NextRequest =>
  new Request('http://localhost/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;

// Helper to build a GET request with optional query string
const getRequest = (query = ''): NextRequest =>
  new Request(`http://localhost/api/analytics/events${query ? `?${query}` : ''}`) as unknown as NextRequest;

describe('POST /api/analytics/events', () => {
  it('accepts a valid event and returns 200 with a status and eventId', async () => {
    const req = postRequest({ event: 'page_view', url: '/', timestamp: Date.now() });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('success');
    expect(body.eventId).toMatch(/^event_/);
  });

  it('returns 400 when the event field is missing', async () => {
    const req = postRequest({ url: '/', timestamp: Date.now() });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid event data');
  });

  it('returns 400 when the url field is missing', async () => {
    const req = postRequest({ event: 'page_view', timestamp: Date.now() });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid event data');
  });

  it('returns 400 when both event and url are missing', async () => {
    const req = postRequest({ timestamp: Date.now() });
    const response = await POST(req);

    expect(response.status).toBe(400);
  });
});

describe('GET /api/analytics/events', () => {
  // Seed a couple of events so there is something to aggregate
  beforeAll(async () => {
    await POST(postRequest({ event: 'page_view', url: '/home', timestamp: Date.now() }));
    await POST(postRequest({ event: 'page_view', url: '/about', timestamp: Date.now() }));
  });

  it('returns 200 with all expected summary fields', async () => {
    const response = await GET(getRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('totalEvents');
    expect(body).toHaveProperty('topEvents');
    expect(body).toHaveProperty('topPages');
    expect(body).toHaveProperty('recentEvents');
    expect(Array.isArray(body.topEvents)).toBe(true);
    expect(Array.isArray(body.recentEvents)).toBe(true);
  });

  it('filters by event type when the ?event param is provided', async () => {
    // Post a uniquely-named event that no other test will produce
    const uniqueEvent = 'route_test_unique_event_99z';
    await POST(postRequest({ event: uniqueEvent, url: '/filter-test', timestamp: Date.now() }));

    const response = await GET(getRequest(`event=${uniqueEvent}`));
    expect(response.status).toBe(200);

    const body = await response.json();
    // Only the one unique event should be in the filtered result
    expect(body.totalEvents).toBe(1);
    body.topEvents.forEach((e: { event: string }) => {
      expect(e.event).toBe(uniqueEvent);
    });
  });
});
