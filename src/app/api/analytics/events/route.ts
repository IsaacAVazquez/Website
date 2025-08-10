import { NextRequest, NextResponse } from 'next/server';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  url: string;
  timestamp: number;
  userAgent?: string;
  sessionId?: string;
}

// In-memory storage for demo (in production, use a proper analytics service)
const eventsData: AnalyticsEvent[] = [];

export async function POST(request: NextRequest) {
  try {
    const eventData: AnalyticsEvent = await request.json();

    // Validate the event data
    if (!eventData.event || !eventData.url) {
      return NextResponse.json(
        { error: 'Invalid event data' },
        { status: 400 }
      );
    }

    // Add server-side enrichment
    const enrichedEvent = {
      ...eventData,
      timestamp: eventData.timestamp || Date.now(),
      userAgent: request.headers.get('user-agent') || eventData.userAgent,
      ip: request.ip || request.headers.get('x-forwarded-for'),
      // Add session tracking if needed
      sessionId: eventData.sessionId || generateSessionId()
    };

    // Store the event (in production, send to your analytics service)
    eventsData.push(enrichedEvent);

    // Log important events
    if (['newsletter_signup', 'contact_form_submit', 'search_performed'].includes(eventData.event)) {
      console.log('🎯 Important event tracked:', {
        event: eventData.event,
        url: eventData.url,
        properties: eventData.properties,
        timestamp: new Date(enrichedEvent.timestamp).toISOString()
      });
    }

    // In production, you would:
    // 1. Send to analytics platforms (Google Analytics, Mixpanel, etc.)
    // 2. Store in your database for custom analysis
    // 3. Trigger automated workflows based on events
    // 4. Update user profiles or segments

    return NextResponse.json({ 
      status: 'success',
      eventId: generateEventId()
    });

  } catch (error) {
    console.error('Error processing event:', error);
    return NextResponse.json(
      { error: 'Failed to process event' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve events summary (for admin/monitoring)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || '24h';
  const event = searchParams.get('event');

  try {
    // Calculate timeframe in milliseconds
    const timeframes = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const timeframMs = timeframes[timeframe as keyof typeof timeframes] || timeframes['24h'];
    const cutoffTime = Date.now() - timeframMs;

    // Filter data by timeframe
    let filteredData = eventsData.filter(d => d.timestamp >= cutoffTime);

    // Filter by specific event if requested
    if (event) {
      filteredData = filteredData.filter(d => d.event === event);
    }

    // Calculate summary statistics
    const eventCounts = filteredData.reduce((acc, item) => {
      acc[item.event] = (acc[item.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const urlCounts = filteredData.reduce((acc, item) => {
      acc[item.url] = (acc[item.url] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const summary = {
      totalEvents: filteredData.length,
      timeframe,
      topEvents: Object.entries(eventCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([event, count]) => ({ event, count })),
      topPages: Object.entries(urlCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([url, count]) => ({ url, count })),
      recentEvents: filteredData
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20)
        .map(({ userAgent, ip, ...event }) => event) // Remove sensitive data
    };

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Error retrieving events:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve events' },
      { status: 500 }
    );
  }
}

// Helper functions
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}