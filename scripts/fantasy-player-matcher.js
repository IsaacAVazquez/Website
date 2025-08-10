#!/usr/bin/env node

/**
 * Fantasy Player Matcher
 * Creates verified player mappings using multiple reliable sources
 */

const fs = require('fs');
const path = require('path');

// Load our fantasy player data
function loadFantasyPlayers() {
  const dataDir = path.join(__dirname, '../src/data');
  const files = ['qbData.ts', 'rbData.ts', 'wrData.ts', 'teData.ts', 'kData.ts', 'dstData.ts'];
  
  const allPlayers = [];
  
  files.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const position = file.replace('Data.ts', '').toUpperCase();
      
      // Extract player objects
      const playerMatches = content.match(/{[\s\S]*?}/g) || [];
      
      playerMatches.forEach(playerBlock => {
        const nameMatch = playerBlock.match(/name:\s*['"]([^'"]+)['"]/);
        const teamMatch = playerBlock.match(/team:\s*['"]([^'"]+)['"]/);
        const idMatch = playerBlock.match(/id:\s*['"]([^'"]+)['"]/);
        
        if (nameMatch && teamMatch) {
          allPlayers.push({
            id: idMatch ? idMatch[1] : null,
            name: nameMatch[1],
            team: teamMatch[1],
            position: position,
            source: file
          });
        }
      });
    }
  });
  
  return allPlayers;
}

// Check what images we currently have
function getCurrentImages() {
  const imageDir = path.join(__dirname, '../public/player-images');
  const images = {};
  
  if (fs.existsSync(imageDir)) {
    const files = fs.readdirSync(imageDir);
    files.forEach(file => {
      if (file.endsWith('.jpg') || file.endsWith('.png')) {
        const key = file.replace(/\.(jpg|png)$/, '');
        images[key] = file;
      }
    });
  }
  
  return images;
}

// Generate player image search URLs for multiple sources
function generateImageSearchUrls(player) {
  const cleanName = player.name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const team = player.team.toUpperCase();
  
  return {
    // ESPN player search
    espnSearch: `https://www.espn.com/nfl/players/_/search/${encodeURIComponent(cleanName)}`,
    
    // NFL.com player search  
    nflSearch: `https://www.nfl.com/players/${encodeURIComponent(cleanName.toLowerCase().replace(/\s+/g, '-'))}/`,
    
    // Pro Football Reference
    pfrSearch: `https://www.pro-football-reference.com/players/${cleanName.charAt(0).toLowerCase()}/${cleanName.replace(/\s+/g, '').toLowerCase()}01.htm`,
    
    // Official team website patterns
    teamSearch: generateTeamWebsiteUrl(player, team),
    
    // Sports Reference
    sportsRef: `https://www.sports-reference.com/cfb/players/${cleanName.toLowerCase().replace(/\s+/g, '-')}-1.html`
  };
}

function generateTeamWebsiteUrl(player, team) {
  const teamUrls = {
    'ARI': 'azcardinals.com',
    'ATL': 'atlantafalcons.com', 
    'BAL': 'baltimoreravens.com',
    'BUF': 'buffalobills.com',
    'CAR': 'panthers.com',
    'CHI': 'chicagobears.com',
    'CIN': 'bengals.com',
    'CLE': 'clevelandbrowns.com',
    'DAL': 'dallascowboys.com',
    'DEN': 'denverbroncos.com',
    'DET': 'detroitlions.com',
    'GB': 'packers.com',
    'HOU': 'houstontexans.com',
    'IND': 'colts.com',
    'JAX': 'jaguars.com',
    'KC': 'chiefs.com',
    'LV': 'raiders.com',
    'LAC': 'chargers.com',
    'LAR': 'therams.com',
    'MIA': 'miamidolphins.com',
    'MIN': 'vikings.com',
    'NE': 'patriots.com',
    'NO': 'neworleanssaints.com',
    'NYG': 'giants.com',
    'NYJ': 'newyorkjets.com',
    'PHI': 'philadelphiaeagles.com',
    'PIT': 'steelers.com',
    'SF': '49ers.com',
    'SEA': 'seahawks.com',
    'TB': 'buccaneers.com',
    'TEN': 'titansonline.com',
    'WAS': 'commanders.com'
  };
  
  const domain = teamUrls[team];
  if (domain) {
    const cleanName = player.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `https://www.${domain}/team/players-roster/${cleanName}`;
  }
  
  return null;
}

async function findPlayerImage(player) {
  console.log(`🔍 Finding image for: ${player.name} (${player.team}) - ${player.position}`);
  
  const searchUrls = generateImageSearchUrls(player);
  
  // Try ESPN first (most reliable)
  try {
    const espnResult = await searchESPNPlayer(player, searchUrls.espnSearch);
    if (espnResult.imageUrl) {
      console.log(`   ✅ Found ESPN image: ${espnResult.imageUrl}`);
      return {
        success: true,
        imageUrl: espnResult.imageUrl,
        source: 'espn',
        playerUrl: espnResult.playerUrl,
        verification: espnResult.verification
      };
    }
  } catch (error) {
    console.log(`   ⚠️  ESPN search failed: ${error.message}`);
  }
  
  // Try Pro Football Reference  
  try {
    const pfrResult = await searchPFRPlayer(player, searchUrls.pfrSearch);
    if (pfrResult.imageUrl) {
      console.log(`   ✅ Found PFR image: ${pfrResult.imageUrl}`);
      return {
        success: true,
        imageUrl: pfrResult.imageUrl,
        source: 'pfr',
        playerUrl: pfrResult.playerUrl
      };
    }
  } catch (error) {
    console.log(`   ⚠️  PFR search failed: ${error.message}`);
  }
  
  console.log(`   ❌ No image found for ${player.name}`);
  return { success: false };
}

async function searchESPNPlayer(player, searchUrl) {
  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const html = await response.text();
  
  // Look for ESPN player profile images
  const imageRegex = /src="([^"]*i\/headshots\/nfl\/players\/full\/\d+\.(png|jpg))"/i;
  const imageMatch = html.match(imageRegex);
  
  // Verify this is the right player by checking team and position
  const teamMatch = html.match(new RegExp(player.team, 'i'));
  const posMatch = html.match(new RegExp(player.position, 'i'));
  
  if (imageMatch && teamMatch && posMatch) {
    return {
      imageUrl: imageMatch[1].startsWith('//') ? 'https:' + imageMatch[1] : imageMatch[1],
      playerUrl: searchUrl,
      verification: { team: !!teamMatch, position: !!posMatch }
    };
  }
  
  return { imageUrl: null };
}

async function searchPFRPlayer(player, searchUrl) {
  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const html = await response.text();
  
  // Look for Pro Football Reference images
  const imageRegex = /src="([^"]*\/req\/\d+\/images\/headshots\/[^"]*\.(jpg|png))"/i;
  const imageMatch = html.match(imageRegex);
  
  if (imageMatch) {
    return {
      imageUrl: imageMatch[1].startsWith('//') ? 'https:' + imageMatch[1] : imageMatch[1],
      playerUrl: searchUrl
    };
  }
  
  return { imageUrl: null };
}

async function downloadPlayerImage(imageUrl, player) {
  const sanitizedName = player.name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const filename = `${player.team.toLowerCase()}-${sanitizedName}.jpg`;
  const filepath = path.join(__dirname, '../public/player-images', filename);
  
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://www.espn.com/'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
    
    // Verify file was created and has reasonable size
    const stats = fs.statSync(filepath);
    if (stats.size < 1000) {
      fs.unlinkSync(filepath);
      throw new Error('Downloaded image too small');
    }
    
    return {
      success: true,
      filename,
      size: stats.size
    };
    
  } catch (error) {
    throw new Error(`Download failed: ${error.message}`);
  }
}

async function processPlayers(players, maxPlayers = 50) {
  console.log(`🚀 Processing ${Math.min(players.length, maxPlayers)} fantasy players...\n`);
  
  const results = {
    successful: [],
    failed: [],
    skipped: [],
    total: 0
  };
  
  const currentImages = getCurrentImages();
  const playersToProcess = players.slice(0, maxPlayers);
  
  for (let i = 0; i < playersToProcess.length; i++) {
    const player = playersToProcess[i];
    console.log(`\\n[${i + 1}/${playersToProcess.length}] Processing ${player.name}...`);
    
    // Check if we already have an image
    const expectedKey = `${player.team.toLowerCase()}-${player.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`;
    
    if (currentImages[expectedKey]) {
      results.skipped.push({
        ...player,
        reason: 'Image already exists',
        filename: currentImages[expectedKey]
      });
      console.log(`   ⏭️  Skipped: Already have image`);
      results.total++;
      continue;
    }
    
    try {
      const imageResult = await findPlayerImage(player);
      
      if (imageResult.success) {
        const downloadResult = await downloadPlayerImage(imageResult.imageUrl, player);
        
        results.successful.push({
          ...player,
          imageUrl: imageResult.imageUrl,
          filename: downloadResult.filename,
          source: imageResult.source,
          size: downloadResult.size,
          verification: imageResult.verification
        });
        console.log(`   ✅ Downloaded: ${downloadResult.filename} (${downloadResult.size} bytes)`);
      } else {
        results.failed.push({
          ...player,
          reason: 'No image found'
        });
        console.log(`   ❌ Failed: No image found`);
      }
      
    } catch (error) {
      results.failed.push({
        ...player,
        reason: error.message
      });
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    results.total++;
    
    // Be respectful to servers
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Save results
  const resultPath = path.join(__dirname, '../tmp/fantasy-image-results.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
  
  console.log('\\n📊 Fantasy Player Image Collection Results:');
  console.log('===========================================');
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`📈 Success rate: ${Math.round((results.successful.length / (results.total - results.skipped.length)) * 100)}%`);
  console.log(`📁 Results saved to: ${resultPath}`);
  
  return results;
}

async function main() {
  console.log('🚀 Fantasy Player Image Matcher Starting...\\n');
  
  const fantasyPlayers = loadFantasyPlayers();
  console.log(`📊 Loaded ${fantasyPlayers.length} fantasy players from data files`);
  
  // Focus on high-priority positions first
  const priorityPlayers = fantasyPlayers.filter(p => 
    ['QB', 'RB', 'WR', 'TE'].includes(p.position)
  );
  
  console.log(`🎯 Processing ${priorityPlayers.length} high-priority players (QB/RB/WR/TE)`);
  
  const results = await processPlayers(priorityPlayers, 30); // Start with 30 players
  
  if (results.successful.length > 0) {
    console.log('\\n✅ Successfully downloaded images for:');
    results.successful.forEach(player => {
      console.log(`   ${player.name} (${player.team}) -> ${player.filename} [${player.source}]`);
    });
  }
  
  return results;
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, loadFantasyPlayers, findPlayerImage };