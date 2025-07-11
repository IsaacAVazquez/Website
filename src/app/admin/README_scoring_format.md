# Scoring Format Implementation Notes

## Current Status
The scoring format functionality has been implemented in the backend but is not yet connected in the admin interface.

## IMPORTANT: Recent Fixes
- Fixed QB position to not use scoring format (QB doesn't have PPR variations)
- Added FLEX position support with proper scoring format URLs
- Fantasy football page now passes scoring format when fetching data

## What's Working:
1. **Backend APIs support scoring format**:
   - `/api/fantasy-pros-session` accepts `scoringFormat` in POST body
   - `/api/fantasy-pros-free` accepts `scoringFormat` as query parameter
   - Both default to 'ppr' if not provided

2. **Libraries handle scoring format correctly**:
   - `fantasyProsSession.ts` builds proper URLs based on scoring format
   - `fantasyProsAlternative.ts` builds proper URLs based on scoring format
   - K and DST positions correctly ignore scoring format (they don't have PPR variations)

3. **Fantasy Football page**:
   - Shows current scoring format in chart title
   - Reloads data when scoring format changes
   - But currently only shows sample data since admin doesn't pass scoring format

## What Needs to be Done:
To make scoring format fully functional in the admin page:

1. **Add scoring format selector to admin UI**
2. **Update FantasyPros Session fetch** (lines 167-175):
   ```typescript
   body: JSON.stringify({ 
     username, 
     password, 
     position,
     scoringFormat: convertScoringFormat(selectedFormat) // Add this
   })
   ```

3. **Update FantasyPros Free fetch** (line 232):
   ```typescript
   const url = `/api/fantasy-pros-free?position=${position}&scoringFormat=${convertScoringFormat(selectedFormat)}`;
   ```

4. **Update the "Fetch All" methods similarly**

## Scoring Format Mappings:
- UI: `STANDARD` → API: `standard`
- UI: `PPR` → API: `ppr`
- UI: `HALF_PPR` → API: `half-ppr`

This will allow users to fetch different rankings based on their league's scoring system.