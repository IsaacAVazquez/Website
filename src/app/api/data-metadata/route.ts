import { NextRequest, NextResponse } from 'next/server';
import { DataFileWriter } from '@/lib/dataFileWriter';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const position = searchParams.get('position');

    if (position) {
      // Get metadata for specific position
      const metadata = await DataFileWriter.getDataMetadata(position);
      
      return NextResponse.json({
        success: true,
        position,
        metadata
      });
    } else {
      // Get metadata for all positions
      const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST', 'FLEX', 'OVERALL'];
      const allMetadata: Record<string, any> = {};
      
      for (const pos of positions) {
        allMetadata[pos] = await DataFileWriter.getDataMetadata(pos);
      }
      
      // Find the most recent update
      let mostRecentUpdate: string | null = null;
      let oldestUpdate: string | null = null;
      
      Object.values(allMetadata).forEach((metadata: any) => {
        if (metadata?.lastUpdated) {
          const updateTime = new Date(metadata.lastUpdated);
          if (!mostRecentUpdate || updateTime > new Date(mostRecentUpdate)) {
            mostRecentUpdate = metadata.lastUpdated;
          }
          if (!oldestUpdate || updateTime < new Date(oldestUpdate)) {
            oldestUpdate = metadata.lastUpdated;
          }
        }
      });
      
      return NextResponse.json({
        success: true,
        metadata: {
          lastUpdated: mostRecentUpdate || new Date().toISOString(),
          oldestUpdate,
          source: 'fantasypros',
          format: 'ppr',
          version: '1.0.0'
        },
        positionMetadata: allMetadata
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get metadata'
    }, { status: 500 });
  }
}