import { NextRequest, NextResponse } from 'next/server';

interface WebVitalMetric {
  name: string;
  value: number;
  id: string;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  url: string;
  userAgent: string;
  timestamp: number;
  connectionType?: string;
  deviceMemory?: number;
  isBot: boolean;
}

// In-memory storage for demo (in production, use a proper database or analytics service)
const webVitalsData: WebVitalMetric[] = [];

export async function POST(request: NextRequest) {
  try {
    const metric: WebVitalMetric = await request.json();

    // Validate the metric data
    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // Filter out bot traffic for cleaner metrics
    if (metric.isBot) {
      return NextResponse.json({ status: 'ignored_bot' });
    }

    // Store the metric (in production, you'd send this to your analytics service)
    webVitalsData.push({
      ...metric,
      timestamp: Date.now()
    });

    // Log for monitoring (in production, you might want to use structured logging)
    console.log('📊 Web Vital collected:', {
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      url: metric.url,
      timestamp: new Date(metric.timestamp).toISOString()
    });

    // In production, you would:
    // 1. Send to your analytics platform (Google Analytics, Mixpanel, etc.)
    // 2. Store in your database for custom dashboards
    // 3. Set up alerts for poor performance metrics
    // 4. Aggregate data for reporting

    return NextResponse.json({ 
      status: 'success',
      message: 'Web vital recorded'
    });

  } catch (error) {
    console.error('Error processing web vital:', error);
    return NextResponse.json(
      { error: 'Failed to process metric' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve web vitals summary (for admin/monitoring)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || '24h';
  const metric = searchParams.get('metric');

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
    let filteredData = webVitalsData.filter(d => d.timestamp >= cutoffTime);

    // Filter by specific metric if requested
    if (metric) {
      filteredData = filteredData.filter(d => d.name === metric);
    }

    // Calculate summary statistics
    const summary = {
      totalSamples: filteredData.length,
      timeframe,
      metrics: {} as Record<string, any>
    };

    // Group by metric name
    const metricGroups = filteredData.reduce((acc, item) => {
      if (!acc[item.name]) acc[item.name] = [];
      acc[item.name].push(item);
      return acc;
    }, {} as Record<string, WebVitalMetric[]>);

    // Calculate statistics for each metric
    Object.entries(metricGroups).forEach(([metricName, data]) => {
      const values = data.map(d => d.value);
      const ratings = data.map(d => d.rating);
      
      summary.metrics[metricName] = {
        sampleCount: data.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
        p75: values.sort((a, b) => a - b)[Math.floor(values.length * 0.75)],
        p90: values.sort((a, b) => a - b)[Math.floor(values.length * 0.9)],
        min: Math.min(...values),
        max: Math.max(...values),
        ratings: {
          good: ratings.filter(r => r === 'good').length,
          needsImprovement: ratings.filter(r => r === 'needs-improvement').length,
          poor: ratings.filter(r => r === 'poor').length
        }
      };
    });

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Error retrieving web vitals:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    );
  }
}