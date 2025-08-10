/**
 * Data Validation and Quality Checks
 * Ensures data integrity throughout the fantasy football pipeline
 * Similar to fftiers' data quality assurance approach
 */

import { Player, Position, ScoringFormat } from '@/types';
import { logger } from './logger';

export interface ValidationResult {
  isValid: boolean;
  score: number; // Quality score 0-100
  warnings: ValidationWarning[];
  errors: ValidationError[];
  metadata: {
    playersValidated: number;
    validPlayers: number;
    invalidPlayers: number;
    timestamp: string;
  };
}

export interface ValidationWarning {
  type: 'suspicious_rank' | 'missing_data' | 'duplicate_player' | 'inconsistent_data' | 'stale_data';
  message: string;
  playerId?: string;
  playerName?: string;
  details?: any;
}

export interface ValidationError {
  type: 'invalid_format' | 'missing_required' | 'data_corruption' | 'constraint_violation';
  message: string;
  playerId?: string;
  playerName?: string;
  field?: string;
  value?: any;
}

export interface QualityMetrics {
  completeness: number; // Percentage of fields populated
  consistency: number; // Consistency across similar data points
  accuracy: number; // Estimated accuracy based on expectations
  freshness: number; // How fresh the data is
  uniqueness: number; // Uniqueness of records (no duplicates)
}

class DataValidator {
  // Expected ranges for different positions (based on historical data)
  private readonly POSITION_EXPECTATIONS = {
    QB: { minRank: 1, maxRank: 32, typicalCount: 24 },
    RB: { minRank: 1, maxRank: 80, typicalCount: 60 },
    WR: { minRank: 1, maxRank: 100, typicalCount: 80 },
    TE: { minRank: 1, maxRank: 32, typicalCount: 24 },
    K: { minRank: 1, maxRank: 32, typicalCount: 20 },
    DST: { minRank: 1, maxRank: 32, typicalCount: 20 },
    FLEX: { minRank: 1, maxRank: 200, typicalCount: 150 },
    OVERALL: { minRank: 1, maxRank: 300, typicalCount: 200 }
  };

  // NFL teams for validation
  private readonly VALID_TEAMS = [
    'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN',
    'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LV', 'LAC', 'LAR', 'MIA',
    'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB',
    'TEN', 'WAS'
  ];

  /**
   * Validate a collection of players
   */
  validatePlayers(players: Player[], position: Position, source: string): ValidationResult {
    const startTime = Date.now();
    const warnings: ValidationWarning[] = [];
    const errors: ValidationError[] = [];
    let validPlayers = 0;

    logger.info(`Validating ${players.length} ${position} players from ${source}`);

    // Individual player validation
    for (const player of players) {
      const playerResult = this.validateSinglePlayer(player, position);
      
      if (playerResult.isValid) {
        validPlayers++;
      }

      warnings.push(...playerResult.warnings);
      errors.push(...playerResult.errors);
    }

    // Collection-level validation
    const collectionWarnings = this.validateCollection(players, position);
    warnings.push(...collectionWarnings);

    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(players, position);
    const qualityScore = this.calculateOverallScore(qualityMetrics, warnings, errors);

    const result: ValidationResult = {
      isValid: errors.length === 0 && qualityScore >= 60, // Minimum 60% quality score
      score: qualityScore,
      warnings,
      errors,
      metadata: {
        playersValidated: players.length,
        validPlayers,
        invalidPlayers: players.length - validPlayers,
        timestamp: new Date().toISOString()
      }
    };

    const duration = Date.now() - startTime;
    logger.info(`Validation completed in ${duration}ms: Score ${qualityScore}/100, ${warnings.length} warnings, ${errors.length} errors`);

    return result;
  }

  /**
   * Validate a single player
   */
  private validateSinglePlayer(player: Player, expectedPosition: Position): {
    isValid: boolean;
    warnings: ValidationWarning[];
    errors: ValidationError[];
  } {
    const warnings: ValidationWarning[] = [];
    const errors: ValidationError[] = [];

    // Required fields validation
    if (!player.name || player.name.trim().length === 0) {
      errors.push({
        type: 'missing_required',
        message: 'Player name is required',
        playerId: player.id,
        field: 'name',
        value: player.name
      });
    }

    if (!player.position) {
      errors.push({
        type: 'missing_required',
        message: 'Player position is required',
        playerId: player.id,
        playerName: player.name,
        field: 'position'
      });
    } else if (player.position !== expectedPosition && expectedPosition !== 'OVERALL' && expectedPosition !== 'FLEX') {
      errors.push({
        type: 'constraint_violation',
        message: `Position mismatch: expected ${expectedPosition}, got ${player.position}`,
        playerId: player.id,
        playerName: player.name,
        field: 'position',
        value: player.position
      });
    }

    // Team validation
    if (player.team && !this.VALID_TEAMS.includes(player.team)) {
      warnings.push({
        type: 'suspicious_rank',
        message: `Unknown team abbreviation: ${player.team}`,
        playerId: player.id,
        playerName: player.name,
        details: { team: player.team }
      });
    }

    // Rank validation
    if (player.averageRank) {
      const rank = parseFloat(player.averageRank.toString());
      const expectations = this.POSITION_EXPECTATIONS[expectedPosition] || this.POSITION_EXPECTATIONS.OVERALL;
      
      if (isNaN(rank) || rank <= 0) {
        errors.push({
          type: 'invalid_format',
          message: 'Invalid average rank value',
          playerId: player.id,
          playerName: player.name,
          field: 'averageRank',
          value: player.averageRank
        });
      } else if (rank > expectations.maxRank * 2) { // Allow some flexibility
        warnings.push({
          type: 'suspicious_rank',
          message: `Unusually high rank for position ${expectedPosition}: ${rank}`,
          playerId: player.id,
          playerName: player.name,
          details: { rank, expectedMax: expectations.maxRank }
        });
      }
    }

    // Expert ranks validation
    if (player.expertRanks && Array.isArray(player.expertRanks)) {
      if (player.expertRanks.some(rank => typeof rank !== 'number' || rank <= 0)) {
        warnings.push({
          type: 'inconsistent_data',
          message: 'Expert ranks contain invalid values',
          playerId: player.id,
          playerName: player.name,
          details: { expertRanks: player.expertRanks }
        });
      }
    }

    // Projected points validation (should be reasonable for position)
    if (player.projectedPoints !== undefined && typeof player.projectedPoints === 'number') {
      const minExpected = this.getMinExpectedPoints(expectedPosition);
      const maxExpected = this.getMaxExpectedPoints(expectedPosition);
      
      if (player.projectedPoints < minExpected || player.projectedPoints > maxExpected) {
        warnings.push({
          type: 'suspicious_rank',
          message: `Projected points outside expected range for ${expectedPosition}: ${player.projectedPoints}`,
          playerId: player.id,
          playerName: player.name,
          details: { points: player.projectedPoints, minExpected, maxExpected }
        });
      }
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Validate the collection as a whole
   */
  private validateCollection(players: Player[], position: Position): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check for duplicates
    const nameMap = new Map<string, Player[]>();
    players.forEach(player => {
      const key = `${player.name}-${player.team}`.toLowerCase();
      if (!nameMap.has(key)) {
        nameMap.set(key, []);
      }
      nameMap.get(key)!.push(player);
    });

    // Find duplicates
    for (const [key, duplicates] of nameMap.entries()) {
      if (duplicates.length > 1) {
        warnings.push({
          type: 'duplicate_player',
          message: `Duplicate player found: ${duplicates[0].name}`,
          playerName: duplicates[0].name,
          details: { duplicateCount: duplicates.length, players: duplicates.map(p => p.id) }
        });
      }
    }

    // Check collection size
    const expectations = this.POSITION_EXPECTATIONS[position] || this.POSITION_EXPECTATIONS.OVERALL;
    if (players.length < expectations.typicalCount * 0.5) {
      warnings.push({
        type: 'missing_data',
        message: `Fewer players than expected for ${position}: ${players.length} (expected ~${expectations.typicalCount})`,
        details: { actualCount: players.length, expectedCount: expectations.typicalCount }
      });
    }

    // Check ranking gaps
    const ranks = players
      .map(p => parseFloat(p.averageRank?.toString() || '999'))
      .filter(r => !isNaN(r))
      .sort((a, b) => a - b);

    if (ranks.length > 5) {
      for (let i = 1; i < ranks.length; i++) {
        const gap = ranks[i] - ranks[i - 1];
        if (gap > 10 && ranks[i - 1] < 50) { // Large gap in top players
          warnings.push({
            type: 'missing_data',
            message: `Large ranking gap detected: ${ranks[i - 1]} to ${ranks[i]}`,
            details: { gap, rankBefore: ranks[i - 1], rankAfter: ranks[i] }
          });
        }
      }
    }

    return warnings;
  }

  /**
   * Calculate quality metrics
   */
  private calculateQualityMetrics(players: Player[], position: Position): QualityMetrics {
    if (players.length === 0) {
      return { completeness: 0, consistency: 0, accuracy: 0, freshness: 100, uniqueness: 0 };
    }

    // Completeness: percentage of required fields populated
    const requiredFields = ['name', 'position', 'averageRank'];
    const optionalFields = ['team', 'projectedPoints', 'tier'];
    
    let totalFieldsPopulated = 0;
    let totalPossibleFields = 0;

    players.forEach(player => {
      requiredFields.forEach(field => {
        totalPossibleFields++;
        if (player[field as keyof Player]) totalFieldsPopulated++;
      });
      
      optionalFields.forEach(field => {
        totalPossibleFields++;
        if (player[field as keyof Player] !== undefined && player[field as keyof Player] !== null) {
          totalFieldsPopulated++;
        }
      });
    });

    const completeness = Math.round((totalFieldsPopulated / totalPossibleFields) * 100);

    // Consistency: how consistent the data structure is
    const hasTeamData = players.filter(p => p.team).length / players.length;
    const hasProjectedPoints = players.filter(p => p.projectedPoints).length / players.length;
    const hasExpertRanks = players.filter(p => p.expertRanks && p.expertRanks.length > 0).length / players.length;
    
    const consistency = Math.round(((hasTeamData + hasProjectedPoints + hasExpertRanks) / 3) * 100);

    // Accuracy: based on expected data ranges
    const expectations = this.POSITION_EXPECTATIONS[position] || this.POSITION_EXPECTATIONS.OVERALL;
    const validRanks = players.filter(p => {
      const rank = parseFloat(p.averageRank?.toString() || '999');
      return !isNaN(rank) && rank >= 1 && rank <= expectations.maxRank * 1.5;
    }).length;
    
    const accuracy = Math.round((validRanks / players.length) * 100);

    // Freshness: assume 100% for now (would require timestamp comparison in real implementation)
    const freshness = 100;

    // Uniqueness: percentage of unique players (no duplicates)
    const uniqueNames = new Set(players.map(p => `${p.name}-${p.team}`.toLowerCase()));
    const uniqueness = Math.round((uniqueNames.size / players.length) * 100);

    return { completeness, consistency, accuracy, freshness, uniqueness };
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(
    metrics: QualityMetrics,
    warnings: ValidationWarning[],
    errors: ValidationError[]
  ): number {
    // Base score from metrics (weighted average)
    const baseScore = (
      metrics.completeness * 0.25 +
      metrics.consistency * 0.20 +
      metrics.accuracy * 0.25 +
      metrics.freshness * 0.15 +
      metrics.uniqueness * 0.15
    );

    // Penalties for warnings and errors
    const warningPenalty = Math.min(warnings.length * 2, 20); // Max 20 point penalty
    const errorPenalty = Math.min(errors.length * 5, 30); // Max 30 point penalty

    const finalScore = Math.max(0, Math.round(baseScore - warningPenalty - errorPenalty));
    return finalScore;
  }

  /**
   * Get expected point ranges by position
   */
  private getMinExpectedPoints(position: Position): number {
    const ranges = {
      QB: 200, RB: 100, WR: 80, TE: 60, K: 80, DST: 80,
      FLEX: 50, OVERALL: 50
    };
    return ranges[position] || 50;
  }

  private getMaxExpectedPoints(position: Position): number {
    const ranges = {
      QB: 400, RB: 350, WR: 320, TE: 180, K: 150, DST: 200,
      FLEX: 350, OVERALL: 400
    };
    return ranges[position] || 400;
  }

  /**
   * Quick validation for real-time use
   */
  quickValidate(players: Player[], position: Position): {
    isValid: boolean;
    criticalIssues: number;
    qualityScore: number;
  } {
    if (players.length === 0) {
      return { isValid: false, criticalIssues: 1, qualityScore: 0 };
    }

    let criticalIssues = 0;

    // Check for critical issues only
    players.forEach(player => {
      if (!player.name || !player.position) criticalIssues++;
      if (player.averageRank && isNaN(parseFloat(player.averageRank.toString()))) criticalIssues++;
    });

    // Quick quality estimate
    const hasRequiredFields = players.filter(p => p.name && p.position && p.averageRank).length / players.length;
    const qualityScore = Math.round(hasRequiredFields * 100);

    return {
      isValid: criticalIssues === 0 && qualityScore >= 80,
      criticalIssues,
      qualityScore
    };
  }
}

// Export singleton instance
export const dataValidator = new DataValidator();