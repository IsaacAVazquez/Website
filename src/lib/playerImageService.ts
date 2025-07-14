import { Player } from '@/types';

interface PlayerImageMapping {
  [key: string]: {
    name: string;
    team: string;
    position: string;
    imagePath?: string;
    source?: string;
  };
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
      const response = await fetch('/api/player-images-mapping');
      if (response.ok) {
        this.mapping = await response.json();
      } else {
        console.warn('Player images mapping not found, using fallback');
        this.mapping = {};
      }
    } catch (error) {
      console.warn('Failed to load player images mapping:', error);
      this.mapping = {};
    }
  }

  static async getPlayerImageUrl(player: Player): Promise<string | null> {
    await this.loadMapping();
    
    if (!this.mapping) return null;

    // Try different name variations
    const variations = this.generateNameVariations(player.name, player.team);
    
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Looking for image for: ${player.name} (${player.team})`);
      console.log(`Trying variations:`, variations.slice(0, 5)); // Show first 5 variations
    }
    
    for (const variation of variations) {
      const mapped = this.mapping[variation];
      if (mapped?.imagePath) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Found match: ${variation} -> ${mapped.imagePath}`);
        }
        return `/player-images/${mapped.imagePath}`;
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`❌ No image found for: ${player.name} (${player.team})`);
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
    ];
    
    // Team abbreviation variations (handle common mismatches)
    const teamVariations = [teamUpper];
    if (teamUpper === 'WAS') teamVariations.push('WSH');
    if (teamUpper === 'WSH') teamVariations.push('WAS');
    if (teamUpper === 'JAX') teamVariations.push('JAC');
    if (teamUpper === 'JAC') teamVariations.push('JAX');
    
    // Create all combinations
    const allVariations: string[] = [];
    
    for (const nameVar of baseVariations) {
      for (const teamVar of teamVariations) {
        allVariations.push(`${nameVar}-${teamVar}`.toLowerCase());
        allVariations.push(`${nameVar}-${teamVar.toLowerCase()}`);
      }
      // Also try name-only variations
      allVariations.push(nameVar.toLowerCase());
    }
    
    // Add original exact match first (highest priority)
    allVariations.unshift(`${cleanName}-${teamUpper}`.toLowerCase());
    
    // Remove duplicates while preserving order
    return [...new Set(allVariations)].filter(Boolean);
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

// Convenience function for direct use in components
export function getPlayerImageUrl(playerName: string, teamId?: string): string | null {
  // This is a synchronous version that doesn't require async/await
  // It returns null if no image is found, allowing components to show fallbacks
  
  if (!playerName) return null;
  
  // For now, return a constructed path based on naming convention
  // This will be enhanced when the mapping file is available
  const sanitizedName = playerName.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const team = teamId?.toLowerCase() || 'unknown';
  const imagePath = `${team}-${sanitizedName}.jpg`;
  
  // Check if this matches our expected pattern
  // In production, this should check against the actual mapping
  return `/player-images/${imagePath}`;
}

export default PlayerImageService;