#!/usr/bin/env node

/**
 * FantasyPros Image Scraper
 * Fallback scraper for players not found via ESPN
 */

const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

const streamPipeline = promisify(pipeline);

// Load current images to avoid duplicates
function getCurrentImages() {
  const imagesDir = path.join(__dirname, '../public/player-images');
  if (!fs.existsSync(imagesDir)) {
    return new Set();
  }
  return new Set(fs.readdirSync(imagesDir));
}

// Load failed players from ESPN scraper
function getFailedPlayers() {
  const resultsPath = path.join(__dirname, '../tmp/espn-scrape-results.json');
  if (fs.existsSync(resultsPath)) {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    return results.failed || [];
  }
  
  // Fallback to all high-priority players
  const missingPlayersPath = path.join(__dirname, '../tmp/missing-players.json');
  const missingPlayersData = JSON.parse(fs.readFileSync(missingPlayersPath, 'utf8'));
  return missingPlayersData.highPriority || missingPlayersData.all.slice(0, 50);
}

async function scrapeFantasyProsImages(players, maxPlayers = 30) {
  console.log(`🏈 Starting FantasyPros image scraper for ${Math.min(players.length, maxPlayers)} players...\n`);
  
  const outputDir = path.join(__dirname, '../public/player-images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const currentImages = getCurrentImages();
  const results = {
    successful: [],
    failed: [],
    skipped: [],
    total: 0
  };
  
  const limitedPlayers = players.slice(0, maxPlayers);
  
  for (let i = 0; i < limitedPlayers.length; i++) {
    const player = limitedPlayers[i];
    console.log(`[${i + 1}/${limitedPlayers.length}] ${player.name} (${player.team})...`);
    
    // Generate expected filename
    const sanitizedName = player.name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const imagePath = `${player.team.toLowerCase()}-${sanitizedName}.jpg`;
    
    // Skip if we already have this image
    if (currentImages.has(imagePath)) {
      results.skipped.push({ ...player, imagePath, reason: 'Already exists' });
      console.log(`   ⏭️  Skipped: Image already exists`);
      results.total++;
      continue;
    }
    
    const imageResult = await findFantasyProsImage(player, outputDir, imagePath);
    
    if (imageResult.success) {
      results.successful.push({
        ...player,
        imagePath: imageResult.imagePath,
        imageUrl: imageResult.imageUrl,
        source: 'fantasypros'
      });
      console.log(`   ✅ Downloaded: ${imageResult.imagePath}`);
    } else {
      results.failed.push({
        ...player,
        reason: imageResult.reason
      });
      console.log(`   ❌ Failed: ${imageResult.reason}`);
    }
    
    results.total++;
    
    // Add delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 FantasyPros Scraping Results:');
  console.log(`✅ Successful: ${results.successful.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`📈 Success rate: ${Math.round((results.successful.length / (results.total - results.skipped.length)) * 100)}%`);
  
  // Save results
  const resultPath = path.join(__dirname, '../tmp/fantasypros-scrape-results.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
  console.log(`\n📁 Results saved to: ${resultPath}`);
  
  return results;
}

async function findFantasyProsImage(player, outputDir, imagePath) {
  const fullPath = path.join(outputDir, imagePath);
  
  // Generate FantasyPros player profile URLs to try
  const fantasyProsUrls = generateFantasyProsUrls(player);
  
  for (const profileUrl of fantasyProsUrls) {
    try {
      console.log(`     🔍 Trying: ${profileUrl}`);
      
      const response = await fetch(profileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      if (!response.ok) continue;
      
      const html = await response.text();
      
      // Extract player image URLs from the HTML
      const imageUrl = extractPlayerImageFromHtml(html, player);
      
      if (imageUrl) {
        console.log(`     🖼️  Found image URL: ${imageUrl}`);
        
        // Download the image
        const downloadResult = await downloadImage(imageUrl, fullPath);
        if (downloadResult.success) {
          return {
            success: true,
            imagePath,
            imageUrl,
            profileUrl
          };
        }
      }
      
    } catch (error) {
      console.log(`     ⚠️  Error with ${profileUrl}: ${error.message}`);
      continue;
    }
    
    // Small delay between profile attempts
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return {
    success: false,
    reason: 'No valid image found on FantasyPros'
  };
}

function generateFantasyProsUrls(player) {
  const urls = [];
  
  // Clean player name for URLs
  const cleanName = player.name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Try different FantasyPros URL patterns
  const positionMap = {
    'QB': 'qb',
    'RB': 'rb', 
    'WR': 'wr',
    'TE': 'te',
    'K': 'k',
    'DST': 'dst'
  };
  
  const position = positionMap[player.position] || 'player';
  
  // Common FantasyPros URL patterns
  urls.push(`https://www.fantasypros.com/nfl/players/${cleanName}.php`);
  urls.push(`https://www.fantasypros.com/nfl/players/${cleanName}-${player.team.toLowerCase()}.php`);
  urls.push(`https://www.fantasypros.com/nfl/${position}/${cleanName}.php`);
  
  // Alternative name formats
  const nameVariations = [
    cleanName,
    cleanName.replace(/-jr$/g, ''),
    cleanName.replace(/-sr$/g, ''),
    cleanName.replace(/-ii$/g, ''),
    cleanName.replace(/-iii$/g, '')
  ];
  
  for (const nameVar of nameVariations) {
    if (nameVar !== cleanName) {
      urls.push(`https://www.fantasypros.com/nfl/players/${nameVar}.php`);
    }
  }
  
  return [...new Set(urls)]; // Remove duplicates
}

function extractPlayerImageFromHtml(html, player) {
  // Try multiple patterns to find player images in FantasyPros HTML
  const imagePatterns = [
    // Player profile image
    /<img[^>]*class="[^"]*player-image[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*src="([^"]+)"[^>]*class="[^"]*player-image[^"]*"/i,
    
    // Headshot patterns
    /<img[^>]*class="[^"]*headshot[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*src="([^"]+)"[^>]*class="[^"]*headshot[^"]*"/i,
    
    // Profile photo patterns
    /<img[^>]*class="[^"]*profile[^"]*"[^>]*src="([^"]+)"/i,
    
    // Generic image near player name
    new RegExp(`<img[^>]*src="([^"]*player[^"]*${player.name.split(' ')[0]}[^"]*)"`, 'i'),
    
    // ESPN CDN images embedded in FantasyPros
    /src="(https:\/\/a\.espncdn\.com\/[^"]*headshots[^"]*\.(?:jpg|png))"/i,
    
    // FantasyPros CDN images  
    /src="(https:\/\/[^"]*fantasypros[^"]*\.com\/[^"]*images[^"]*\.(?:jpg|png))"/i
  ];
  
  for (const pattern of imagePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let imageUrl = match[1];
      
      // Convert relative URLs to absolute
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      } else if (imageUrl.startsWith('/')) {
        imageUrl = 'https://www.fantasypros.com' + imageUrl;
      }
      
      // Skip generic/placeholder images
      if (!imageUrl.includes('placeholder') && 
          !imageUrl.includes('default') && 
          !imageUrl.includes('no-image')) {
        return imageUrl;
      }
    }
  }
  
  return null;
}

async function downloadImage(imageUrl, fullPath) {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.fantasypros.com/'
      }
    });
    
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
      return { success: false, reason: 'Invalid image response' };
    }
    
    const fileStream = createWriteStream(fullPath);
    await streamPipeline(response.body, fileStream);
    
    // Verify the image was downloaded and has content
    const stats = fs.statSync(fullPath);
    if (stats.size > 1000) { // At least 1KB
      return { success: true };
    } else {
      fs.unlinkSync(fullPath);
      return { success: false, reason: 'Downloaded image too small' };
    }
    
  } catch (error) {
    return { success: false, reason: `Download error: ${error.message}` };
  }
}

async function main() {
  console.log('🚀 FantasyPros Image Scraper Starting...\n');
  
  const failedPlayers = getFailedPlayers();
  console.log(`📋 Found ${failedPlayers.length} players to scrape from FantasyPros`);
  
  const results = await scrapeFantasyProsImages(failedPlayers, 50); // Process 50 players
  
  if (results.successful.length > 0) {
    console.log('\n✅ Successfully downloaded images for:');
    results.successful.forEach(player => {
      console.log(`   ${player.name} (${player.team}) -> ${player.imagePath}`);
    });
  }
  
  return results;
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, scrapeFantasyProsImages };