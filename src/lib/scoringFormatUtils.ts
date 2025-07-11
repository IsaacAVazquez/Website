import { ScoringFormat } from '@/types';

// Convert UI scoring format to API format
export function convertScoringFormat(format: ScoringFormat): string {
  switch (format) {
    case 'STANDARD':
      return 'standard';
    case 'PPR':
      return 'ppr';
    case 'HALF_PPR':
      return 'half-ppr';
    default:
      return 'ppr';
  }
}

// Get display name for scoring format
export function getScoringFormatDisplay(format: ScoringFormat): string {
  switch (format) {
    case 'STANDARD':
      return 'Standard';
    case 'PPR':
      return 'PPR';
    case 'HALF_PPR':
      return 'Half PPR';
    default:
      return 'PPR';
  }
}