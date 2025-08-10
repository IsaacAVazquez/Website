import { NextRequest, NextResponse } from 'next/server';
import { getSampleDataByPosition } from '@/data/sampleData';
import { Position } from '@/types';

// Cache the data for 1 hour to avoid repeated file reads
let cachedData: Record<string, any> = {};
let lastCacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position') as Position;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Check cache validity
    const now = Date.now();
    if (now - lastCacheTime > CACHE_DURATION) {
      cachedData = {};
      lastCacheTime = now;
    }

    // Get data from cache or file
    const cacheKey = position || 'all';
    if (!cachedData[cacheKey]) {
      if (position) {
        cachedData[cacheKey] = getSampleDataByPosition(position);
      } else {
        // If no position specified, return all positions
        const allPositions: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
        const allData = [];
        for (const pos of allPositions) {
          const posData = getSampleDataByPosition(pos);
          allData.push(...posData);
        }
        cachedData[cacheKey] = allData;
      }
    }

    const data = cachedData[cacheKey];

    // Implement pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: data.length,
        totalPages: Math.ceil(data.length / limit),
        hasNext: endIndex < data.length,
        hasPrev: page > 1
      },
      metadata: {
        position: position || 'all',
        cached: true,
        cacheTime: lastCacheTime
      }
    });

  } catch (error) {
    console.error('Sample data API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sample data',
      data: []
    }, { status: 500 });
  }
}

export async function HEAD(request: NextRequest) {
  // Return just headers for cache validation
  return new NextResponse(null, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Last-Modified': new Date(lastCacheTime).toUTCString()
    }
  });
}