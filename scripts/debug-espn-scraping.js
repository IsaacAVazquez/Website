#!/usr/bin/env node

/**
 * Debug script to examine ESPN HTML structure
 * Run with: node scripts/debug-espn-scraping.js
 */

const fs = require('fs').promises;

async function debugESPNPage() {
  console.log('🔍 Debugging ESPN HTML structure...\n');
  
  try {
    // Test with Buffalo Bills
    const testUrl = 'https://www.espn.com/nfl/team/roster/_/name/buf/buffalo-bills';
    
    console.log(`Fetching: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    console.log(`✅ Successfully fetched HTML (${html.length} characters)\n`);
    
    // Save HTML for inspection
    await fs.writeFile('debug-espn.html', html);
    console.log('📄 Saved HTML to debug-espn.html for inspection\n');
    
    // Look for image patterns
    console.log('🔍 Looking for image patterns...');
    
    const imagePatterns = [
      /<img[^>]+src="([^"]+)"[^>]*>/g,
      /<img[^>]+data-mptype="playerImage"[^>]+src="([^"]+)"[^>]*>/g,
      /<img[^>]*class="[^"]*player[^"]*"[^>]+src="([^"]+)"[^>]*>/g,
      /<picture[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>/g
    ];
    
    imagePatterns.forEach((pattern, index) => {
      const matches = [...html.matchAll(pattern)];
      console.log(`Pattern ${index + 1}: Found ${matches.length} image matches`);
      if (matches.length > 0) {
        console.log('Sample URLs:', matches.slice(0, 3).map(m => m[1]));
      }
    });
    
    // Look for player name patterns
    console.log('\n🔍 Looking for player name patterns...');
    
    const namePatterns = [
      /<a[^>]+href="\/nfl\/player\/[^"]*"[^>]*>([^<]+)<\/a>/g,
      /<td[^>]*>([A-Z][a-z]+ [A-Z][a-z]+)<\/td>/g,
      /class="[^"]*player[^"]*"[^>]*>([^<]+)</g
    ];
    
    namePatterns.forEach((pattern, index) => {
      const matches = [...html.matchAll(pattern)];
      console.log(`Name Pattern ${index + 1}: Found ${matches.length} matches`);
      if (matches.length > 0) {
        console.log('Sample names:', matches.slice(0, 5).map(m => m[1]));
      }
    });
    
    // Look for table structure
    console.log('\n🔍 Looking for table structure...');
    const tableMatches = html.match(/<table[^>]*>[\s\S]*?<\/table>/g);
    console.log(`Found ${tableMatches ? tableMatches.length : 0} tables`);
    
    // Look for specific ESPN classes or data attributes
    console.log('\n🔍 Looking for ESPN-specific patterns...');
    const espnPatterns = [
      /data-[^=]*="[^"]*player[^"]*"/g,
      /class="[^"]*Table[^"]*"/g,
      /class="[^"]*Roster[^"]*"/g,
      /class="[^"]*Player[^"]*"/g
    ];
    
    espnPatterns.forEach((pattern, index) => {
      const matches = [...html.matchAll(pattern)];
      console.log(`ESPN Pattern ${index + 1}: Found ${matches.length} matches`);
      if (matches.length > 0) {
        console.log('Sample:', matches.slice(0, 3).map(m => m[0]));
      }
    });
    
    console.log('\n✅ Debug complete! Check debug-espn.html file to inspect the HTML structure.');
    
  } catch (error) {
    console.error('\n❌ Debug failed:', error.message);
    process.exit(1);
  }
}

// Run the debug
debugESPNPage();