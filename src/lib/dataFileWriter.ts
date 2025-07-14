import fs from 'fs/promises';
import path from 'path';
import { Player } from '@/types';

export interface DataFileMetadata {
  lastUpdated: string;
  source: 'fantasypros' | 'manual' | 'scheduled';
  format: 'ppr' | 'half' | 'standard';
  version: string;
}

export class DataFileWriter {
  private static readonly DATA_DIR = path.join(process.cwd(), 'src', 'data');
  private static readonly BACKUP_DIR = path.join(process.cwd(), 'src', 'data', 'backup');
  
  static async writePlayerData(
    position: string,
    players: Player[],
    metadata: DataFileMetadata
  ): Promise<void> {
    try {
      // Ensure directories exist
      await this.ensureDirectories();
      
      // Create backup of existing data first
      await this.backupExistingData(position);
      
      // Generate the TypeScript content
      const content = this.generateTypeScriptContent(position, players, metadata);
      
      // Write to the appropriate file
      const fileName = this.getFileName(position);
      const filePath = path.join(this.DATA_DIR, fileName);
      
      await fs.writeFile(filePath, content, 'utf-8');
      
      console.log(`Successfully wrote ${players.length} players to ${fileName}`);
    } catch (error) {
      console.error(`Error writing player data for ${position}:`, error);
      throw error;
    }
  }
  
  static async writeAllPositions(
    data: Record<string, Player[]>,
    metadata: DataFileMetadata
  ): Promise<void> {
    const positions = Object.keys(data);
    
    for (const position of positions) {
      await this.writePlayerData(position, data[position], metadata);
    }
    
    // Update the main sampleData.ts file to export all positions
    await this.updateMainExportFile(positions);
  }
  
  private static async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.DATA_DIR, { recursive: true });
    await fs.mkdir(this.BACKUP_DIR, { recursive: true });
  }
  
  private static async backupExistingData(position: string): Promise<void> {
    try {
      const fileName = this.getFileName(position);
      const sourcePath = path.join(this.DATA_DIR, fileName);
      const backupPath = path.join(this.BACKUP_DIR, `${position}_${Date.now()}.ts`);
      
      // Check if source file exists
      await fs.access(sourcePath);
      
      // Copy to backup
      await fs.copyFile(sourcePath, backupPath);
      
      // Keep only last 5 backups per position
      await this.cleanupOldBackups(position);
    } catch (error) {
      // File doesn't exist, no need to backup
      if ((error as any).code !== 'ENOENT') {
        console.error(`Error backing up ${position} data:`, error);
      }
    }
  }
  
  private static async cleanupOldBackups(position: string): Promise<void> {
    const files = await fs.readdir(this.BACKUP_DIR);
    const positionBackups = files
      .filter(f => f.startsWith(`${position}_`) && f.endsWith('.ts'))
      .sort()
      .reverse();
    
    // Delete old backups, keep only 5 most recent
    for (let i = 5; i < positionBackups.length; i++) {
      await fs.unlink(path.join(this.BACKUP_DIR, positionBackups[i]));
    }
  }
  
  private static getFileName(position: string): string {
    const positionMap: Record<string, string> = {
      'QB': 'qbData.ts',
      'RB': 'rbData.ts',
      'WR': 'wrData.ts',
      'TE': 'teData.ts',
      'K': 'kData.ts',
      'DST': 'dstData.ts',
      'FLEX': 'flexData.ts',
      'OVERALL': 'overallData.ts'
    };
    
    return positionMap[position] || `${position.toLowerCase()}Data.ts`;
  }
  
  private static generateTypeScriptContent(
    position: string,
    players: Player[],
    metadata: DataFileMetadata
  ): string {
    const metadataComment = `/**
 * ${position} Player Data
 * Last Updated: ${metadata.lastUpdated}
 * Source: ${metadata.source}
 * Format: ${metadata.format}
 * Version: ${metadata.version}
 */\n\n`;
    
    const imports = `import { Player } from '@/types';\n\n`;
    
    const playersJson = JSON.stringify(players, null, 2)
      .replace(/"([^"]+)":/g, '$1:') // Remove quotes from property names
      .replace(/"/g, "'"); // Replace double quotes with single quotes
    
    const exportStatement = `export const ${position.toLowerCase()}Players: Player[] = ${playersJson};\n`;
    
    return metadataComment + imports + exportStatement;
  }
  
  private static async updateMainExportFile(positions: string[]): Promise<void> {
    const imports = positions
      .map(pos => `import { ${pos.toLowerCase()}Players } from './${this.getFileName(pos).replace('.ts', '')}';`)
      .join('\n');
    
    const exports = `
export const sampleData = {
${positions.map(pos => `  ${pos}: ${pos.toLowerCase()}Players`).join(',\n')}
};

export {
${positions.map(pos => `  ${pos.toLowerCase()}Players`).join(',\n')}
};
`;
    
    const content = imports + '\n\n' + exports;
    
    await fs.writeFile(path.join(this.DATA_DIR, 'sampleData.ts'), content, 'utf-8');
  }
  
  static async getDataMetadata(position: string): Promise<DataFileMetadata | null> {
    try {
      const fileName = this.getFileName(position);
      const filePath = path.join(this.DATA_DIR, fileName);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Extract metadata from comments
      const metadataMatch = content.match(/Last Updated: (.+)\n \* Source: (.+)\n \* Format: (.+)\n \* Version: (.+)/);
      
      if (metadataMatch) {
        return {
          lastUpdated: metadataMatch[1],
          source: metadataMatch[2] as 'fantasypros' | 'manual' | 'scheduled',
          format: metadataMatch[3] as 'ppr' | 'half' | 'standard',
          version: metadataMatch[4]
        };
      }
    } catch (error) {
      console.error(`Error reading metadata for ${position}:`, error);
    }
    
    return null;
  }
}