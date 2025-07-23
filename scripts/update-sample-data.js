#!/usr/bin/env node

/**
 * Update sample data with real FantasyPros data
 * This script authenticates with FantasyPros and fetches current data for all positions and scoring formats
 * and saves it as the new "sample" data for offline/fallback use
 */

const fs = require('fs');
const path = require('path');

const ALL_POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
const ALL_SCORING_FORMATS = ['STANDARD', 'HALF_PPR', 'PPR'];

// FantasyPros credentials
const CREDENTIALS = {
  username: 'Votedonut@yahoo.com',
  password: 'n5WRvVzc^KyDi2k^'
};

async function authenticateSession() {
  console.log('🔐 Authenticating with FantasyPros...');
  
  try {
    const response = await fetch('http://localhost:3000/api/test-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(CREDENTIALS)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Authentication successful!');
      if (result.sampleData) {
        console.log(`   Sample data: ${result.sampleData.playersFound} players found`);
      }
      return true;
    } else {
      console.log('❌ Authentication failed:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.message);
    return false;
  }
}

async function fetchPositionData(position, scoringFormat) {
  console.log(`📥 Fetching ${position} data for ${scoringFormat}...`);
  
  try {
    // Use fantasy-pros-session endpoint after authentication (POST method required)
    const response = await fetch('http://localhost:3000/api/fantasy-pros-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: CREDENTIALS.username,
        password: CREDENTIALS.password,
        position: position,
        scoringFormat: scoringFormat.toLowerCase(),
        week: 0 // Use preseason data
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.players && data.players.length > 0) {
      console.log(`✅ Successfully fetched ${data.players.length} ${position} players for ${scoringFormat}`);
      return data.players;
    } else {
      console.log(`⚠️  No data returned for ${position} ${scoringFormat}: ${data.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Failed to fetch ${position} ${scoringFormat}: ${error.message}`);
    return null;
  }
}

async function fetchAllData() {
  console.log('🚀 UPDATING SAMPLE DATA WITH REAL FANTASYPROS DATA\n');
  
  // First authenticate
  const authSuccess = await authenticateSession();
  if (!authSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return null;
  }
  
  const allData = {};
  
  // Initialize data structure
  for (const format of ALL_SCORING_FORMATS) {
    allData[format] = {};
    for (const position of ALL_POSITIONS) {
      allData[format][position] = [];
    }
  }
  
  // Fetch data for all combinations  
  for (const format of ALL_SCORING_FORMATS) {
    console.log(`\n📊 Processing ${format} scoring format:`);
    console.log('─'.repeat(50));
    
    // Convert format to what FantasyPros expects  
    const fpFormat = format === 'STANDARD' ? 'std' : format === 'HALF_PPR' ? 'half' : 'ppr';
    
    for (const position of ALL_POSITIONS) {
      const players = await fetchPositionData(position, fpFormat);
      if (players) {
        allData[format][position] = players;
      }
      
      // Small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return allData;
}

function generateSampleDataFile(allData) {
  console.log('\n📝 Generating new sample data file...');
  
  const fileContent = `import { Player, Position, ScoringFormat } from '@/types';

// Real FantasyPros data as of ${new Date().toISOString()}
// This data serves as fallback when the API is unavailable  
// Generated automatically - do not edit manually

`;

  // Generate individual position exports for each scoring format
  let positionExports = '';
  let getSampleDataFunction = '';
  
  for (const format of ALL_SCORING_FORMATS) {
    for (const position of ALL_POSITIONS) {
      const players = allData[format][position];
      const exportName = `sample${position}Data${format.replace('_', '')}`;
      
      positionExports += `// ${position} players for ${format} scoring (${players.length} players)\n`;
      positionExports += `export const ${exportName}: Player[] = ${JSON.stringify(players, null, 2)};\n\n`;
    }
  }
  
  // Generate helper function
  getSampleDataFunction = `
// Helper functions to get sample data by position and scoring format
export function getSampleDataByPosition(position: Position, scoringFormat: ScoringFormat = 'HALF_PPR'): Player[] {
  const formatKey = scoringFormat.replace('_', '');
  
  switch (position) {
    case 'QB':
      switch (formatKey) {
        case 'STANDARD': return sampleQBDataSTANDARD;
        case 'HALFPPR': return sampleQBDataHALFPPR;
        case 'PPR': return sampleQBDataPPR;
        default: return sampleQBDataHALFPPR;
      }
    case 'RB':
      switch (formatKey) {
        case 'STANDARD': return sampleRBDataSTANDARD;
        case 'HALFPPR': return sampleRBDataHALFPPR;
        case 'PPR': return sampleRBDataPPR;
        default: return sampleRBDataHALFPPR;
      }
    case 'WR':
      switch (formatKey) {
        case 'STANDARD': return sampleWRDataSTANDARD;
        case 'HALFPPR': return sampleWRDataHALFPPR;
        case 'PPR': return sampleWRDataPPR;
        default: return sampleWRDataHALFPPR;
      }
    case 'TE':
      switch (formatKey) {
        case 'STANDARD': return sampleTEDataSTANDARD;
        case 'HALFPPR': return sampleTEDataHALFPPR;
        case 'PPR': return sampleTEDataPPR;
        default: return sampleTEDataHALFPPR;
      }
    case 'K':
      switch (formatKey) {
        case 'STANDARD': return sampleKDataSTANDARD;
        case 'HALFPPR': return sampleKDataHALFPPR;
        case 'PPR': return sampleKDataPPR;
        default: return sampleKDataHALFPPR;
      }
    case 'DST':
      switch (formatKey) {
        case 'STANDARD': return sampleDSTDataSTANDARD;
        case 'HALFPPR': return sampleDSTDataHALFPPR;
        case 'PPR': return sampleDSTDataPPR;
        default: return sampleDSTDataHALFPPR;
      }
    default:
      return [];
  }
}

// Legacy exports for backward compatibility (using Half-PPR as default)
export const sampleQBData = sampleQBDataHALFPPR;
export const sampleRBData = sampleRBDataHALFPPR;
export const sampleWRData = sampleWRDataHALFPPR;
export const sampleTEData = sampleTEDataHALFPPR;
export const sampleKData = sampleKDataHALFPPR;
export const sampleDSTData = sampleDSTDataHALFPPR;

// Get all players for a specific scoring format
export function getAllSamplePlayers(scoringFormat: ScoringFormat = 'HALF_PPR'): Player[] {
  return [
    ...getSampleDataByPosition('QB', scoringFormat),
    ...getSampleDataByPosition('RB', scoringFormat),
    ...getSampleDataByPosition('WR', scoringFormat),
    ...getSampleDataByPosition('TE', scoringFormat),
    ...getSampleDataByPosition('K', scoringFormat),
    ...getSampleDataByPosition('DST', scoringFormat),
  ].sort((a, b) => {
    const aRank = parseFloat(a.averageRank?.toString() || "999");
    const bRank = parseFloat(b.averageRank?.toString() || "999");
    return aRank - bRank;
  });
}`;
  
  return fileContent + positionExports + getSampleDataFunction;
}

function saveSampleDataFile(content) {
  const filePath = path.join(__dirname, '../src/data/sampleData.ts');
  
  // Backup existing file
  const backupPath = path.join(__dirname, '../src/data/sampleData.backup.ts');
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, backupPath);
    console.log(`📋 Backed up existing file to sampleData.backup.ts`);
  }
  
  // Write new file
  fs.writeFileSync(filePath, content);
  console.log(`✅ Successfully updated ${filePath}`);
}

function generateSummary(allData) {
  console.log('\n📊 DATA SUMMARY:');
  console.log('─'.repeat(60));
  
  let totalPlayers = 0;
  
  for (const format of ALL_SCORING_FORMATS) {
    console.log(`\n${format} Scoring Format:`);
    for (const position of ALL_POSITIONS) {
      const count = allData[format][position].length;
      console.log(`  ${position}: ${count} players`);
      totalPlayers += count;
    }
  }
  
  console.log(`\nTotal player records: ${totalPlayers}`);
  console.log(`Unique combinations: ${ALL_POSITIONS.length} positions × ${ALL_SCORING_FORMATS.length} formats = ${ALL_POSITIONS.length * ALL_SCORING_FORMATS.length}`);
  
  // Show sample of data quality
  const samplePlayer = allData['HALF_PPR']['QB'][0];
  if (samplePlayer) {
    console.log('\n🔍 Sample Player (Quality Check):');
    console.log(`Name: ${samplePlayer.name}`);
    console.log(`Team: ${samplePlayer.team}`);
    console.log(`Position: ${samplePlayer.position}`);
    console.log(`Average Rank: ${samplePlayer.averageRank}`);
    console.log(`Projected Points: ${samplePlayer.projectedPoints || 'N/A'}`);
    console.log(`Standard Deviation: ${samplePlayer.standardDeviation || 'N/A'}`);
  }
}

async function main() {
  console.log('🚀 Starting sample data update process...');
  
  try {
    // Fetch all data
    const allData = await fetchAllData();
    
    if (!allData) {
      console.log('\n❌ No data was successfully fetched!');
      console.log('This could mean:');
      console.log('• FantasyPros authentication failed');
      console.log('• Session endpoints are not working');
      console.log('• Network connectivity issues');
      process.exit(1);
    }
    
    // Check if we got any data
    const hasData = Object.values(allData).some(formatData => 
      Object.values(formatData).some(positionData => positionData.length > 0)
    );
    
    if (!hasData) {
      console.log('\n❌ No data was successfully fetched!');
      console.log('All API calls returned empty results.');
      process.exit(1);
    }
    
    // Generate new sample data file
    const fileContent = generateSampleDataFile(allData);
    saveSampleDataFile(fileContent);
    
    // Show summary
    generateSummary(allData);
    
    console.log('\n🎉 SUCCESS!');
    console.log('─'.repeat(60));
    console.log('✅ Sample data has been updated with real FantasyPros data');
    console.log('✅ All scoring formats are now supported');
    console.log('✅ Fallback data is now current and accurate');
    console.log('✅ Backward compatibility maintained');
    
    console.log('\n📝 What to do next:');
    console.log('• Test the application to ensure everything works');
    console.log('• The draft-tiers page will now show current data even when offline');
    console.log('• Update any references to old sample data structure if needed');
    console.log('• Consider running this script periodically to keep sample data fresh');
    
  } catch (error) {
    console.error('\n💥 SCRIPT FAILED:', error);
    console.log('\nPlease check:');
    console.log('• Development server is running (npm run dev)');
    console.log('• FantasyPros credentials are correct');
    console.log('• No network connectivity issues');
    process.exit(1);
  }
}

main().catch(console.error);