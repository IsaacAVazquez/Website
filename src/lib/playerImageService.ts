import { Player } from '@/types';
import playerImagesMapping from '@/data/player-images.json';
import playerTeamUpdates from '@/data/player-team-updates.json';

interface PlayerImageMapping {
  [key: string]: string; // Direct mapping from player key to image path
}

class PlayerImageService {
  private static mapping: PlayerImageMapping | null = null;
  private static loadPromise: Promise<void> | null = null;

  static async loadMapping(): Promise<void> {
    if (this.mapping) return;
    
    if (this.loadPromise) {
      await this.loadPromise;
      return;
    }

    this.loadPromise = this.doLoadMapping();
    await this.loadPromise;
  }

  private static async doLoadMapping(): Promise<void> {
    try {
      // Use the static import instead of fetching from API
      this.mapping = playerImagesMapping as PlayerImageMapping;
    } catch (error) {
      console.warn('Failed to load player images mapping:', error);
      this.mapping = {};
    }
  }

  static async getPlayerImageUrl(player: Player): Promise<string | null> {
    await this.loadMapping();
    
    if (!this.mapping) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚨 PlayerImageService: No mapping loaded');
      }
      return null;
    }

    // Try different name variations
    const variations = this.generateNameVariations(player.name, player.team);
    
    // Enhanced debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔍 PlayerImageService: Looking for ${player.name} (${player.team})`);
      console.log(`📊 Total mapping entries: ${Object.keys(this.mapping).length}`);
      console.log(`🔄 Generated ${variations.length} name variations`);
      console.log(`📝 First 5 variations:`, variations.slice(0, 5));
    }
    
    for (const variation of variations) {
      const mapped = this.mapping[variation];
      if (mapped) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ MATCH FOUND: "${variation}" -> "${mapped}"`);
          console.groupEnd();
        }
        return mapped; // Our mapping already includes the full path
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn(`❌ NO MATCH: ${player.name} (${player.team})`);
      console.log(`🔍 Sample mapping keys:`, Object.keys(this.mapping).slice(0, 10));
      console.groupEnd();
    }
    return null;
  }

  private static generateNameVariations(name: string, team: string): string[] {
    const cleanName = name.trim();
    const teamUpper = team.toUpperCase();
    
    // Generate base name variations
    const baseVariations = [
      cleanName,
      cleanName.replace(/\./g, ''), // Remove periods
      cleanName.replace(/'/g, ''), // Remove apostrophes  
      cleanName.replace(/'/g, ''), // Remove smart quotes
      cleanName.replace(/Jr\.?|Sr\.?|III|IV|V/gi, '').trim(), // Remove suffixes
      cleanName.replace(/\./g, '').replace(/'/g, '').replace(/'/g, ''), // Remove periods and apostrophes
      // Handle common name formatting differences
      cleanName.replace(/\s+/g, ' '), // Normalize spaces
      cleanName.replace(/\./g, '').replace(/'/g, '').replace(/'/g, '').replace(/\s+/g, ' ').trim(),
      // Handle middle initials and names
      cleanName.replace(/\s[A-Z]\.\s/g, ' '), // Remove middle initial like "J. "
      cleanName.replace(/\s[A-Z][a-z]*\s/g, ' '), // Remove middle names
    ];
    
    // Team abbreviation variations (handle common mismatches)
    const teamVariations = [teamUpper];
    if (teamUpper === 'WAS') teamVariations.push('WSH');
    if (teamUpper === 'WSH') teamVariations.push('WAS');
    if (teamUpper === 'JAX') teamVariations.push('JAC');
    if (teamUpper === 'JAC') teamVariations.push('JAX');
    if (teamUpper === 'LV') teamVariations.push('LAS', 'OAK');
    if (teamUpper === 'LAS') teamVariations.push('LV');
    if (teamUpper === 'LAC') teamVariations.push('SD');
    if (teamUpper === 'LAR') teamVariations.push('LA');
    
    // Create all combinations
    const allVariations: string[] = [];
    
    for (const nameVar of baseVariations) {
      for (const teamVar of teamVariations) {
        // Sanitize name to match the mapping format
        const sanitizedName = nameVar.toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        const sanitizedTeam = teamVar.toLowerCase();
        
        allVariations.push(`${sanitizedName}-${sanitizedTeam}`);
        allVariations.push(`${nameVar}-${teamVar}`.toLowerCase());
        allVariations.push(`${nameVar}-${teamVar.toLowerCase()}`);
      }
      // Also try name-only variations
      allVariations.push(nameVar.toLowerCase());
    }
    
    // Add original exact match first (highest priority)
    allVariations.unshift(`${cleanName}-${teamUpper}`.toLowerCase());
    
    // Remove duplicates while preserving order
    return Array.from(new Set(allVariations)).filter(Boolean);
  }

  static preloadPlayerImages(players: Player[]): void {
    // Preload images for better performance
    players.forEach(async (player) => {
      const imageUrl = await this.getPlayerImageUrl(player);
      if (imageUrl) {
        const img = new Image();
        img.src = imageUrl;
      }
    });
  }
}

// Get the correct team for a player, handling team changes
function getCorrectTeam(playerName: string, currentTeam: string): string[] {
  const teamUpdates = playerTeamUpdates as { [key: string]: { oldTeam: string; newTeam: string; season: string } };
  const playerUpdate = teamUpdates[playerName];
  
  if (playerUpdate) {
    // If the current team matches the old team, prioritize the new team
    if (currentTeam.toUpperCase() === playerUpdate.oldTeam.toUpperCase()) {
      return [playerUpdate.newTeam, currentTeam]; // Try new team first, then fall back to old
    }
    // If current team matches new team, that's perfect
    if (currentTeam.toUpperCase() === playerUpdate.newTeam.toUpperCase()) {
      return [currentTeam];
    }
    // If neither matches, try both new and old teams
    return [playerUpdate.newTeam, playerUpdate.oldTeam, currentTeam];
  }
  
  // No team update found, use the provided team
  return [currentTeam];
}

// Generate name variations for sync function (same logic as async version)
function generateNameVariationsSync(name: string, team: string): string[] {
  const cleanName = name.trim();
  const teamUpper = team.toUpperCase();
  
  // Handle team defense requests
  if (name.toLowerCase().includes('defense') || 
      name.toLowerCase().includes('dst') ||
      name.toLowerCase().includes(teamUpper.toLowerCase())) {
    return []; // Return empty array for team defenses
  }
  
  // Generate base name variations
  const baseVariations = [
    cleanName,
    cleanName.replace(/\./g, ''), // Remove periods
    cleanName.replace(/'/g, ''), // Remove apostrophes  
    cleanName.replace(/'/g, ''), // Remove smart quotes
    cleanName.replace(/Jr\.?|Sr\.?|III|IV|V/gi, '').trim(), // Remove suffixes
    cleanName.replace(/\./g, '').replace(/'/g, '').replace(/'/g, ''), // Remove periods and apostrophes
    // Handle common name formatting differences
    cleanName.replace(/\s+/g, ' '), // Normalize spaces
    cleanName.replace(/\./g, '').replace(/'/g, '').replace(/'/g, '').replace(/\s+/g, ' ').trim(),
    // Handle middle initials and names
    cleanName.replace(/\s[A-Z]\.\s/g, ' '), // Remove middle initial like "J. "
    cleanName.replace(/\s[A-Z][a-z]*\s/g, ' '), // Remove middle names
  ];
  
  // Team abbreviation variations (handle common mismatches)
  const teamVariations = [teamUpper];
  if (teamUpper === 'WAS') teamVariations.push('WSH');
  if (teamUpper === 'WSH') teamVariations.push('WAS');
  if (teamUpper === 'JAX') teamVariations.push('JAC');
  if (teamUpper === 'JAC') teamVariations.push('JAX');
  if (teamUpper === 'LV') teamVariations.push('LAS', 'OAK');
  if (teamUpper === 'LAS') teamVariations.push('LV');
  if (teamUpper === 'LAC') teamVariations.push('SD');
  if (teamUpper === 'LAR') teamVariations.push('LA');
  
  // Create all combinations
  const allVariations: string[] = [];
  
  for (const nameVar of baseVariations) {
    for (const teamVar of teamVariations) {
      // Sanitize name to match the mapping format
      const sanitizedName = nameVar.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const sanitizedTeam = teamVar.toLowerCase();
      
      allVariations.push(`${sanitizedName}-${sanitizedTeam}`);
      allVariations.push(`${nameVar}-${teamVar}`.toLowerCase());
      allVariations.push(`${nameVar}-${teamVar.toLowerCase()}`);
    }
    // Also try name-only variations
    allVariations.push(nameVar.toLowerCase());
  }
  
  // Add original exact match first (highest priority)
  allVariations.unshift(`${cleanName}-${teamUpper}`.toLowerCase());
  
  // Remove duplicates while preserving order
  return Array.from(new Set(allVariations)).filter(Boolean);
}

// Legacy sync function - DEPRECATED
// Use PlayerImageService.getPlayerImageUrl() instead for better error handling and consistency
export function getPlayerImageUrl(playerName: string, teamId?: string): string | null {
  console.warn('DEPRECATED: getPlayerImageUrl() is deprecated. Use PlayerImageService.getPlayerImageUrl() instead.');
  
  if (!playerName || !teamId) return null;
  
  // Get potential teams to try (handles team changes)
  const teamsToTry = getCorrectTeam(playerName, teamId);
  
  // Try each team variation
  for (const team of teamsToTry) {
    const variations = generateNameVariationsSync(playerName, team);
    
    // Handle team defense requests
    if (variations.length === 0) {
      continue; // Skip team defenses
    }
    
    // Try each variation to find a match in the mapping
    for (const variation of variations) {
      const mapped = playerImagesMapping[variation as keyof typeof playerImagesMapping];
      if (mapped) {
        return mapped;
      }
    }
  }
  
  // If no teams worked, return null to avoid 404s
  return null;
}

export default PlayerImageService;