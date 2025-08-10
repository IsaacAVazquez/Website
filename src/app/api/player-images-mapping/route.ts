import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const mappingPath = path.join(process.cwd(), 'src', 'data', 'player-images.json');
    
    try {
      const mappingData = await fs.readFile(mappingPath, 'utf-8');
      const mapping = JSON.parse(mappingData);
      
      return NextResponse.json(mapping);
    } catch (fileError) {
      // If mapping file doesn't exist, return empty mapping
      console.warn('Player images mapping file not found:', fileError);
      return NextResponse.json({});
    }
  } catch (error) {
    console.error('Error loading player images mapping:', error);
    return NextResponse.json(
      { error: 'Failed to load player images mapping' },
      { status: 500 }
    );
  }
}