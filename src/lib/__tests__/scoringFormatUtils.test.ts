import { convertScoringFormat, getScoringFormatDisplay } from '../scoringFormatUtils';
import { ScoringFormat } from '@/types';

describe('convertScoringFormat', () => {
  it('converts PPR to "ppr"', () => {
    expect(convertScoringFormat('PPR')).toBe('ppr');
  });

  it('converts STANDARD to "standard"', () => {
    expect(convertScoringFormat('STANDARD')).toBe('standard');
  });

  it('converts HALF_PPR to "half-ppr"', () => {
    expect(convertScoringFormat('HALF_PPR')).toBe('half-ppr');
  });

  it('defaults to "ppr" for unknown values', () => {
    expect(convertScoringFormat('UNKNOWN' as ScoringFormat)).toBe('ppr');
  });
});

describe('getScoringFormatDisplay', () => {
  it('returns "PPR" for PPR format', () => {
    expect(getScoringFormatDisplay('PPR')).toBe('PPR');
  });

  it('returns "Standard" for STANDARD format', () => {
    expect(getScoringFormatDisplay('STANDARD')).toBe('Standard');
  });

  it('returns "Half PPR" for HALF_PPR format', () => {
    expect(getScoringFormatDisplay('HALF_PPR')).toBe('Half PPR');
  });

  it('defaults to "PPR" for unknown values', () => {
    expect(getScoringFormatDisplay('UNKNOWN' as ScoringFormat)).toBe('PPR');
  });
});
