import { NextRequest, NextResponse } from 'next/server';
import { Player, Position } from '@/types';
import { DataFileWriter, DataFileMetadata } from '@/lib/dataFileWriter';

// In-memory storage for development (in production, this would be a database)
// Support multiple datasets for comparison, including scoring format variations
const dataStore: Record<string, Record<Position, Player[]>> = {
  'current': {
    'QB': [],
    'RB': [],
    'WR': [],
    'TE': [],
    'K': [],
    'DST': [],
    'FLEX': [],
    'OVERALL': []
  },
  // Free rankings by scoring format
  'free-ranking-standard': {
    'QB': [],
    'RB': [],
    'WR': [],
    'TE': [],
    'K': [],
    'DST': [],
    'FLEX': [],
    'OVERALL': []
  },
  'free-ranking-ppr': {
    'QB': [],
    'RB': [],
    'WR': [],
    'TE': [],
    'K': [],
    'DST': [],
    'FLEX': [],
    'OVERALL': []
  },
  'free-ranking-half-ppr': {
    'QB': [],
    'RB': [],
    'WR': [],
    'TE': [],
    'K': [],
    'DST': [],
    'FLEX': [],
    'OVERALL': []
  },
  // Session rankings by scoring format
  'fantasypros-session-standard': {
    'QB': [],
    'RB': [],
    'WR': [],
    'TE': [],
    'K': [],
    'DST': [],
    'FLEX': [],
    'OVERALL': []
  },
  'fantasypros-session-ppr': {
    'QB': [],
    'RB': [],
    'WR': [],
    'TE': [],
    'K': [],
    'DST': [],
    'FLEX': [],
    'OVERALL': []
  },
  'fantasypros-session-half-ppr': {
    'QB': [],
    'RB': [],
    'WR': [],
    'TE': [],
    'K': [],
    'DST': [],
    'FLEX': [],
    'OVERALL': []
  }
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const position = searchParams.get('position') as Position;
    const dataset = searchParams.get('dataset') || 'current';
    const scoringFormat = searchParams.get('scoringFormat');
    const compare = searchParams.get('compare') === 'true';

    if (compare) {
      // Return comparison data for all datasets
      const comparison: Record<string, any> = {};
      
      if (position) {
        // Compare specific position across all datasets
        Object.keys(dataStore).forEach(ds => {
          comparison[ds] = {
            players: dataStore[ds][position] || [],
            count: dataStore[ds][position]?.length || 0
          };
        });
        
        return NextResponse.json({
          success: true,
          position,
          comparison,
          note: 'Comparison data for all datasets'
        });
      } else {
        // Compare all positions across all datasets
        Object.keys(dataStore).forEach(ds => {
          const totalPlayers = Object.values(dataStore[ds]).reduce((sum, players) => sum + players.length, 0);
          comparison[ds] = {
            allData: dataStore[ds],
            totalPlayers,
            positionCounts: Object.entries(dataStore[ds]).reduce((acc, [pos, players]) => {
              acc[pos] = players.length;
              return acc;
            }, {} as Record<string, number>)
          };
        });
        
        return NextResponse.json({
          success: true,
          comparison,
          note: 'Full comparison data for all datasets'
        });
      }
    }

    if (position) {
      // Get data for specific position from specific dataset
      // If a scoring format is provided and dataset is session or free, append it
      let actualDataset = dataset;
      if (scoringFormat && (dataset === 'fantasypros-session' || dataset === 'free-ranking')) {
        actualDataset = `${dataset}-${scoringFormat}`;
      }
      
      return NextResponse.json({
        success: true,
        position,
        dataset: actualDataset,
        scoringFormat,
        players: dataStore[actualDataset]?.[position] || [],
        count: dataStore[actualDataset]?.[position]?.length || 0
      });
    } else {
      // Get all data from specific dataset
      const currentDataStore = dataStore[dataset] || dataStore['current'];
      const totalPlayers = Object.values(currentDataStore).reduce((sum, players) => sum + players.length, 0);
      return NextResponse.json({
        success: true,
        dataset,
        allData: currentDataStore,
        totalPlayers,
        positionCounts: Object.entries(currentDataStore).reduce((acc, [pos, players]) => {
          acc[pos] = players.length;
          return acc;
        }, {} as Record<string, number>)
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get data'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { position, players, action = 'set', dataset = 'current', source, scoringFormat } = body;

    if (!position || !Array.isArray(players)) {
      return NextResponse.json({
        success: false,
        error: 'Position and players array are required'
      }, { status: 400 });
    }

    // Determine dataset based on source and scoring format if not explicitly provided
    let targetDataset = dataset;
    if (source === 'fantasypros-free') {
      targetDataset = scoringFormat ? `free-ranking-${scoringFormat}` : 'free-ranking-ppr';
    } else if (source === 'fantasypros-session') {
      targetDataset = scoringFormat ? `fantasypros-session-${scoringFormat}` : 'fantasypros-session-ppr';
    }

    // Ensure dataset exists
    if (!dataStore[targetDataset]) {
      dataStore[targetDataset] = {
        'QB': [], 'RB': [], 'WR': [], 'TE': [], 'K': [], 'DST': [], 'FLEX': [], 'OVERALL': []
      };
    }

    if (action === 'set') {
      // Replace all players for the position
      dataStore[targetDataset][position as Position] = players;
      // Also update 'current' dataset to maintain backward compatibility
      dataStore['current'][position as Position] = players;
      
      // Persist to file system if source is from fantasypros
      if (source === 'fantasypros-session' || source === 'fantasypros-free') {
        try {
          const metadata: DataFileMetadata = {
            lastUpdated: new Date().toISOString(),
            source: source === 'fantasypros-session' ? 'fantasypros' : 'manual',
            format: (scoringFormat || 'ppr') as 'ppr' | 'half' | 'standard',
            version: '1.0.0'
          };
          
          await DataFileWriter.writePlayerData(position, players, metadata);
          console.log(`Persisted ${players.length} ${position} players to file`);
        } catch (error) {
          console.error('Failed to persist data to file:', error);
          // Don't fail the request if file write fails
        }
      }
    } else if (action === 'append') {
      // Add players to existing data
      if (!dataStore[targetDataset][position as Position]) {
        dataStore[targetDataset][position as Position] = [];
      }
      dataStore[targetDataset][position as Position].push(...players);
      dataStore['current'][position as Position].push(...players);
    } else if (action === 'clear') {
      // Clear all data for position
      dataStore[targetDataset][position as Position] = [];
      dataStore['current'][position as Position] = [];
    }

    return NextResponse.json({
      success: true,
      position,
      action,
      dataset: targetDataset,
      scoringFormat,
      source: source || 'unknown',
      playersStored: dataStore[targetDataset][position as Position].length,
      message: `Successfully ${action === 'set' ? 'set' : action === 'append' ? 'added' : 'cleared'} ${players.length} players for ${position} in ${targetDataset} dataset`
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store data'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const position = searchParams.get('position') as Position;
    const dataset = searchParams.get('dataset') || 'current';

    if (position) {
      // Clear specific position in specific dataset
      if (dataStore[dataset]) {
        dataStore[dataset][position] = [];
      }
      return NextResponse.json({
        success: true,
        message: `Cleared data for ${position} in ${dataset} dataset`,
        position,
        dataset
      });
    } else {
      // Clear all data in specific dataset
      if (dataset === 'all') {
        // Clear all datasets
        Object.keys(dataStore).forEach(ds => {
          Object.keys(dataStore[ds]).forEach(pos => {
            dataStore[ds][pos as Position] = [];
          });
        });
        return NextResponse.json({
          success: true,
          message: 'Cleared all data from all datasets'
        });
      } else {
        // Clear specific dataset
        if (dataStore[dataset]) {
          Object.keys(dataStore[dataset]).forEach(pos => {
            dataStore[dataset][pos as Position] = [];
          });
        }
        return NextResponse.json({
          success: true,
          message: `Cleared all position data from ${dataset} dataset`,
          dataset
        });
      }
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear data'
    }, { status: 500 });
  }
}