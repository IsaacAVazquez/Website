# Data Architecture Map - Isaac Vazquez Digital Platform

**Last Updated:** October 29, 2025
**Database:** SQLite (`better-sqlite3`)
**Data Sources:** FantasyPros, ESPN, NFL.com

---

## Table of Contents

- [Data Architecture Overview](#data-architecture-overview)
- [Player Data Management](#player-data-management)
- [Database Schema](#database-schema)
- [Analytics Library](#analytics-library)
- [Custom Hooks System](#custom-hooks-system)
- [Automation Scripts](#automation-scripts)
- [Caching System](#caching-system)
- [Data Pipeline](#data-pipeline)
- [Quick Reference](#quick-reference)

---

## Data Architecture Overview

### Data Flow Architecture

```
External Data Sources
├── FantasyPros API (player rankings, projections)
├── ESPN API (player images, team data)
└── NFL.com (roster data, statistics)
        ↓
Automation Scripts (60+ scripts)
├── Data collection & scraping
├── Image processing & mapping
├── Player matching & validation
└── Quality assurance
        ↓
Data Processing Layer
├── Unified data aggregation
├── Machine learning tier calculation
├── Statistical clustering (K-means, Gaussian)
└── Data validation & quality checks
        ↓
SQLite Database (fantasy-data.db)
├── Player profiles (2000+ NFL players)
├── Rankings & projections
├── Historical performance data
└── Image mappings
        ↓
Caching Layer (Multi-tier)
├── In-memory cache (active data)
├── API response cache (60s TTL)
├── Player image cache (browser)
└── Static data cache (CDN)
        ↓
Application APIs & Components
└── Real-time tier charts, draft tools, player cards
```

### Data Sources & Integration

| Source | Purpose | Update Frequency | Integration |
|--------|---------|-----------------|-------------|
| FantasyPros | Player rankings, expert consensus | Daily | `src/lib/fantasyProsAPI.ts` |
| FantasyPros (Free) | Public tier data | Daily | `src/lib/fantasyProsAlternative.ts` |
| ESPN | Player headshots, team logos | Weekly | `scripts/espn-headshot-scraper.js` |
| NFL.com | Official roster data | Weekly | `scripts/nfl-roster-scraper.js` |
| SQLite Database | Persistent player data | Real-time | `src/lib/database.ts` |

---

## Player Data Management

### Player Data Files

**Location:** `src/data/`

| File | Purpose | Players | Updated |
|------|---------|---------|---------|
| `qbData.ts` | Quarterback rankings and statistics | ~50 QBs | Daily |
| `rbData.ts` | Running back analytics | ~100 RBs | Daily |
| `wrData.ts` | Wide receiver data and projections | ~120 WRs | Daily |
| `teData.ts` | Tight end rankings | ~50 TEs | Daily |
| `kData.ts` | Kicker statistics | ~40 Ks | Daily |
| `dstData.ts` | Defense/Special teams analytics | ~32 DSTs | Daily |
| `flexData.ts` | Flexible position rankings (RB/WR/TE) | ~250 | Daily |
| `overallData.ts` | Overall player rankings | ~300 | Daily |
| `overallDataPPR.ts` | PPR scoring format overall rankings | ~300 | Daily |
| `overallDataStandard.ts` | Standard scoring overall rankings | ~300 | Daily |
| `sampleData.ts` | Sample/test data for development | Variable | Manual |

### Player Data Structure

```typescript
// src/types/index.ts
interface Player {
  // Core identification
  id: string;                    // Unique player identifier
  name: string;                  // Player full name
  team: string;                  // NFL team abbreviation
  position: Position;            // QB | RB | WR | TE | K | DST

  // Rankings & projections
  averageRank: number;           // Average expert rank
  projectedPoints: number;       // Season projection
  standardDeviation: number;     // Ranking variance
  tier?: number;                 // Calculated tier group
  positionRank?: number;         // Position-specific rank
  adp?: number;                  // Average draft position

  // Expert consensus
  expertRanks: number[];         // Array of expert rankings
  expertCount?: number;          // Number of experts
  consensusLevel?: 'high' | 'medium' | 'low';

  // Additional metadata
  byeWeek?: number;
  lastUpdated?: string;
  auctionValue?: number;
  upside?: string;
  downside?: string;
  bottomLine?: string;

  // Detailed projections (position-specific)
  projections?: {
    passingYards?: number;
    passingTDs?: number;
    rushingYards?: number;
    rushingTDs?: number;
    receptions?: number;
    receivingYards?: number;
    receivingTDs?: number;
    // ... [30+ projection fields]
  };

  // Weekly performance data
  weeklyProjections?: Array<{
    week: number;
    projectedPoints: number;
    opponent: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
}
```

### Master Player Database

**Files:**
- `src/data/player-database.json` - Master player database (2000+ players)
- `src/data/player-images.json` - Player image URL mappings
- `src/data/fantasy-player-mappings.json` - Player ID mappings across sources

**Player Database Fields:**
```json
{
  "players": [
    {
      "id": "unique-player-id",
      "name": "Player Name",
      "team": "TEAM",
      "position": "QB",
      "espnId": "12345",
      "fantasyProsId": "player-name",
      "imageUrl": "https://...",
      "status": "active",
      "jerseyNumber": 12,
      "height": "6-4",
      "weight": 225,
      "college": "University",
      "yearsPro": 5
    }
  ]
}
```

---

## Database Schema

### SQLite Database (`fantasy-data.db`)

**Location:** `/fantasy-data.db`
**Management:** `src/lib/database.ts`

#### Tables

```sql
-- Players Table
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  position TEXT NOT NULL,
  average_rank REAL,
  projected_points REAL,
  standard_deviation REAL,
  tier INTEGER,
  position_rank INTEGER,
  adp REAL,
  bye_week INTEGER,
  expert_count INTEGER,
  consensus_level TEXT,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  image_url TEXT,

  -- Projections (stored as JSON)
  projections TEXT,
  weekly_projections TEXT,

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Expert Rankings Table
CREATE TABLE expert_rankings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  expert_name TEXT NOT NULL,
  rank INTEGER NOT NULL,
  source TEXT,
  ranking_date DATE NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Tier History Table
CREATE TABLE tier_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  tier INTEGER NOT NULL,
  calculation_method TEXT,
  calculation_date DATE NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Player Images Table
CREATE TABLE player_images (
  player_id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  source TEXT,
  quality INTEGER,
  last_validated DATETIME,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Data Metadata Table
CREATE TABLE data_metadata (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Database Operations

**File:** `src/lib/database.ts`

```typescript
Database Functions:
├── getPlayerById(id: string)
├── getPlayersByPosition(position: Position)
├── updatePlayerData(player: Player)
├── batchUpdatePlayers(players: Player[])
├── getPlayerTierHistory(playerId: string)
├── updatePlayerImage(playerId: string, imageUrl: string)
├── getDataMetadata(key: string)
└── setDataMetadata(key: string, value: string)
```

---

## Analytics Library

**Location:** `src/lib/`

### Tier Calculation Engines

| File | Purpose | Algorithm |
|------|---------|-----------|
| `tierCalculator.ts` | Core tier calculation | K-means clustering |
| `optimizedTierCalculator.ts` | Performance-optimized calculations | Optimized K-means |
| `unifiedTierCalculator.ts` | Unified tier system | Multi-algorithm |
| `tierGrouping.ts` | Advanced tier grouping logic | Gaussian mixture |

### Machine Learning & Statistics

| File | Purpose | Technique |
|------|---------|-----------|
| `clustering.ts` | K-means clustering algorithms | Unsupervised learning |
| `gaussianMixture.ts` | Statistical modeling for tier grouping | Gaussian mixture models |
| `overallValueCalculator.ts` | Player value calculations | Multi-factor scoring |
| `scoringFormatUtils.ts` | Fantasy scoring calculations | Position-based formulas |

### Data Management Utilities

| File | Purpose | Features |
|------|---------|----------|
| `dataManager.ts` | Comprehensive data management | CRUD operations, validation |
| `dataValidator.ts` | Data validation & quality assurance | Schema validation, data quality checks |
| `dataLoader.ts` | Optimized data loading | Lazy loading, caching |
| `dataImport.ts` | Data import & processing | CSV/JSON import, transformation |
| `dataFileWriter.ts` | Write data to TypeScript files | Code generation |
| `overallDataGenerator.ts` | Generate overall rankings | Multi-position aggregation |

### External API Integration

| File | Purpose | API |
|------|---------|-----|
| `fantasyProsAPI.ts` | FantasyPros API integration | Premium API |
| `fantasyProsAlternative.ts` | Alternative data source | Free tier |
| `fantasyProsSession.ts` | Session management | OAuth/session tokens |
| `unifiedFantasyProsAPI.ts` | Unified API layer | All data sources |

### Player Image Management

| File | Purpose | Features |
|------|---------|----------|
| `playerImageService.ts` | Player image management | CRUD, optimization |
| `playerImageScraper.ts` | Automated image scraping | Multi-source scraping |
| `webScraper.ts` | Web scraping utilities | Rate limiting, retries |

### Performance & Utilities

| File | Purpose | Features |
|------|---------|----------|
| `performance.ts` | Performance monitoring | Web Vitals, metrics |
| `rateLimit.ts` | API rate limiting | Token bucket, request throttling |
| `analytics.ts` | Analytics tracking | Event tracking, user analytics |
| `logger.ts` | Logging utility | Structured logging |
| `lazyD3.ts` | Lazy-loaded D3.js | Code splitting for charts |
| `lazySampleData.ts` | Lazy sample data loader | Development utilities |

### SEO & Content

| File | Purpose | Features |
|------|---------|----------|
| `seo.ts` | SEO metadata generation | OpenGraph, Twitter cards, JSON-LD |
| `localSEO.ts` | Local SEO optimization | NAP, local schema |
| `blog.ts` | Blog system utilities | MDX processing, frontmatter |
| `localSitemap.ts` | Sitemap generation | XML sitemap creation |

### Miscellaneous

| File | Purpose |
|------|---------|
| `utils.ts` | General utility functions |
| `auth.ts` | Authentication utilities (NextAuth) |
| `sampleDataService.ts` | Sample data service layer |
| `tierImageGenerator.ts` | Dynamic tier chart image generation |

---

## Custom Hooks System

**Location:** `src/hooks/`

### Fantasy Data Hooks

| Hook | File | Purpose | Returns |
|------|------|---------|---------|
| `useFantasyData` | `useFantasyData.ts` | Single position data management | `{ data, loading, error, refetch }` |
| `useAllFantasyData` | `useAllFantasyData.ts` | All position data aggregation | `{ qb, rb, wr, te, k, dst, flex }` |
| `useOverallFantasyData` | `useOverallFantasyData.ts` | Overall rankings | `{ overall, loading, error }` |
| `useUnifiedFantasyData` | `useUnifiedFantasyData.ts` | Unified data layer with caching | `{ data, cache, invalidate }` |

**Usage Example:**
```typescript
const { data: qbData, loading, error } = useFantasyData('QB', 'PPR');

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

return <TierChart players={qbData} />;
```

### UI & Interaction Hooks

| Hook | File | Purpose | Returns |
|------|------|---------|---------|
| `useDebounce` | `useDebounce.ts` | Input debouncing | Debounced value |
| `useLazyLoad` | `useLazyLoad.ts` | Lazy loading utilities | `{ ref, isVisible }` |
| `useNavigation` | `useNavigation.ts` | Navigation state management | `{ route, navigate, back }` |
| `useTypingAnimation` | `useTypingAnimation.ts` | Terminal typing effects | `{ text, isComplete }` |

### Specialized Hooks

| Hook | File | Purpose | Returns |
|------|------|---------|---------|
| `usePlayerImageCache` | `usePlayerImageCache.tsx` | Player image caching | `{ getImage, preload }` |
| `useBlogPost` | `useBlogPost.ts` | Blog post management | `{ post, related, loading }` |

**Hook Features:**
- Automatic data caching
- Error handling and retry logic
- Loading states
- TypeScript type safety
- Stale-while-revalidate patterns
- Optimistic updates

---

## Automation Scripts

**Location:** `/scripts/` (60+ automation scripts)

### Data Collection Scripts

| Script | Purpose | Frequency |
|--------|---------|-----------|
| `comprehensive-player-scraper.js` | Advanced player data collection | Daily |
| `espn-headshot-scraper.js` | ESPN player image scraping | Weekly |
| `fantasypros-image-scraper.js` | FantasyPros data integration | Daily |
| `nfl-roster-scraper.js` | NFL roster data collection | Weekly |
| `unified-player-image-scraper.js` | Unified image collection | Weekly |

### Data Processing Scripts

| Script | Purpose |
|--------|---------|
| `advanced-player-matcher.js` | Intelligent player matching across sources |
| `compile-all-players.js` | Compile master player database |
| `create-master-player-database.js` | Generate master database |
| `integrate-fantasypros-data.js` | Integrate FantasyPros rankings |
| `update-data.js` | Main data update orchestration |

### Image Management Scripts

| Script | Purpose |
|--------|---------|
| `build-player-image-database.js` | Build image database |
| `cleanup-player-images.js` | Remove unused/broken images |
| `cleanup-low-quality-images.js` | Quality-based image cleanup |
| `download-player-images.js` | Batch image download |
| `fix-player-image-mismatches.js` | Correct image mapping errors |
| `identify-oversized-images.js` | Find large images |
| `resize-oversized-images.js` | Optimize image sizes |

### Data Quality Scripts

| Script | Purpose |
|--------|---------|
| `validate-image-system.js` | Image validation & integrity |
| `validate-images-quality.js` | Quality assurance checks |
| `validate-player-images.js` | Player image validation |
| `detect-image-mismatches.js` | Find mapping errors |
| `final-validation.js` | Comprehensive validation |

### Specialized Scripts

| Script | Purpose |
|--------|---------|
| `update-sample-data.js` | Generate sample/test data |
| `test-draft-tiers-data.js` | Test tier calculations |
| `test-image-service.js` | Test image service |
| `fantasy-player-matcher.js` | Match players across sources |
| `fix-duplicate-images.js` | Remove duplicate images |

### Script Execution

```bash
# Manual execution
node scripts/[script-name].js

# Scheduled execution (via cron or scheduled API)
# See: src/app/api/scheduled-update/route.ts

# Data pipeline orchestration
node scripts/data-pipeline-orchestrator.js
```

---

## Caching System

### Multi-Tier Caching Architecture

```
┌─────────────────────────────────────────┐
│         Browser Cache (Level 1)         │
│  - Player images (Service Worker)       │
│  - Static assets (HTTP cache)           │
│  - Component render cache (React)       │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│       Application Cache (Level 2)       │
│  - In-memory data cache (60s TTL)       │
│  - API response cache (dataCache.ts)    │
│  - Unified cache layer (unifiedCache)   │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│         Database Cache (Level 3)        │
│  - SQLite query results                 │
│  - Materialized tier calculations       │
│  - Player data snapshots                │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│          CDN Cache (Level 4)            │
│  - Static pages (Netlify/Vercel)        │
│  - Image CDN (optimized images)         │
│  - API responses (edge cache)           │
└─────────────────────────────────────────┘
```

### Cache Implementation Files

| File | Purpose | TTL |
|------|---------|-----|
| `dataCache.ts` | API response caching | 60s (configurable) |
| `unifiedCache.ts` | Unified caching layer with invalidation | Variable |
| `usePlayerImageCache.tsx` | Player image browser cache | Indefinite |

### Cache Strategies

```typescript
Cache Strategies:
├── Cache-First
│   └── Player images, static data
│
├── Network-First
│   └── Real-time player rankings
│
├── Stale-While-Revalidate
│   └── Tier calculations, projections
│
└── Cache-Only
    └── Static content, build-time data
```

### Cache Invalidation

```typescript
Cache Invalidation Triggers:
├── Time-based (TTL expiration)
├── Manual refresh (user-initiated)
├── Data update events (API updates)
├── Version changes (deployment)
└── Manual purge (admin dashboard)
```

---

## Data Pipeline

### Automated Data Pipeline

**Orchestration:** `scripts/data-pipeline-orchestrator.js`
**API Endpoint:** `/api/data-pipeline`

```
Pipeline Stages:
1. Data Collection
   ├── Fetch FantasyPros rankings
   ├── Scrape ESPN player images
   ├── Download NFL roster data
   └── Aggregate expert consensus
        ↓
2. Data Processing
   ├── Player matching & deduplication
   ├── Data validation & quality checks
   ├── Missing data imputation
   └── Schema normalization
        ↓
3. Analytics Calculation
   ├── Tier calculations (K-means)
   ├── Gaussian mixture modeling
   ├── Overall value computation
   └── Position-specific rankings
        ↓
4. Database Update
   ├── Batch insert/update players
   ├── Update tier history
   ├── Store image mappings
   └── Update metadata timestamps
        ↓
5. Cache Invalidation
   ├── Clear API cache
   ├── Purge CDN cache
   ├── Invalidate stale data
   └── Trigger revalidation
        ↓
6. Validation & Reporting
   ├── Data integrity checks
   ├── Coverage analysis (% players with images)
   ├── Error logging
   └── Success metrics
```

### Pipeline Execution

**Scheduled Updates:**
- **Frequency:** Daily at 3:00 AM PST
- **Method:** Netlify scheduled function or cron job
- **API:** `POST /api/scheduled-update`
- **Duration:** ~15-30 minutes

**Manual Updates:**
- **Admin Dashboard:** `/admin`
- **API Endpoint:** `POST /api/data-pipeline`
- **UI Component:** `<UpdateDataButton />`

### Data Quality Metrics

```typescript
Quality Metrics Tracked:
├── Player Coverage: 95%+ of active NFL players
├── Image Coverage: 90%+ players with valid images
├── Ranking Freshness: <24 hours old
├── Data Accuracy: Expert consensus validation
├── Image Quality: Resolution, file size checks
└── Database Integrity: Foreign key constraints, no orphans
```

---

## Quick Reference

### Data File Locations

```
Player Data:
  src/data/*.ts              - Position-specific player data
  src/data/player-database.json - Master player database
  src/data/player-images.json   - Image mappings
  fantasy-data.db               - SQLite database

Analytics Library:
  src/lib/*.ts               - 30+ utility modules

Custom Hooks:
  src/hooks/*.ts             - 10+ custom React hooks

Automation:
  scripts/*.js               - 60+ automation scripts
```

### Common Data Operations

```typescript
// Fetch player data
const { data } = useFantasyData('QB', 'PPR');

// Get player from database
const player = await getPlayerById('player-123');

// Update player data
await updatePlayerData(updatedPlayer);

// Calculate tiers
const tiers = calculateTiers(players, { numberOfClusters: 5 });

// Cache player data
cache.set('qb-rankings', data, 60); // 60s TTL

// Invalidate cache
invalidateCache(['qb-rankings', 'overall-rankings']);
```

### Data Update Commands

```bash
# Update all player data
node scripts/update-data.js

# Scrape player images
node scripts/unified-player-image-scraper.js

# Validate data quality
node scripts/final-validation.js

# Generate master database
node scripts/create-master-player-database.js

# Test tier calculations
node scripts/test-draft-tiers-data.js
```

### Database Queries

```typescript
// Get all QBs
const qbs = await db.all('SELECT * FROM players WHERE position = "QB"');

// Get top 10 overall players
const top10 = await db.all(
  'SELECT * FROM players ORDER BY average_rank ASC LIMIT 10'
);

// Get player with image
const player = await db.get(`
  SELECT p.*, pi.image_url
  FROM players p
  LEFT JOIN player_images pi ON p.id = pi.player_id
  WHERE p.id = ?
`, playerId);
```

---

**For routing information, see:** `WEBSITE_MAP.md`
**For component details, see:** `COMPONENT_MAP.md`
**For database schema details, see:** `docs/DATABASE_SCHEMA.md`
**For automation details, see:** `docs/AUTOMATION_SCRIPTS.md`
