# Environment Variables Setup for Production

## Required Environment Variables

Your application requires the following environment variables to be configured in your Netlify deployment:

### Authentication (NextAuth.js)
```bash
# Required for NextAuth.js to function properly
NEXTAUTH_URL=https://isaacavazquez.com
NEXTAUTH_SECRET=kr1TsL7jO3hm21vnJSze8tCWMLVBPxA6VQCbFK4ywqw=

# Admin panel credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Fantasy Pros Integration
```bash
# Your Fantasy Pros account credentials for automatic data updates
FANTASYPROS_USERNAME=Votedonut@yahoo.com
FANTASYPROS_PASSWORD=n5WRvVzc^KyDi2k^

# Security token for scheduled update endpoint
CRON_SECRET=6442c98c509eb7c8b62852d6efb084e8699e46b6f66955f66784cae784c64176
```

## How to Set Environment Variables in Netlify

### Method 1: Netlify Dashboard (Recommended)
1. Go to your Netlify dashboard
2. Select your site (isaacavazquez.com)
3. Navigate to **Site Settings**
4. Click on **Environment Variables** in the left sidebar
5. Click **"Add a variable"** for each required variable
6. Enter the variable name and value exactly as shown above
7. Click **"Create variable"**
8. Repeat for all 6 variables

### Method 2: Netlify CLI (Alternative)
If you have Netlify CLI installed:
```bash
netlify env:set NEXTAUTH_URL "https://isaacavazquez.com"
netlify env:set NEXTAUTH_SECRET "kr1TsL7jO3hm21vnJSze8tCWMLVBPxA6VQCbFK4ywqw="
netlify env:set ADMIN_USERNAME "admin"
netlify env:set ADMIN_PASSWORD "admin123"
netlify env:set FANTASYPROS_USERNAME "Votedonut@yahoo.com"
netlify env:set FANTASYPROS_PASSWORD "n5WRvVzc^KyDi2k^"
netlify env:set CRON_SECRET "6442c98c509eb7c8b62852d6efb084e8699e46b6f66955f66784cae784c64176"
```

## Verification Steps

After setting the environment variables:

1. **Redeploy your site** (Netlify will automatically redeploy when environment variables change)
2. **Test admin access**: Visit `https://isaacavazquez.com/admin`
3. **Login with credentials**: 
   - Username: `admin`
   - Password: `admin123`
4. **Verify automatic updates**: Check that Fantasy data updates work
5. **Test scheduled function**: Should run daily at midnight PST

## Common Issues and Solutions

### Issue: "Authentication failed" or redirect to error page
**Solution**: 
- Verify `NEXTAUTH_URL` is set to exactly `https://isaacavazquez.com`
- Verify `NEXTAUTH_SECRET` is set and not empty
- Check that admin credentials match exactly

### Issue: "Server configuration error"
**Solution**: 
- All environment variables must be set
- No trailing spaces in variable values
- Redeploy after setting variables

### Issue: Fantasy data not updating
**Solution**: 
- Verify `FANTASYPROS_USERNAME` and `FANTASYPROS_PASSWORD` are correct
- Check `CRON_SECRET` is set for scheduled updates
- Test manual update from admin panel

### Issue: Admin login doesn't work
**Solution**: 
- Verify `ADMIN_USERNAME=admin` and `ADMIN_PASSWORD=admin123`
- Case sensitive - must match exactly
- Clear browser cache and try again

## Security Notes

- **Never commit these values to Git**
- Environment variables are only visible in Netlify dashboard to site owners
- `NEXTAUTH_SECRET` should be a long, random string (current one is secure)
- Consider rotating passwords periodically
- `CRON_SECRET` prevents unauthorized API access

## Testing Environment Variables

You can test if environment variables are properly set by:

1. Visit `/api/scheduled-update` with GET request and proper authorization
2. Check admin panel functionality
3. Trigger manual Fantasy data update
4. Verify scheduled updates run at midnight PST

If any environment variable is missing or incorrect, the application will show specific error messages to help with debugging.