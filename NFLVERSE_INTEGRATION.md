# NFLverse Data Integration

## Overview

This project now uses **NFLverse/DynastyProcess** open-source data for fantasy football rankings and projections, replacing the previous FantasyPros API integration.

## Data Source

### Primary Data Repository
- **Source:** [DynastyProcess Data Repository](https://github.com/dynastyprocess/data)
- **Documentation:** [NFLverse Documentation](https://github.com/nflverse/nflverse-data)

### Available Data Files

1. **Weekly Fantasy Rankings**
   - URL: `https://github.com/dynastyprocess/data/raw/master/files/fp_latest_weekly.csv`
   - Updated: Weekly during NFL season
   - Contains: Expert consensus rankings, projections, start/sit recommendations

2. **Expert Consensus Rankings (ECR)**
   - URL: `https://github.com/dynastyprocess/data/raw/master/files/db_fpecr_latest.csv`
   - Updated: Daily
   - Contains: Aggregated expert rankings across all positions

3. **Player ID Mappings**
   - URL: `https://github.com/dynastyprocess/data/raw/master/files/db_playerids.csv`
   - Contains: Cross-platform player ID mappings (FantasyPros, Yahoo, ESPN, etc.)

## Implementation

### New Data Service: `nflverseAPI.ts`

Located in `src/lib/nflverseAPI.ts`, this service provides:

- **CSV Parsing:** Fetches and parses CSV data from GitHub
- **Player Transformation:** Converts raw data to `Player` interface
- **Caching:** 15-minute in-memory cache to reduce API calls
- **Position Filtering:** Supports all positions (QB, RB, WR, TE, K, DST)
- **Scoring Format Support:** PPR, Half-PPR, Standard

### API Endpoints

#### Get Player Data
```
GET /api/fantasy-data?position=QB&scoring=PPR
```

**Query Parameters:**
- `position` - Position filter (QB, RB, WR, TE, K, DST, FLEX, OVERALL)
- `scoring` - Scoring format (PPR, HALF_PPR, HALF, STANDARD, STD)
- `refresh` - Force cache refresh (true/false)
- `all` - Fetch all positions (true/false)

**Response:**
```json
{
  "success": true,
  "players": [...],
  "metadata": {
    "timestamp": "2025-11-18T...",
    "position": "QB",
    "scoringFormat": "PPR",
    "playersCount": 32,
    "dataUrl": "https://...",
    "source": "nflverse",
    "executionTimeMs": 245
  }
}
```

#### Cache Management
```
POST /api/fantasy-data
{
  "action": "clear-cache",
  "position": "QB",
  "scoringFormat": "PPR"
}
```

**Available Actions:**
- `clear-cache` - Clear cache for position/format or all
- `cache-stats` - Get cache statistics
- `test-config` - Test data source configuration

### Data Transformation

The `nflverseAPI` service transforms raw CSV data to match the existing `Player` interface:

```typescript
interface Player {
  id: string;                    // From fantasypros_id
  name: string;                  // From player_name
  team: string;                  // From team
  position: Position;            // From pos
  averageRank: number;           // From ecr (expert consensus rank)
  projectedPoints: number;       // From r2p_pts
  standardDeviation: number;     // From sd
  expertRanks: number[];         // Generated from sd, best, worst
  positionRank?: number;         // From pos_rank
  minRank?: number;              // From best
  maxRank?: number;              // From worst
  byeWeek?: number;              // From player_bye_week
  lastUpdated?: string;          // From scrape_date
}
```

## Advantages of NFLverse

### vs FantasyPros API

1. **No API Key Required** ✓
   - Open-source data, no authentication needed
   - No rate limits or costs
   - No account setup required

2. **Always Up-to-Date** ✓
   - Automated GitHub Actions updates
   - Daily updates during season
   - Community-maintained and verified

3. **Free and Open** ✓
   - MIT licensed data
   - Transparent data sources
   - Community-driven improvements

4. **Comprehensive Data** ✓
   - Expert consensus rankings
   - Weekly projections
   - Player IDs across platforms
   - Historical archives since 2019

## Migration Notes

### Removed Dependencies
- ~~FantasyPros API key~~ (No longer needed)
- ~~FantasyPros credentials~~ (No longer needed)
- ~~`unifiedFantasyProsAPI`~~ (Replaced with `nflverseAPI`)

### Environment Variables
**Before:**
```env
FANTASYPROS_API_KEY=your_key_here
FANTASYPROS_USERNAME=your_username
FANTASYPROS_PASSWORD=your_password
```

**After:**
```env
# No fantasy football API keys required!
# Data is fetched directly from public GitHub repositories
```

### Updated Files
1. `src/lib/nflverseAPI.ts` - New data service
2. `src/app/api/fantasy-data/route.ts` - Updated API endpoint
3. `NFLVERSE_INTEGRATION.md` - This documentation

## Testing

### Manual Testing
```bash
# Test data fetching with curl
curl "https://github.com/dynastyprocess/data/raw/master/files/fp_latest_weekly.csv" | head -10

# Test API endpoint locally
curl "http://localhost:3000/api/fantasy-data?position=QB&scoring=PPR"
```

### Cache Verification
```bash
# Get cache stats
curl -X POST http://localhost:3000/api/fantasy-data \
  -H "Content-Type: application/json" \
  -d '{"action": "cache-stats"}'

# Clear cache
curl -X POST http://localhost:3000/api/fantasy-data \
  -H "Content-Type: application/json" \
  -d '{"action": "clear-cache"}'
```

## Future Enhancements

Potential improvements using NFLverse ecosystem:

1. **Play-by-Play Data**
   - Use `nflverse-data` for advanced statistics
   - Player usage rates and target share

2. **Injury Data**
   - Real-time injury reports
   - Impact on player rankings

3. **Historical Trends**
   - Access to rankings archives since 2019
   - Year-over-year comparisons

4. **Advanced Metrics**
   - NextGen Stats integration
   - Expected fantasy points (ffopportunity)

## Resources

- [NFLverse GitHub Organization](https://github.com/nflverse)
- [DynastyProcess Data Repository](https://github.com/dynastyprocess/data)
- [NFLverse Data Documentation](https://nflreadr.nflverse.com/)
- [nflreadpy Python Package](https://github.com/nflverse/nflreadpy)

## Support

For issues with:
- **NFLverse Data:** [DynastyProcess Issues](https://github.com/dynastyprocess/data/issues)
- **Implementation:** Check this repository's issues or create a new one
- **Data Updates:** Data is updated automatically via GitHub Actions

---

**Last Updated:** November 18, 2025
**Data Source Version:** Latest (auto-updating)
**Integration Status:** ✓ Active and Tested
