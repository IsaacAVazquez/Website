# Fantasy Football Automated Updates Setup

## Overview
The Fantasy Football data is automatically updated daily at 2 AM UTC using Netlify Scheduled Functions.

## Configuration

### 1. Environment Variables
Set these in your Netlify dashboard under Site Settings > Environment Variables:

```bash
# Required for cron authentication
CRON_SECRET="generate-a-secure-random-string"

# Required for FantasyPros API access
FANTASYPROS_USERNAME="your-username"
FANTASYPROS_PASSWORD="your-password"

# Optional: Override default site URL
URL="https://isaacvazquez.com"
```

### 2. Generate CRON_SECRET
Generate a secure random string for CRON_SECRET:

```bash
openssl rand -base64 32
```

### 3. Deployment
The scheduled function is automatically deployed with your site. No additional configuration needed.

## How It Works

1. **Netlify Scheduled Function** (`netlify/functions/scheduled-fantasy-update.ts`)
   - Runs daily at 2 AM UTC
   - Authenticates using CRON_SECRET
   - Calls the internal API endpoint

2. **API Endpoint** (`/api/scheduled-update`)
   - Verifies the CRON_SECRET
   - Fetches latest data from FantasyPros
   - Updates all positions (QB, RB, WR, TE, K, DST, FLEX, OVERALL)
   - Persists data to TypeScript files weekly

3. **Data Flow**
   ```
   Netlify Cron (2 AM UTC) 
   → Scheduled Function 
   → API Endpoint (with auth)
   → FantasyPros API
   → Data Storage
   ```

## Monitoring

### Check Function Logs
1. Go to Netlify Dashboard
2. Navigate to Functions tab
3. Click on `scheduled-fantasy-update`
4. View execution logs

### Manual Testing
Test the scheduled function locally:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run functions locally
netlify functions:serve

# Test the function (in another terminal)
curl http://localhost:9999/.netlify/functions/scheduled-fantasy-update
```

### Manual Trigger
You can manually trigger an update from the admin panel:
1. Navigate to `/admin`
2. Sign in with admin credentials
3. Use the "Update All Positions" button

## Troubleshooting

### Function Not Running
- Check that environment variables are set in Netlify
- Verify the function appears in Netlify Functions dashboard
- Check function logs for errors

### Authentication Errors
- Ensure CRON_SECRET matches in both environment and API
- Verify the Authorization header format: `Bearer {secret}`

### Data Not Updating
- Check FantasyPros credentials are valid
- Verify API rate limits aren't exceeded
- Check browser console for API errors

### Schedule Changes
To change the update schedule, modify the cron expression in:
`netlify/functions/scheduled-fantasy-update.ts`

Current schedule: `'0 2 * * *'` (2 AM UTC daily)

Cron format: `minute hour day month day-of-week`
- `0 3 * * *` - 3 AM UTC daily
- `0 2 * * 1` - 2 AM UTC every Monday
- `0 */6 * * *` - Every 6 hours