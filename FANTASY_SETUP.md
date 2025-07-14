# Fantasy Pros Integration Setup

## Overview
This application now includes automatic nightly updates from FantasyPros using your login credentials.

## Environment Variables
The following environment variables need to be set in your deployment platform (Vercel/Netlify):

```bash
FANTASYPROS_USERNAME=Votedonut@yahoo.com
FANTASYPROS_PASSWORD=n5WRvVzc^KyDi2k^
CRON_SECRET=6442c98c509eb7c8b62852d6efb084e8699e46b6f66955f66784cae784c64176
```

## Automatic Updates
The application will automatically update all fantasy rankings data every night at 12:00 AM EST (5:00 AM UTC).

### Vercel Deployment
If deploying to Vercel:
1. The `vercel.json` file is already configured with the cron job
2. Add the environment variables in your Vercel project settings
3. The cron job will automatically run at the scheduled time

### Other Platforms
For non-Vercel deployments, you'll need to set up an external cron service to call:
```
POST https://your-domain.com/api/scheduled-update
Headers: Authorization: Bearer YOUR_CRON_SECRET
```

## Manual Updates
You can manually trigger updates by:
1. Using the UpdateDataButton component in your UI
2. Making a POST request to `/api/fantasy-pros-session` with no body

## Testing
To test the integration:
1. Check that environment variables are set correctly
2. Try a manual update using the API endpoint
3. Verify data is being fetched for all positions including OVERALL

## Data Sources
- **Primary**: FantasyPros login-based scraping
- **Cache**: Local browser cache for performance
- **Fallback**: Sample data if API fails

## Important Notes
- The OVERALL position now works correctly with the login-based approach
- Data is cached locally to improve performance
- All scoring formats (PPR, Half-PPR, Standard) are supported
- Keep your credentials secure and never commit them to git