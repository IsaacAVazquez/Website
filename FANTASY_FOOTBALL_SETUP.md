# Fantasy Football Tier Chart Setup

## Overview
This project now includes a Boris Chen-style fantasy football player rankings visualization with multiple data import methods.

## Data Import Methods

### 1. Free Rankings (Recommended First Try)
Attempts to access public FantasyPros rankings without authentication.

**Steps:**
1. Go to `/admin`
2. Select "Free Rankings" as import method
3. Click "Get [Position] Rankings" for a single position
4. Or click "Get All Positions" to get all data at once
5. Use "Debug FantasyPros Structure" if having issues

**Benefits:**
- No login or API key needed
- Fastest method
- Good for testing the system
- May work if FantasyPros allows public access

### 2. FantasyPros Login (If Free Access Fails)
Uses your FantasyPros account to download official expert consensus data.

**Steps:**
1. Go to `/admin`
2. Select "FantasyPros Login" as import method
3. Enter your FantasyPros username and password
4. Click "Fetch [Position] Rankings" for a single position
5. Or click "Fetch All Positions" to get all data at once

**Benefits:**
- No API key needed
- Downloads official XLS data files
- Includes expert consensus rankings with standard deviations
- Automatically parses and clusters players into tiers

**Note:** If you get CSRF token errors, FantasyPros may have changed their login structure. Use the debug tool to investigate.

### 3. FantasyPros API
Uses the official FantasyPros API (requires API key).

**Steps:**
1. Get an API key from FantasyPros
2. Go to `/admin`
3. Select "FantasyPros API" as import method
4. Enter your API key (optional if set in environment)
5. Click "Fetch Rankings from API"

### 3. CSV Import
Upload your own ranking data in CSV format.

**CSV Format:**
```csv
name,team,position,rank,projected_points
Josh Allen,BUF,QB,1,380
Lamar Jackson,BAL,QB,2,375
```

### 5. Text Import
Paste rankings directly from websites.

**Supported formats:**
- `1. Player Name (TEAM)`
- `Player Name - TEAM`
- `1. Player Name TEAM`

### 6. Web Scraping (Fallback)
Attempts to scrape public ranking pages directly.

## Clustering Algorithm

The app uses a **Gaussian Mixture Model (GMM)** to automatically group players into tiers based on their rankings, matching Boris Chen's methodology. This provides more accurate tier breaks than simple k-means clustering.

## Viewing the Visualization

1. Import data using any method above
2. Navigate to `/fantasy-football`
3. Select position and scoring format
4. View the tier chart with:
   - Color-coded tiers
   - Error bars showing ranking variance
   - Interactive hover details

## Technical Details

- **Frontend**: Next.js 15, TypeScript, D3.js
- **Clustering**: Gaussian Mixture Model (TypeScript implementation)
- **Data Sources**: FantasyPros (session auth or API), CSV, manual entry
- **Styling**: Cyberpunk theme with Tailwind CSS

## Environment Variables (Optional)

```env
FANTASYPROS_API_KEY=your_api_key_here
```

## Notes

- Credentials are only used for the current session
- Data is stored locally in the browser
- The clustering algorithm automatically determines optimal tier breaks
- Works best with 20+ players per position