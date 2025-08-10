/**
 * SQLite Database Manager
 * Inspired by fftiers repository's data persistence approach
 * Provides centralized data storage replacing file-based system
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Player, Position, ScoringFormat } from '@/types';
import { logger } from './logger';

export interface DatabaseConfig {
  dbPath?: string;
  enableWAL?: boolean;
  memoryMode?: boolean;
}

export interface StoredPlayer extends Player {
  id: number;
  datasetId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dataset {
  id: string;
  name: string;
  position: Position;
  scoringFormat: ScoringFormat;
  source: string;
  week: number;
  year: number;
  playerCount: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

class DatabaseManager {
  private db: Database.Database | null = null;
  private readonly defaultDbPath: string;
  private isInitialized = false;

  constructor(config: DatabaseConfig = {}) {
    // Default database path in project root
    this.defaultDbPath = config.dbPath || path.join(process.cwd(), 'fantasy-data.db');
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize(config: DatabaseConfig = {}): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    try {
      const dbPath = config.memoryMode ? ':memory:' : (config.dbPath || this.defaultDbPath);
      
      // Ensure directory exists for file-based database
      if (!config.memoryMode && dbPath !== ':memory:') {
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }
      }

      // Create database connection
      this.db = new Database(dbPath);
      
      // Enable WAL mode for better concurrency (if not in memory)
      if (config.enableWAL && !config.memoryMode) {
        this.db.pragma('journal_mode = WAL');
      }

      // Set other performance pragmas
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000');
      this.db.pragma('temp_store = memory');

      // Create tables
      await this.createTables();
      
      this.isInitialized = true;
      logger.info(`DatabaseManager initialized with ${config.memoryMode ? 'in-memory' : dbPath} database`);

    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create database tables with proper indexes
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createTables = `
      -- Datasets table (tracks each data fetch/update)
      CREATE TABLE IF NOT EXISTS datasets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        position TEXT NOT NULL,
        scoring_format TEXT NOT NULL,
        source TEXT NOT NULL,
        week INTEGER NOT NULL,
        year INTEGER NOT NULL,
        player_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1
      );

      -- Players table (stores individual player data)
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dataset_id TEXT NOT NULL,
        player_id TEXT NOT NULL, -- Player's unique ID (e.g., 'fp-QB-1')
        name TEXT NOT NULL,
        team TEXT,
        position TEXT NOT NULL,
        average_rank TEXT,
        projected_points INTEGER,
        standard_deviation TEXT,
        tier INTEGER,
        min_rank TEXT,
        max_rank TEXT,
        expert_ranks TEXT, -- JSON array
        bye_week INTEGER,
        injury_status TEXT,
        opponent TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (dataset_id) REFERENCES datasets (id) ON DELETE CASCADE
      );

      -- Cache metadata table (tracks data freshness)
      CREATE TABLE IF NOT EXISTS cache_metadata (
        key TEXT PRIMARY KEY,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        hit_count INTEGER DEFAULT 0,
        last_accessed TEXT NOT NULL
      );

      -- Data quality logs (tracks fetch results and errors)
      CREATE TABLE IF NOT EXISTS data_quality_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dataset_id TEXT,
        event_type TEXT NOT NULL, -- 'fetch_success', 'fetch_error', 'validation_error'
        message TEXT,
        details TEXT, -- JSON object
        created_at TEXT NOT NULL,
        FOREIGN KEY (dataset_id) REFERENCES datasets (id) ON DELETE CASCADE
      );
    `;

    // Create indexes for better query performance
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_datasets_position_scoring ON datasets (position, scoring_format);
      CREATE INDEX IF NOT EXISTS idx_datasets_active ON datasets (is_active);
      CREATE INDEX IF NOT EXISTS idx_datasets_created_at ON datasets (created_at);
      
      CREATE INDEX IF NOT EXISTS idx_players_dataset ON players (dataset_id);
      CREATE INDEX IF NOT EXISTS idx_players_position ON players (position);
      CREATE INDEX IF NOT EXISTS idx_players_tier ON players (tier);
      CREATE INDEX IF NOT EXISTS idx_players_avg_rank ON players (average_rank);
      
      CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_metadata (expires_at);
      
      CREATE INDEX IF NOT EXISTS idx_quality_logs_dataset ON data_quality_logs (dataset_id);
      CREATE INDEX IF NOT EXISTS idx_quality_logs_event_type ON data_quality_logs (event_type);
      CREATE INDEX IF NOT EXISTS idx_quality_logs_created_at ON data_quality_logs (created_at);
    `;

    try {
      this.db.exec(createTables);
      this.db.exec(createIndexes);
      logger.info('Database tables and indexes created successfully');
    } catch (error) {
      logger.error('Failed to create database tables:', error);
      throw error;
    }
  }

  /**
   * Store players data for a specific dataset
   */
  async storePlayers(
    position: Position,
    scoringFormat: ScoringFormat,
    players: Player[],
    metadata: {
      source: string;
      week?: number;
      year?: number;
    }
  ): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const datasetId = this.generateDatasetId(position, scoringFormat, metadata.source);
    const now = new Date().toISOString();
    const week = metadata.week || 0;
    const year = metadata.year || new Date().getFullYear();

    const transaction = this.db.transaction(() => {
      // Deactivate previous datasets for this position/scoring combo
      const deactivateStmt = this.db!.prepare(`
        UPDATE datasets 
        SET is_active = 0, updated_at = ? 
        WHERE position = ? AND scoring_format = ? AND is_active = 1
      `);
      deactivateStmt.run(now, position, scoringFormat);

      // Insert new dataset
      const datasetStmt = this.db!.prepare(`
        INSERT OR REPLACE INTO datasets (
          id, name, position, scoring_format, source, week, year, 
          player_count, created_at, updated_at, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);
      
      datasetStmt.run(
        datasetId,
        `${position} ${scoringFormat} Rankings`,
        position,
        scoringFormat,
        metadata.source,
        week,
        year,
        players.length,
        now,
        now
      );

      // Delete old players for this dataset
      const deletePlayersStmt = this.db!.prepare('DELETE FROM players WHERE dataset_id = ?');
      deletePlayersStmt.run(datasetId);

      // Insert new players
      const playerStmt = this.db!.prepare(`
        INSERT INTO players (
          dataset_id, player_id, name, team, position, average_rank, 
          projected_points, standard_deviation, tier, min_rank, max_rank,
          expert_ranks, bye_week, injury_status, opponent, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      players.forEach((player) => {
        playerStmt.run(
          datasetId,
          player.id || `${datasetId}-${player.name}`,
          player.name,
          player.team || null,
          player.position,
          player.averageRank?.toString() || null,
          player.projectedPoints || null,
          player.standardDeviation?.toString() || null,
          player.tier || null,
          player.minRank?.toString() || null,
          player.maxRank?.toString() || null,
          player.expertRanks ? JSON.stringify(player.expertRanks) : null,
          player.byeWeek || null,
          player.injuryStatus || null,
          player.opponent || null,
          now,
          now
        );
      });

      // Log successful data storage
      this.logDataQuality(datasetId, 'fetch_success', `Stored ${players.length} players`, {
        position,
        scoringFormat,
        source: metadata.source,
        playerCount: players.length
      });
    });

    try {
      transaction();
      logger.info(`Stored ${players.length} ${position} players for ${scoringFormat} scoring (dataset: ${datasetId})`);
      return datasetId;
    } catch (error) {
      logger.error('Failed to store players:', error);
      
      // Log the error
      this.logDataQuality(datasetId, 'storage_error', 'Failed to store players', {
        error: error instanceof Error ? error.message : 'Unknown error',
        position,
        scoringFormat,
        playerCount: players.length
      });
      
      throw error;
    }
  }

  /**
   * Retrieve players for a specific position and scoring format
   */
  async getPlayers(
    position: Position,
    scoringFormat: ScoringFormat,
    options: {
      includeInactive?: boolean;
      limit?: number;
      datasetId?: string;
    } = {}
  ): Promise<StoredPlayer[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = `
      SELECT p.*, d.source, d.week, d.year, d.created_at as dataset_created_at
      FROM players p
      JOIN datasets d ON p.dataset_id = d.id
      WHERE d.position = ? AND d.scoring_format = ?
    `;
    
    const params: any[] = [position, scoringFormat];

    if (options.datasetId) {
      query += ' AND d.id = ?';
      params.push(options.datasetId);
    } else if (!options.includeInactive) {
      query += ' AND d.is_active = 1';
    }

    query += ' ORDER BY CAST(p.average_rank AS REAL) ASC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    try {
      const stmt = this.db.prepare(query);
      const rows = stmt.all(...params) as any[];

      return rows.map(row => ({
        id: row.id,
        datasetId: row.dataset_id,
        player_id: row.player_id,
        name: row.name,
        team: row.team,
        position: row.position,
        averageRank: row.average_rank,
        projectedPoints: row.projected_points,
        standardDeviation: row.standard_deviation,
        tier: row.tier,
        minRank: row.min_rank,
        maxRank: row.max_rank,
        expertRanks: row.expert_ranks ? JSON.parse(row.expert_ranks) : [],
        byeWeek: row.bye_week,
        injuryStatus: row.injury_status,
        opponent: row.opponent,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

    } catch (error) {
      logger.error(`Failed to retrieve players for ${position} ${scoringFormat}:`, error);
      throw error;
    }
  }

  /**
   * Get available datasets
   */
  async getDatasets(options: { position?: Position; includeInactive?: boolean } = {}): Promise<Dataset[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM datasets';
    const params: any[] = [];

    const conditions: string[] = [];
    if (options.position) {
      conditions.push('position = ?');
      params.push(options.position);
    }
    if (!options.includeInactive) {
      conditions.push('is_active = 1');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    try {
      const stmt = this.db.prepare(query);
      const rows = stmt.all(...params) as any[];

      return rows.map(row => ({
        id: row.id,
        name: row.name,
        position: row.position as Position,
        scoringFormat: row.scoring_format as ScoringFormat,
        source: row.source,
        week: row.week,
        year: row.year,
        playerCount: row.player_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isActive: Boolean(row.is_active)
      }));

    } catch (error) {
      logger.error('Failed to retrieve datasets:', error);
      throw error;
    }
  }

  /**
   * Clean up old data (keep only recent datasets)
   */
  async cleanupOldData(daysToKeep: number = 7): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffISO = cutoffDate.toISOString();

    try {
      const stmt = this.db.prepare('DELETE FROM datasets WHERE created_at < ? AND is_active = 0');
      const result = stmt.run(cutoffISO);
      
      logger.info(`Cleaned up ${result.changes} old datasets older than ${daysToKeep} days`);
      return result.changes;

    } catch (error) {
      logger.error('Failed to cleanup old data:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalPlayers: number;
    totalDatasets: number;
    activeDatasets: number;
    latestUpdate: string | null;
    diskUsage?: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const totalPlayers = this.db.prepare('SELECT COUNT(*) as count FROM players').get() as { count: number };
      const totalDatasets = this.db.prepare('SELECT COUNT(*) as count FROM datasets').get() as { count: number };
      const activeDatasets = this.db.prepare('SELECT COUNT(*) as count FROM datasets WHERE is_active = 1').get() as { count: number };
      const latestUpdate = this.db.prepare('SELECT MAX(created_at) as latest FROM datasets').get() as { latest: string | null };

      return {
        totalPlayers: totalPlayers.count,
        totalDatasets: totalDatasets.count,
        activeDatasets: activeDatasets.count,
        latestUpdate: latestUpdate.latest
      };

    } catch (error) {
      logger.error('Failed to get database stats:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      logger.info('Database connection closed');
    }
  }

  // Private helper methods

  private generateDatasetId(position: Position, scoringFormat: ScoringFormat, source: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${position.toLowerCase()}-${scoringFormat.toLowerCase()}-${source}-${timestamp}`;
  }

  private logDataQuality(
    datasetId: string,
    eventType: string,
    message: string,
    details: any = {}
  ): void {
    if (!this.db) return;

    try {
      const stmt = this.db.prepare(`
        INSERT INTO data_quality_logs (dataset_id, event_type, message, details, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        datasetId,
        eventType,
        message,
        JSON.stringify(details),
        new Date().toISOString()
      );
    } catch (error) {
      logger.warn('Failed to log data quality event:', error);
    }
  }
}

// Export singleton instance
export const databaseManager = new DatabaseManager();

// Export types
export type { DatabaseConfig, StoredPlayer, Dataset };