import { getCuratedCompanyName } from '../investmentCompanyNames';

describe('getCuratedCompanyName', () => {
  it('returns the company name for a known symbol', () => {
    expect(getCuratedCompanyName('AAPL')).toBe('Apple Inc.');
  });

  it('is case-insensitive (lowercased input)', () => {
    expect(getCuratedCompanyName('aapl')).toBe('Apple Inc.');
  });

  it('trims surrounding whitespace from the symbol', () => {
    expect(getCuratedCompanyName('  AAPL  ')).toBe('Apple Inc.');
  });

  it('returns the company name for another known symbol', () => {
    expect(getCuratedCompanyName('MSFT')).toBe('Microsoft Corporation');
  });

  it('returns undefined for an unknown symbol', () => {
    expect(getCuratedCompanyName('ZZZNOTREAL')).toBeUndefined();
  });

  it('returns undefined for null input', () => {
    expect(getCuratedCompanyName(null)).toBeUndefined();
  });

  it('returns undefined for undefined input', () => {
    expect(getCuratedCompanyName(undefined)).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(getCuratedCompanyName('')).toBeUndefined();
  });

  it('returns undefined for a whitespace-only string', () => {
    expect(getCuratedCompanyName('   ')).toBeUndefined();
  });

  it('handles hyphenated symbols like BRK-B', () => {
    const result = getCuratedCompanyName('BRK-B');
    expect(typeof result).toBe('string');
    expect((result as string).length).toBeGreaterThan(0);
  });
});
