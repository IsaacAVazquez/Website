# Environment Configuration Guide

## Overview
This guide covers environment variable setup for both development and production deployments of the Isaac Vazquez Digital Platform.

## 📋 Table of Contents

- [Required Environment Variables](#required-environment-variables)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Platform-Specific Instructions](#platform-specific-instructions)
- [Security Best Practices](#security-best-practices)
- [Testing & Verification](#testing--verification)
- [Troubleshooting](#troubleshooting)

## 🔧 Required Environment Variables

### Core Application
```bash
# Application Environment
NODE_ENV=production                    # Environment mode
SITE_URL=https://yourdomain.com       # Your production URL
NEXT_PUBLIC_SITE_URL=https://yourdomain.com  # Public-facing URL
```

### Authentication & Security
```bash
# NextAuth.js Configuration
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secure-random-string-32-chars-min

# Admin Panel Access
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-secure-admin-password

# API Security
CRON_SECRET=your-long-random-cron-secret-for-scheduled-updates
```

### Fantasy Football Platform
```bash
# FantasyPros Integration (Primary Data Source)
FANTASYPROS_USERNAME=your-fantasypros-account-username
FANTASYPROS_PASSWORD=your-fantasypros-account-password

# Optional: FantasyPros API (Alternative/Backup)
FANTASYPROS_API_KEY=your-fantasypros-api-key

# Database Configuration
DATABASE_URL=./fantasy-data.db        # SQLite (default) or external DB URL
```

### Analytics & Monitoring (Optional)
```bash
# Google Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your-ga-measurement-id

# Performance Monitoring
VERCEL_ANALYTICS_ID=your-vercel-analytics-id
```

## 💻 Development Setup

### 1. Create Environment File
Create `.env.local` in your project root:

```bash
# Copy this template and fill in your values
cp .env.example .env.local
```

### 2. Development Environment Variables
```bash
# .env.local (for development only)
NODE_ENV=development
SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-key-replace-in-production

# Admin (development only - use secure credentials in production)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Fantasy Sports (use your real credentials)
FANTASYPROS_USERNAME=your-real-fantasypros-username
FANTASYPROS_PASSWORD=your-real-fantasypros-password

# Security
CRON_SECRET=dev-cron-secret-replace-in-production
```

### 3. Generate Secure Secrets
```bash
# Generate secure NEXTAUTH_SECRET
openssl rand -base64 32

# Generate secure CRON_SECRET
openssl rand -hex 32

# Or use online generators for development
```

## 🚀 Production Deployment

### Environment Variable Security Checklist
- [ ] **Never commit `.env` files to Git**
- [ ] Use strong, unique passwords for all services
- [ ] Generate cryptographically secure secrets
- [ ] Use different credentials for dev vs production
- [ ] Regularly rotate sensitive credentials
- [ ] Enable 2FA on FantasyPros account if available

### Required Production Values
```bash
# Essential Production Environment Variables
NODE_ENV=production
SITE_URL=https://your-actual-domain.com
NEXTAUTH_URL=https://your-actual-domain.com
NEXTAUTH_SECRET=[Generate with: openssl rand -base64 32]
ADMIN_USERNAME=[Choose secure username]
ADMIN_PASSWORD=[Choose strong password]
FANTASYPROS_USERNAME=[Your FantasyPros account]
FANTASYPROS_PASSWORD=[Your FantasyPros password]
CRON_SECRET=[Generate with: openssl rand -hex 32]
```

## 🌐 Platform-Specific Instructions

### Netlify Deployment
1. **Via Dashboard:**
   - Go to Site Settings → Environment Variables
   - Add each variable individually
   - Click "Save" after each addition

2. **Via CLI:**
   ```bash
   netlify env:set VARIABLE_NAME "variable_value"
   ```

3. **Via netlify.toml:**
   ```toml
   [context.production.environment]
     NODE_ENV = "production"
     SITE_URL = "https://yourdomain.com"
   ```

### Vercel Deployment
1. **Via Dashboard:**
   - Go to Project Settings → Environment Variables
   - Add variables for Production, Preview, and Development

2. **Via CLI:**
   ```bash
   vercel env add VARIABLE_NAME production
   ```

### Self-Hosted/VPS
```bash
# Create production .env file
sudo nano /path/to/your/app/.env.production

# Set secure file permissions
sudo chmod 600 /path/to/your/app/.env.production
sudo chown your-app-user:your-app-group /path/to/your/app/.env.production
```

### Docker Deployment
```dockerfile
# In your Dockerfile or docker-compose.yml
environment:
  - NODE_ENV=production
  - SITE_URL=https://yourdomain.com
  - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
  # ... other variables
```

## 🔒 Security Best Practices

### Secret Generation
```bash
# Strong NEXTAUTH_SECRET (32+ characters)
openssl rand -base64 32

# Strong CRON_SECRET (64+ hex characters)  
openssl rand -hex 32

# Alternative: Use password managers to generate 32+ character random strings
```

### Credential Management
1. **Use different credentials for each environment**
2. **Store credentials in secure password managers**
3. **Never share credentials via insecure channels**
4. **Regularly audit and rotate credentials**
5. **Monitor for unauthorized access**

### Access Control
- Limit admin panel access to specific IP addresses if possible
- Use strong, unique admin credentials
- Enable logging for admin actions
- Regular security audits

## ✅ Testing & Verification

### Environment Variables Check
```bash
# Test if all required variables are set
npm run test:env

# Manual verification in Node.js
console.log('NEXTAUTH_SECRET set:', !!process.env.NEXTAUTH_SECRET);
console.log('FANTASYPROS_USERNAME set:', !!process.env.FANTASYPROS_USERNAME);
```

### Application Health Check
1. **Visit your deployed site** - should load without errors
2. **Test admin login** - navigate to `/admin`
3. **Verify fantasy data** - check `/fantasy-football` page
4. **Test API endpoints** - check `/api/fantasy-data`
5. **Monitor logs** for environment-related errors

### Functionality Tests
```bash
# Test FantasyPros integration
curl -X POST https://yourdomain.com/api/fantasy-pros-session \
  -H "Content-Type: application/json"

# Test scheduled update endpoint (with CRON_SECRET)
curl -X POST https://yourdomain.com/api/scheduled-update \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 🔧 Troubleshooting

### Common Issues

#### "Authentication Configuration Error"
- **Check:** `NEXTAUTH_URL` matches your domain exactly
- **Check:** `NEXTAUTH_SECRET` is set and sufficiently long (32+ chars)
- **Solution:** Redeploy after setting correct values

#### "Admin Login Failed"
- **Check:** `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set
- **Check:** No trailing spaces in credentials
- **Solution:** Clear browser cache, verify credentials

#### "Fantasy Data Not Loading"
- **Check:** `FANTASYPROS_USERNAME` and `FANTASYPROS_PASSWORD` are correct
- **Test:** Try logging into FantasyPros manually with same credentials
- **Solution:** Update credentials if FantasyPros account changed

#### "Scheduled Updates Not Working"
- **Check:** `CRON_SECRET` is set and matches cron service configuration
- **Check:** Cron job is properly configured in deployment platform
- **Solution:** Test manual API call with correct Authorization header

#### "Environment Variables Not Loading"
- **Check:** File permissions on environment files
- **Check:** Variable names match exactly (case-sensitive)
- **Check:** No syntax errors in environment files
- **Solution:** Restart application after fixing issues

### Debug Commands
```bash
# Check environment in development
npm run dev:env-check

# Verify production environment
npm run prod:health-check

# Test specific integrations
npm run test:fantasypros
npm run test:database
npm run test:auth
```

### Logging Environment Issues
```javascript
// Add to your application for debugging
console.log('Environment Check:', {
  nodeEnv: process.env.NODE_ENV,
  siteUrl: process.env.SITE_URL,
  nextAuthUrl: process.env.NEXTAUTH_URL,
  hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
  hasFantasyProsCreds: !!(process.env.FANTASYPROS_USERNAME && process.env.FANTASYPROS_PASSWORD),
  hasCronSecret: !!process.env.CRON_SECRET
});
```

## 📚 Related Documentation

- **[FANTASY_PLATFORM_SETUP.md](./FANTASY_PLATFORM_SETUP.md)** - Complete platform setup guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment instructions  
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[SECURITY.md](./SECURITY.md)** - Security best practices and hardening

---

*This configuration guide ensures secure and proper setup of all environment variables needed for the dual-purpose platform. Always follow security best practices when handling sensitive credentials.*