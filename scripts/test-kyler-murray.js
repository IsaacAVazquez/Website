#!/usr/bin/env node

// Test script to debug Kyler Murray image loading specifically
const PlayerImageService = require('../src/lib/playerImageService.ts');

async function testKylerMurray() {
  console.log('🧪 Testing Kyler Murray image loading...\n');
  
  const testCases = [
    { name: 'Kyler Murray', team: 'ARI' },
    { name: 'Kyler Murray', team: 'ari' },
    { name: 'kyler murray', team: 'ARI' },
    { name: 'kylermurray', team: 'ARI' },
    { name: 'K. Murray', team: 'ARI' },
  ];
  
  for (const testCase of testCases) {
    console.log(`Testing: "${testCase.name}" (${testCase.team})`);
    
    try {
      const imageUrl = await PlayerImageService.default.getPlayerImageUrl({
        name: testCase.name,
        team: testCase.team
      });
      
      if (imageUrl) {
        console.log(`✅ Found: ${imageUrl}`);
      } else {
        console.log(`❌ Not found`);
      }
    } catch (error) {
      console.log(`💥 Error: ${error.message}`);
    }
    
    console.log('');
  }
}

testKylerMurray();