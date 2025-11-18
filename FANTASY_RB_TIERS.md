# Fantasy Football RB Tiers - Static Weekly Data Implementation

## Overview

This implementation provides a **static weekly data approach** for displaying Fantasy Football RB (Running Back) tier rankings using a scatter plot chart. The data is updated once per week via a script and stored as a static JSON file, eliminating the need for live API calls during page render.

## Features

✅ **Weekly Static Data Snapshot** - Data stored in `public/fantasy/rb_current.json`
✅ **Interactive Scatter Plot** - Built with D3.js, showing avgRank vs consensusRank
✅ **Tier Color Coding** - 8 tiers with warm color palette
✅ **Hover Tooltips** - Detailed player information on hover
✅ **Automated Updates** - GitHub Actions workflow runs every Wednesday
✅ **Manual Update Script** - Run `npm run update:fantasy-rb` anytime
✅ **No Loading Hangs** - Static data loads instantly, with clear error states

---

## File Structure

```
Website/
├── public/
│   └── fantasy/
│       └── rb_current.json              # Static weekly RB tier data (auto-updated)
│
├── src/
│   ├── components/
│   │   └── RBTiersChart.tsx             # D3 scatter plot chart component
│   │
│   └── app/
│       └── fantasy-football/
│           ├── fantasy-football-client.tsx  # Updated with RB Tiers link
│           └── rb-tiers/
│               ├── page.tsx             # RB Tiers page (server component)
│               └── rb-tiers-client.tsx  # RB Tiers page (client component)
│
├── scripts/
│   └── updateFantasyRBTiers.ts          # Data update script
│
└── .github/
    └── workflows/
        └── update-fantasy-rb.yml        # Weekly automation workflow
```

---

## Data Format

The static JSON file (`public/fantasy/rb_current.json`) follows this schema:

```json
{
  "week": 11,
  "generatedAt": "2025-11-16T09:36:00-08:00",
  "season": "2025",
  "scoringFormat": "PPR",
  "players": [
    {
      "name": "Christian McCaffrey",
      "team": "SF",
      "avgRank": 1.2,
      "consensusRank": 1.0,
      "tier": 1,
      "stdDev": 0.4
    },
    // ... more players
  ]
}
```

### Field Descriptions

- **week**: Current NFL week number
- **generatedAt**: ISO timestamp of when data was generated
- **season**: NFL season year
- **scoringFormat**: Scoring format (PPR, HALF_PPR, or STANDARD)
- **players**: Array of player objects
  - **name**: Player full name
  - **team**: Team abbreviation (e.g., "SF", "PHI")
  - **avgRank**: Average expert rank from multiple sources
  - **consensusRank**: Expert consensus rank (ECR)
  - **tier**: Tier grouping (1-8, where 1 is elite)
  - **stdDev**: Standard deviation of rankings (optional)

---

## Manual Data Update

### Prerequisites

- Node.js 20+ installed
- npm dependencies installed (`npm install`)

### Running the Update Script

To manually update the RB tier data:

```bash
npm run update:fantasy-rb
```

This will:
1. Fetch the latest RB rankings from your configured data source
2. Calculate tier groupings (1-8) based on rankings
3. Transform the data into the required JSON format
4. Write the updated data to `public/fantasy/rb_current.json`
5. Log success or error messages

### Configuring Your Data Source

The update script is located at `scripts/updateFantasyRBTiers.ts`.

**TODO: Configure your real fantasy data API**

Open the script and modify these constants:

```typescript
// Line 30-35 in updateFantasyRBTiers.ts
const API_ENDPOINT = 'https://example.com/api/fantasy/rb/rankings';
const USE_NFLVERSE = true; // Set to false to use API_ENDPOINT
const CURRENT_WEEK = 11;    // Update weekly or fetch dynamically
const SCORING_FORMAT = 'PPR';
```

#### Option 1: Use NFLverse Integration (Current Setup)

If `USE_NFLVERSE = true`, the script attempts to fetch from your existing `/api/fantasy-data` endpoint.

**Note:** This requires your Next.js dev server to be running:
```bash
npm run dev
# Then in another terminal:
npm run update:fantasy-rb
```

#### Option 2: Use External API

Set `USE_NFLVERSE = false` and configure `API_ENDPOINT` with your fantasy data API.

**Free/Open Data Sources:**
- [FantasyData.com](https://fantasydata.com) - Has free tier
- [Sleeper API](https://docs.sleeper.app) - Completely free
- [ESPN Fantasy API](https://fantasy.espn.com/apis/v3)
- [NFLverse GitHub](https://github.com/nflverse/nflverse-data) - Open source NFL data

**If using an API that requires authentication:**

1. Add your API key to environment variables:
   ```bash
   # .env.local
   FANTASY_API_KEY=your_api_key_here
   ```

2. Update the fetch call in `updateFantasyRBTiers.ts`:
   ```typescript
   headers: {
     'Authorization': `Bearer ${process.env.FANTASY_API_KEY}`,
   }
   ```

3. Add the secret to GitHub Actions (for automation):
   - Go to your repo Settings → Secrets and variables → Actions
   - Add `FANTASY_API_KEY` as a repository secret

### Customizing Tier Calculation

The tier groupings are calculated in the `calculateTier()` function (line 77):

```typescript
function calculateTier(rank: number, position: 'RB'): number {
  if (rank <= 4) return 1;   // Elite
  if (rank <= 9) return 2;   // RB1s
  if (rank <= 14) return 3;  // Mid RB1s / High RB2s
  if (rank <= 19) return 4;  // RB2s
  if (rank <= 24) return 5;  // Low RB2s / High RB3s
  if (rank <= 29) return 6;  // RB3s
  if (rank <= 34) return 7;  // Low RB3s / FLEX
  return 8;                  // Deep bench
}
```

Modify these thresholds to match your league's roster requirements and scoring format.

---

## Automated Weekly Updates (GitHub Actions)

### How It Works

A GitHub Actions workflow automatically updates the RB tier data every **Wednesday at 9:00 AM PST** (17:00 UTC).

The workflow:
1. Checks out your repository
2. Installs dependencies
3. Runs the update script
4. Commits and pushes changes (if data changed)
5. Triggers Netlify to redeploy with new data

### Configuration

The workflow file is at `.github/workflows/update-fantasy-rb.yml`.

#### Adjusting the Schedule

The workflow uses cron syntax to schedule runs:

```yaml
schedule:
  - cron: '0 17 * * 3'  # Wednesday 9 AM PST (5 PM UTC)
```

**Other timezone examples:**
- **9 AM EST** (Eastern): `cron: '0 14 * * 3'`
- **9 AM CST** (Central): `cron: '0 15 * * 3'`
- **9 AM MST** (Mountain): `cron: '0 16 * * 3'`

Use [crontab.guru](https://crontab.guru/) to build custom schedules.

#### Manual Trigger

You can manually trigger the workflow from GitHub:

1. Go to your repo → **Actions** tab
2. Select **"Update Fantasy Football RB Tiers"**
3. Click **"Run workflow"** → Select branch → **"Run workflow"**

#### Environment Variables

If your data source requires API keys:

1. Go to repo **Settings** → **Secrets and variables** → **Actions**
2. Add a new repository secret (e.g., `FANTASY_API_KEY`)
3. Uncomment the `env:` section in the workflow file:

```yaml
- name: Run fantasy RB tiers update script
  run: npm run update:fantasy-rb
  env:
    FANTASY_API_KEY: ${{ secrets.FANTASY_API_KEY }}
```

---

## Using the Chart Component

### RBTiersChart Component

The scatter plot chart is implemented in `src/components/RBTiersChart.tsx`.

#### Props

```typescript
interface RBTiersChartProps {
  width?: number;        // Chart width in pixels (default: 900)
  height?: number;       // Chart height in pixels (default: 600)
  showLabels?: boolean;  // Show player labels on chart (default: false)
  className?: string;    // Additional CSS classes
}
```

#### Example Usage

```tsx
import RBTiersChart from '@/components/RBTiersChart';

export default function MyPage() {
  return (
    <div>
      <h1>RB Tiers</h1>
      <RBTiersChart
        width={1000}
        height={700}
        showLabels={false}
        className="my-custom-class"
      />
    </div>
  );
}
```

### Accessing the RB Tiers Page

The RB tiers scatter plot is available at:

**URL:** `/fantasy-football/rb-tiers`

**Link from main fantasy page:**
- A prominent feature card is displayed on `/fantasy-football`
- A "RB Scatter Plot" button is in the header

---

## How the Chart Works

### Scatter Plot Visualization

- **X-axis**: Average Expert Rank (lower = better)
- **Y-axis**: Expert Consensus Rank (lower = better)
- **Color**: Tier grouping (warm color palette, Tier 1 = elite)
- **Points**: Each point represents one RB player
- **Tooltips**: Hover over points to see player details

### D3.js Implementation

The chart is built with D3.js v7.9.0 and includes:

- ✅ Responsive SVG rendering
- ✅ Linear scales with automatic domain calculation
- ✅ Interactive hover states with tooltips
- ✅ Color-coded tier legend
- ✅ Axis labels and grid lines
- ✅ Smooth animations with Framer Motion
- ✅ Error handling and loading states

### Color Scheme

Tiers use the site's warm color palette:

```typescript
const tierColors = [
  '#FF6B35', // Tier 1 - Sunset Orange (Elite)
  '#FF8E53', // Tier 2 - Coral
  '#F7B32B', // Tier 3 - Golden Yellow
  '#FFB020', // Tier 4 - Warm Amber
  '#6BCF7F', // Tier 5 - Fresh Green
  '#8FE39E', // Tier 6 - Light Green
  '#00D9FF', // Tier 7 - Electric Blue
  '#00F5FF'  // Tier 8 - Cyber Teal
];
```

---

## Error Handling

### Loading States

The chart component handles three states:

1. **Loading**: Shows spinner with "Loading tier chart..."
2. **Error**: Shows error message with helpful instructions
3. **Success**: Renders the D3 scatter plot

### Common Errors

**Error: Failed to load RB tier data: 404**
- **Cause**: The `rb_current.json` file doesn't exist
- **Solution**: Run `npm run update:fantasy-rb` to generate it

**Error: No player data available**
- **Cause**: The JSON file exists but has no players array
- **Solution**: Check the JSON structure matches the schema

**Error: API fetch failed**
- **Cause**: The update script couldn't reach your data source
- **Solution**: Configure `API_ENDPOINT` or check your API key

---

## Deployment

### Netlify Auto-Deploy

When changes are committed to `public/fantasy/rb_current.json`:

1. Netlify detects the change via webhook
2. Automatically triggers a new build
3. Deploys the updated site with new data
4. Users see fresh data within ~2-3 minutes

### Manual Deploy

To force a deployment:

```bash
# Commit your changes
git add public/fantasy/rb_current.json
git commit -m "chore: update RB tier rankings for week 11"
git push origin main

# Netlify will auto-deploy
```

### Build Verification

Check that the build succeeds:

```bash
npm run build
```

Look for the RB tiers route in the build output:
```
├ ○ /fantasy-football/rb-tiers    4.2 kB    212 kB
```

---

## Troubleshooting

### Chart Shows "Loading..." Forever

**Problem**: The chart never loads, stuck on loading state.

**Solutions**:
1. Check if `public/fantasy/rb_current.json` exists
2. Verify the JSON is valid (use JSONLint)
3. Check browser console for fetch errors
4. Ensure the file is in the public folder, not src

### Data Is Stale

**Problem**: Chart shows old data from previous weeks.

**Solutions**:
1. Run `npm run update:fantasy-rb` manually
2. Check GitHub Actions workflow ran successfully
3. Verify the `week` field in `rb_current.json`
4. Check Netlify deployed after the data update

### GitHub Actions Fails

**Problem**: The automated workflow fails to run.

**Solutions**:
1. Check Actions tab for error logs
2. Verify the script runs locally: `npm run update:fantasy-rb`
3. Check if API keys are configured (if needed)
4. Ensure `tsx` is in devDependencies

### TypeScript Errors in Update Script

**Problem**: The update script has TypeScript compilation errors.

**Solutions**:
1. Ensure `tsx` is installed: `npm install --save-dev tsx`
2. Check `tsconfig.json` includes the scripts folder
3. Run with explicit TypeScript compilation:
   ```bash
   npx tsx scripts/updateFantasyRBTiers.ts
   ```

---

## Extending to Other Positions

To create scatter plots for other positions (WR, TE, QB):

1. **Duplicate the data file**:
   ```bash
   cp public/fantasy/rb_current.json public/fantasy/wr_current.json
   ```

2. **Duplicate the update script**:
   ```bash
   cp scripts/updateFantasyRBTiers.ts scripts/updateFantasyWRTiers.ts
   ```

3. **Update the script** to fetch WR data and modify tier thresholds

4. **Add npm script** to `package.json`:
   ```json
   "update:fantasy-wr": "tsx scripts/updateFantasyWRTiers.ts"
   ```

5. **Create position-specific chart component** (or make RBTiersChart generic):
   ```tsx
   <PositionTiersChart position="WR" dataFile="/fantasy/wr_current.json" />
   ```

6. **Add routes**: `/fantasy-football/wr-tiers`, etc.

7. **Update GitHub Actions** to run all position updates

---

## Best Practices

### Data Update Timing

- **Wednesday mornings**: After Tuesday night games, before waivers clear
- **Before draft season**: Update multiple times per week
- **During season**: Once per week is sufficient

### Data Source Selection

- Use **consensus rankings** from multiple experts (FantasyPros, ESPN, Yahoo, etc.)
- Avoid single-source data (too variable)
- Consider **ADP (Average Draft Position)** as a backup metric

### Tier Calculation Tips

- Adjust tier thresholds based on league size:
  - **10-team leagues**: Tighten tier ranges (fewer players per tier)
  - **14-team leagues**: Expand tier ranges (more players per tier)
- Account for **bye weeks** during in-season updates
- Consider **injury reports** and recent news

---

## Summary

You now have a complete **static weekly data system** for Fantasy Football RB tiers:

✅ **Static JSON data** (`public/fantasy/rb_current.json`)
✅ **D3 scatter plot chart** (`src/components/RBTiersChart.tsx`)
✅ **Manual update script** (`npm run update:fantasy-rb`)
✅ **Automated weekly updates** (GitHub Actions every Wednesday)
✅ **Dedicated page** (`/fantasy-football/rb-tiers`)
✅ **Integration** (featured on main fantasy football page)

### Next Steps

1. **Configure your data source** in `scripts/updateFantasyRBTiers.ts`
2. **Run the update script** once: `npm run update:fantasy-rb`
3. **Test the chart** at `/fantasy-football/rb-tiers`
4. **Set up GitHub Actions** if not already configured
5. **Extend to other positions** (WR, TE, QB) as needed

---

## Support & Contributions

For issues or questions:
- Check the troubleshooting section above
- Review the inline code comments in `RBTiersChart.tsx` and `updateFantasyRBTiers.ts`
- Open a GitHub issue with error logs

---

**Last Updated**: November 2025
**Created By**: Isaac Vazquez
**Website**: [isaacavazquez.com](https://isaacavazquez.com)
