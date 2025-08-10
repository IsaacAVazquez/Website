# Fantasy Football Data Persistence

## Overview
The application now includes file-based data persistence that automatically saves fetched Fantasy Pros data to the filesystem. This ensures data persists across:
- Server restarts
- New deployments  
- Incognito/private browsing sessions
- Different users

## How It Works

### 1. Data Flow
1. When data is fetched from Fantasy Pros (via session API), it's stored in:
   - In-memory cache (fast access)
   - localStorage (client-side)
   - **NEW: File system** (server-side persistence)

2. The data is written to the same files used for sample data (`src/data/`), ensuring seamless fallback.

### 2. File Structure
```
src/data/
├── qbData.ts         # Quarterback rankings
├── rbData.ts         # Running back rankings  
├── wrData.ts         # Wide receiver rankings
├── teData.ts         # Tight end rankings
├── kData.ts          # Kicker rankings
├── dstData.ts        # Defense/ST rankings
├── flexData.ts       # Flex position rankings
├── overallData.ts    # Overall rankings
├── sampleData.ts     # Main export file
└── backup/           # Automatic backups (gitignored)
```

### 3. Metadata Tracking
Each data file includes metadata comments:
```typescript
/**
 * QB Player Data
 * Last Updated: 2025-01-13T10:30:00.000Z
 * Source: fantasypros
 * Format: ppr
 * Version: 1.0.0
 */
```

## Usage

### Manual Data Update
Run the update script to fetch fresh data:
```bash
npm run update-data
```

This will:
1. Authenticate with Fantasy Pros
2. Fetch latest rankings for all positions
3. Save to data files
4. Create backups of previous data

### Automatic Updates
The Vercel cron job (`/api/scheduled-update`) runs daily at 5am UTC and automatically persists data.

### Data Freshness Indicator
The UI now shows when data was last updated:
- Green pulse: Updated within 1 hour
- Blue: Updated within 24 hours
- Amber: Updated 1-3 days ago
- Red: Updated more than 3 days ago

## Environment Variables
Ensure these are set in `.env.local`:
```bash
FANTASYPROS_USERNAME=your_username
FANTASYPROS_PASSWORD=your_password
CRON_SECRET=your_secret_key
```

## Backup System
- Automatic backups created before each update
- Last 5 backups kept per position
- Stored in `src/data/backup/` (gitignored)
- Named with timestamp: `QB_1736771400000.ts`

## Troubleshooting

### Data Not Persisting
1. Check write permissions on `src/data/` directory
2. Verify environment variables are set
3. Check console logs for write errors

### Stale Data Showing
1. Run `npm run update-data` manually
2. Check data freshness indicator
3. Clear browser cache if needed

### Rollback to Previous Data
1. Find backup in `src/data/backup/`
2. Copy backup file to main data directory
3. Rename to original filename

## Benefits
- **No Database Required**: Simple file-based storage
- **Deployment Friendly**: Data included in build
- **Fallback Safe**: Uses existing sample data structure
- **Version Controlled**: Track data changes in git
- **Performance**: Data served as static imports