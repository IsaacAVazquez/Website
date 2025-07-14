#!/usr/bin/env node

/**
 * Manual script to update fantasy football data
 * Run with: node scripts/update-data.js
 */

async function updateData() {
  console.log('🏈 Starting Fantasy Football data update...\n');
  
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('❌ CRON_SECRET environment variable not set');
    console.log('Please set CRON_SECRET in your .env.local file');
    process.exit(1);
  }
  
  try {
    console.log(`📡 Calling scheduled update API at ${baseUrl}/api/scheduled-update`);
    
    const response = await fetch(`${baseUrl}/api/scheduled-update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('\n✅ Update completed successfully!');
    console.log(`⏱️  Execution time: ${result.executionTimeMs}ms`);
    console.log(`📅 Timestamp: ${result.timestamp}`);
    
    // Display position results
    console.log('\n📊 Position Updates:');
    Object.entries(result.positions).forEach(([position, formats]) => {
      console.log(`\n${position}:`);
      Object.entries(formats).forEach(([format, data]) => {
        if (data.updated) {
          console.log(`  ✓ ${format}: ${data.count} players`);
        } else {
          console.log(`  ✗ ${format}: ${data.error}`);
        }
      });
    });
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errors.forEach(err => {
        console.log(`  - ${err.position}: ${err.error}`);
      });
    }
    
    console.log('\n🎉 Data update and persistence complete!');
    console.log('The data files have been updated and will persist across server restarts.');
    
  } catch (error) {
    console.error('\n❌ Update failed:', error.message);
    process.exit(1);
  }
}

// Run the update
updateData();