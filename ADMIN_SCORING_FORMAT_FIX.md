# Admin Page Scoring Format Fix Required

## The Problem
The admin page is not passing scoring format when fetching data from FantasyPros, which means:
- It always fetches PPR data (the default)
- The fantasy football page can't show different data for different scoring formats
- Switching between Standard/PPR/Half-PPR shows the same data

## How to Fix the Admin Page

### 1. Add Scoring Format State
```typescript
const [selectedScoringFormat, setSelectedScoringFormat] = useState<'standard' | 'ppr' | 'half-ppr'>('ppr');
```

### 2. Add Scoring Format Selector UI
Add this near the position selector:
```typescript
<div>
  <label className="block text-sm font-medium text-gray-400 mb-2">
    Scoring Format
  </label>
  <select 
    value={selectedScoringFormat}
    onChange={(e) => setSelectedScoringFormat(e.target.value as any)}
    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
  >
    <option value="standard">Standard</option>
    <option value="ppr">PPR</option>
    <option value="half-ppr">Half PPR</option>
  </select>
</div>
```

### 3. Update API Calls
In `handleSessionFetch` and `handleSessionFetchAll`, add scoringFormat to the body:

```typescript
body: JSON.stringify({
  username,
  password,
  position: selectedPosition,
  scoringFormat: selectedScoringFormat  // Add this line
})
```

### 4. Update Free Rankings Too
For the free rankings endpoints, add scoring format to the URL:
```typescript
const url = `/api/fantasy-pros-free?position=${position}&scoringFormat=${selectedScoringFormat}`;
```

## Current Workaround
Until the admin page is updated, you need to:
1. Manually fetch data for each scoring format from the admin page
2. The API endpoints already support scoring format, but the admin UI doesn't pass it

## Testing
After making these changes:
1. Select "Standard" scoring and fetch RB data
2. Select "PPR" scoring and fetch RB data
3. Go to the fantasy football page and switch between formats
4. You should see different rankings/values for each format