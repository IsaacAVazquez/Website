#!/usr/bin/env node

/**
 * Enhanced NFL player image scraper with multiple sources
 * Sources: ESPN, NFL.com, Pro Football Reference
 * Run with: node scripts/enhanced-player-scraper.js
 */

const fs = require('fs').promises;
const path = require('path');

// Team mappings for different sources
const ESPN_TEAMS = {
  'ARI': 'cardinals', 'ATL': 'falcons', 'BAL': 'ravens', 'BUF': 'bills',
  'CAR': 'panthers', 'CHI': 'bears', 'CIN': 'bengals', 'CLE': 'browns',
  'DAL': 'cowboys', 'DEN': 'broncos', 'DET': 'lions', 'GB': 'packers',
  'HOU': 'texans', 'IND': 'colts', 'JAX': 'jaguars', 'KC': 'chiefs',
  'LV': 'raiders', 'LAC': 'chargers', 'LAR': 'rams', 'MIA': 'dolphins',
  'MIN': 'vikings', 'NE': 'patriots', 'NO': 'saints', 'NYG': 'giants',
  'NYJ': 'jets', 'PHI': 'eagles', 'PIT': 'steelers', 'SF': '49ers',
  'SEA': 'seahawks', 'TB': 'buccaneers', 'TEN': 'titans', 'WAS': 'commanders'
};

const NFL_TEAMS = {
  'ARI': 'ARI', 'ATL': 'ATL', 'BAL': 'BAL', 'BUF': 'BUF',
  'CAR': 'CAR', 'CHI': 'CHI', 'CIN': 'CIN', 'CLE': 'CLE',
  'DAL': 'DAL', 'DEN': 'DEN', 'DET': 'DET', 'GB': 'GB',
  'HOU': 'HOU', 'IND': 'IND', 'JAX': 'JAX', 'KC': 'KC',
  'LV': 'LV', 'LAC': 'LAC', 'LAR': 'LAR', 'MIA': 'MIA',
  'MIN': 'MIN', 'NE': 'NE', 'NO': 'NO', 'NYG': 'NYG',
  'NYJ': 'NYJ', 'PHI': 'PHI', 'PIT': 'PIT', 'SF': 'SF',
  'SEA': 'SEA', 'TB': 'TB', 'TEN': 'TEN', 'WAS': 'WAS'
};

const PRIORITY_POSITIONS = ['QB', 'RB', 'WR', 'TE'];
const IMAGE_DIR = path.join(process.cwd(), 'public', 'player-images');
const MAPPING_FILE = path.join(process.cwd(), 'src', 'data', 'player-images.json');

class PlayerImageScraper {
  constructor() {
    this.downloadedImages = new Set();
    this.playerMapping = {};
    this.errors = [];
  }

  async ensureDirectories() {
    await fs.mkdir(IMAGE_DIR, { recursive: true });
    await fs.mkdir(path.dirname(MAPPING_FILE), { recursive: true });
  }

  generateLocalImagePath(playerName, teamAbbr) {
    const sanitizedName = playerName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `${teamAbbr.toLowerCase()}-${sanitizedName}.jpg`;
  }

  async downloadImage(imageUrl, localPath, retries = 3) {
    if (this.downloadedImages.has(localPath)) {
      return true; // Already downloaded
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/webp,image/jpeg,image/png,*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        if (buffer.byteLength < 1000) {
          throw new Error('Image too small (likely placeholder)');
        }

        const fullPath = path.join(IMAGE_DIR, localPath);
        await fs.writeFile(fullPath, Buffer.from(buffer));
        
        this.downloadedImages.add(localPath);
        console.log(`✅ Downloaded: ${localPath}`);
        return true;

      } catch (error) {
        console.log(`❌ Attempt ${attempt}/${retries} failed for ${localPath}: ${error.message}`);
        if (attempt === retries) {
          this.errors.push(`Failed to download ${localPath}: ${error.message}`);
          return false;
        }
        await this.delay(1000 * attempt); // Exponential backoff
      }
    }
    return false;
  }

  async scrapeESPN(teamAbbr) {
    const teamName = ESPN_TEAMS[teamAbbr];
    if (!teamName) return [];

    const url = `https://www.espn.com/nfl/team/roster/_/name/${teamAbbr.toLowerCase()}/${teamName}`;
    
    try {
      console.log(`🔍 Scraping ESPN for ${teamAbbr}...`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const html = await response.text();
      return this.parseESPNRoster(html, teamAbbr);
    } catch (error) {
      console.error(`ESPN scraping failed for ${teamAbbr}:`, error.message);
      return [];
    }
  }

  parseESPNRoster(html, teamAbbr) {
    const players = [];
    
    // Enhanced regex patterns for ESPN
    const playerTableRegex = /<tr[^>]*class="[^"]*Table__TR[^"]*"[^>]*>(.*?)<\/tr>/gs;
    const playerCellRegex = /<td[^>]*>(.*?)<\/td>/gs;
    const imageRegex = /<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/g;
    const playerLinkRegex = /<a[^>]+href="[^"]*\/nfl\/player\/[^"]*\/([^"\/]+)"[^>]*>([^<]+)<\/a>/g;

    let tableMatch;
    while ((tableMatch = playerTableRegex.exec(html)) !== null) {
      const row = tableMatch[1];
      
      // Extract player info from table row
      const cells = [];
      let cellMatch;
      while ((cellMatch = playerCellRegex.exec(row)) !== null) {
        cells.push(cellMatch[1]);
      }

      if (cells.length >= 3) {
        // Look for player name and image in the cells
        let playerName = null;
        let imageUrl = null;
        let position = null;

        for (const cell of cells) {
          // Check for player link
          const playerMatch = playerLinkRegex.exec(cell);
          if (playerMatch) {
            playerName = playerMatch[2].trim();
          }

          // Check for image
          const imgMatch = imageRegex.exec(cell);
          if (imgMatch && imgMatch[1].includes('player')) {
            imageUrl = imgMatch[1];
          }

          // Check for position
          if (/^(QB|RB|WR|TE|K|DEF|DST)$/i.test(cell.trim())) {
            position = cell.trim().toUpperCase();
          }
        }

        if (playerName && imageUrl) {
          players.push({
            name: playerName,
            team: teamAbbr,
            position: position || 'UNKNOWN',
            imageUrl: imageUrl.replace(/&amp;/g, '&'),
            localImagePath: this.generateLocalImagePath(playerName, teamAbbr),
            source: 'ESPN'
          });
        }
      }
    }

    return players;
  }

  async scrapeNFLcom(teamAbbr) {
    try {
      console.log(`🔍 Scraping NFL.com for ${teamAbbr}...`);
      
      const url = `https://www.nfl.com/teams/${teamAbbr.toLowerCase()}/roster/`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const html = await response.text();
      return this.parseNFLRoster(html, teamAbbr);
    } catch (error) {
      console.error(`NFL.com scraping failed for ${teamAbbr}:`, error.message);
      return [];
    }
  }

  parseNFLRoster(html, teamAbbr) {
    const players = [];
    
    // NFL.com player card pattern
    const playerCardRegex = /<div[^>]*class="[^"]*nfl-o-roster__player[^"]*"[^>]*>(.*?)<\/div>/gs;
    const nameRegex = /<span[^>]*class="[^"]*nfl-o-roster__player-name[^"]*"[^>]*>([^<]+)<\/span>/;
    const imageRegex = /<img[^>]+src="([^"]+)"[^>]*>/;
    const positionRegex = /<span[^>]*class="[^"]*position[^"]*"[^>]*>([^<]+)<\/span>/i;

    let cardMatch;
    while ((cardMatch = playerCardRegex.exec(html)) !== null) {
      const card = cardMatch[1];
      
      const nameMatch = nameRegex.exec(card);
      const imageMatch = imageRegex.exec(card);
      const positionMatch = positionRegex.exec(card);

      if (nameMatch && imageMatch) {
        const playerName = nameMatch[1].trim();
        const imageUrl = imageMatch[1];
        const position = positionMatch ? positionMatch[1].trim().toUpperCase() : 'UNKNOWN';

        players.push({
          name: playerName,
          team: teamAbbr,
          position,
          imageUrl,
          localImagePath: this.generateLocalImagePath(playerName, teamAbbr),
          source: 'NFL.com'
        });
      }
    }

    return players;
  }

  async scrapeTeam(teamAbbr) {
    const allPlayers = [];
    
    // Try ESPN first (usually has better images)
    const espnPlayers = await this.scrapeESPN(teamAbbr);
    allPlayers.push(...espnPlayers);

    // Try NFL.com for additional players
    const nflPlayers = await this.scrapeNFLcom(teamAbbr);
    
    // Merge results, prioritizing ESPN
    const existingNames = new Set(espnPlayers.map(p => p.name.toLowerCase()));
    const newNFLPlayers = nflPlayers.filter(p => !existingNames.has(p.name.toLowerCase()));
    allPlayers.push(...newNFLPlayers);

    // Filter for priority positions first, then add others
    const priorityPlayers = allPlayers.filter(p => PRIORITY_POSITIONS.includes(p.position));
    const otherPlayers = allPlayers.filter(p => !PRIORITY_POSITIONS.includes(p.position));
    
    return [...priorityPlayers, ...otherPlayers];
  }

  async downloadPlayerImages(players) {
    const downloadPromises = players.map(async (player) => {
      if (player.imageUrl && player.localImagePath) {
        const success = await this.downloadImage(player.imageUrl, player.localImagePath);
        if (success) {
          const key = `${player.name}-${player.team}`.toLowerCase();
          this.playerMapping[key] = {
            name: player.name,
            team: player.team,
            position: player.position,
            imagePath: player.localImagePath,
            source: player.source
          };
        }
      }
    });

    await Promise.all(downloadPromises);
  }

  async savePlayerMapping() {
    await fs.writeFile(MAPPING_FILE, JSON.stringify(this.playerMapping, null, 2));
    console.log(`\n💾 Saved mapping for ${Object.keys(this.playerMapping).length} players`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run() {
    console.log('🏈 Starting enhanced NFL player image scraping...\n');
    
    try {
      await this.ensureDirectories();
      
      const teams = Object.keys(ESPN_TEAMS);
      let totalPlayers = 0;

      for (const team of teams) {
        console.log(`\n📊 Processing ${team}...`);
        
        const players = await this.scrapeTeam(team);
        console.log(`Found ${players.length} players for ${team}`);
        
        if (players.length > 0) {
          await this.downloadPlayerImages(players);
          totalPlayers += players.length;
        }
        
        // Rate limiting between teams
        await this.delay(2000);
      }

      await this.savePlayerMapping();
      
      console.log('\n🎉 Scraping completed!');
      console.log(`📈 Statistics:`);
      console.log(`  - Teams processed: ${teams.length}`);
      console.log(`  - Total players found: ${totalPlayers}`);
      console.log(`  - Images downloaded: ${this.downloadedImages.size}`);
      console.log(`  - Errors: ${this.errors.length}`);
      
      if (this.errors.length > 0) {
        console.log('\n⚠️  Errors:');
        this.errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
        if (this.errors.length > 10) {
          console.log(`  ... and ${this.errors.length - 10} more errors`);
        }
      }

      console.log('\n📁 Files:');
      console.log(`  - Images: public/player-images/`);
      console.log(`  - Mapping: src/data/player-images.json`);
      
    } catch (error) {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    }
  }
}

// Run the enhanced scraper
const scraper = new PlayerImageScraper();
scraper.run();