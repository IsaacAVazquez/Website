# Fantasy Football Analytics Platform Setup

## Overview
This comprehensive guide covers the setup and operation of the Fantasy Football Analytics Platform, including data sources, persistence, and automated updates.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Data Import Methods](#data-import-methods)
- [Data Persistence System](#data-persistence-system)
- [Automated Updates](#automated-updates)
- [Database Configuration](#database-configuration)
- [Testing & Debugging](#testing--debugging)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- SQLite database setup
- FantasyPros account (recommended)
- Deployment platform with environment variable support

### Basic Setup
1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables** (see [Environment Configuration](#environment-configuration))

3. **Initialize database**
   ```bash
   npm run setup:database
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access admin panel** at `http://localhost:3000/admin`

## ⚙️ Environment Configuration

### Required Environment Variables

```bash
# FantasyPros Integration (Recommended)
FANTASYPROS_USERNAME=your-fantasypros-username
FANTASYPROS_PASSWORD=your-fantasypros-password

# Security
CRON_SECRET=your-cron-secret-here
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://yourdomain.com

# Optional: FantasyPros API
FANTASYPROS_API_KEY=your-api-key-here

# Database (SQLite by default)
DATABASE_URL=./fantasy-data.db

# Deployment Platform
NODE_ENV=production
```

### Platform-Specific Setup

#### Vercel Deployment
1. Add environment variables in Vercel project settings
2. The `vercel.json` is pre-configured with cron jobs
3. Automatic nightly updates at 12:00 AM EST (5:00 AM UTC)

#### Netlify Deployment
1. Add environment variables in Netlify site settings
2. Configure build command: `npm run build`
3. Set up external cron service for updates

## 📊 Data Import Methods

### 1. Free Rankings (Recommended First Try)
Access public FantasyPros rankings without authentication.

**Steps:**
1. Navigate to `/admin`
2. Select "Free Rankings" as import method
3. Click "Get [Position] Rankings" for single position
4. Or click "Get All Positions" for complete data import
5. Use "Debug FantasyPros Structure" if issues arise

**Benefits:**
- No credentials required
- Fast setup and testing
- Good for development environment
- Public data access when available

### 2. FantasyPros Login (Primary Method)
Uses FantasyPros account credentials for official expert consensus data.

**Steps:**
1. Go to `/admin`
2. Select "FantasyPros Login" as import method
3. Enter your FantasyPros username and password
4. Click "Fetch [Position] Rankings" or "Fetch All Positions"
5. Data automatically processes and creates ML-powered tiers

**Benefits:**
- Official expert consensus rankings
- Includes standard deviations for tier calculations
- Automatic XLS file parsing
- Machine learning tier generation
- All scoring formats supported (PPR, Half-PPR, Standard)

**Troubleshooting:**
- CSRF token errors indicate FantasyPros structure changes
- Use debug tools to investigate API changes
- Check credentials are correct and account is active

### 3. FantasyPros API (Backup Method)
Official API access with dedicated API key.

**Steps:**
1. Obtain API key from FantasyPros
2. Go to `/admin`
3. Select "FantasyPros API" as import method
4. Enter API key (or set in environment)
5. Click "Fetch Rankings from API"

**Benefits:**
- Official API support
- Rate limiting compliance
- Structured data format
- Reliable access

## 💾 Data Persistence System

### Multi-Tier Storage Architecture

```
Data Storage Layers:
1. SQLite Database (primary persistence)
2. File System Cache (src/data/)
3. In-Memory Cache (performance)
4. localStorage (client-side)
```

### Database Schema
```sql
-- Player data with statistics
CREATE TABLE players (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    team TEXT,
    rank INTEGER,
    tier INTEGER,
    scoring_format TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tier calculations and metadata
CREATE TABLE tiers (
    id INTEGER PRIMARY KEY,
    position TEXT NOT NULL,
    tier_number INTEGER,
    tier_name TEXT,
    players_count INTEGER,
    scoring_format TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### File Structure
```
src/data/
├── qbData.ts         # Quarterback rankings
├── rbData.ts         # Running back rankings  
├── wrData.ts         # Wide receiver rankings
├── teData.ts         # Tight end rankings
├── kData.ts          # Kicker rankings
├── dstData.ts        # Defense/ST rankings
├── flexData.ts       # Flex position rankings
├── overallData.ts    # Overall rankings across positions
├── sampleData.ts     # Main export file
└── backup/           # Automatic backups (gitignored)
```

### Metadata Tracking
Each data file includes comprehensive metadata:
```typescript
/**
 * QB Player Data
 * Last Updated: 2025-01-13T10:30:00.000Z
 * Source: fantasypros
 * Format: ppr
 * Version: 1.0.0
 * Players: 32
 * Tiers: 8
 */
```

## 🔄 Automated Updates

### Scheduled Updates
- **Frequency:** Nightly at 12:00 AM EST (5:00 AM UTC)
- **Trigger:** Automated cron jobs via deployment platform
- **Scope:** All positions and scoring formats
- **Backup:** Automatic data backups before updates

### Manual Updates
You can trigger manual updates via:

1. **Admin Panel:**
   - Navigate to `/admin`
   - Click "Update All Data"
   - Monitor progress in real-time

2. **API Endpoint:**
   ```bash
   POST /api/scheduled-update
   Headers: Authorization: Bearer YOUR_CRON_SECRET
   ```

3. **Update Button:**
   - Use the UpdateDataButton component in the UI
   - Provides real-time status updates

### Update Process
1. Fetch latest data from FantasyPros
2. Run machine learning tier calculations
3. Update SQLite database
4. Refresh file system cache
5. Clear in-memory cache
6. Generate tier visualizations
7. Create automatic backup

## 🗄️ Database Configuration

### SQLite Setup (Default)
```javascript
// lib/database.ts configuration
const database = new Database('./fantasy-data.db');
database.pragma('journal_mode = WAL');
database.pragma('synchronous = NORMAL');
database.pragma('cache_size = 1000000');
database.pragma('temp_store = MEMORY');
```

### Alternative Database Support
The platform supports additional databases:
- PostgreSQL (production recommended)
- MySQL/MariaDB
- Azure SQL Database

Configure via `DATABASE_URL` environment variable.

## 🧪 Testing & Debugging

### Data Import Testing
```bash
# Test all data sources
npm run test:data-import

# Test specific position
npm run test:position QB

# Debug FantasyPros integration
npm run debug:fantasypros
```

### Admin Panel Debug Tools
1. **Debug FantasyPros Structure** - Analyze HTML structure changes
2. **Data Validation** - Check data integrity and completeness
3. **Tier Calculation Test** - Verify ML algorithm results
4. **API Response Inspector** - Debug API responses

### Manual Testing Steps
1. Access `/admin` panel
2. Test each data import method
3. Verify tier calculations are accurate
4. Check player image loading
5. Validate data persistence across restarts

## 🔧 Troubleshooting

### Common Issues

#### 1. FantasyPros Login Failures
**Symptoms:** CSRF errors, authentication failures
**Solutions:**
- Verify credentials are correct
- Check FantasyPros hasn't changed login structure
- Use debug tools to analyze HTML structure
- Try free rankings method as alternative

#### 2. Data Not Persisting
**Symptoms:** Data lost after restart
**Solutions:**
- Check file permissions on `src/data/` directory
- Verify SQLite database is writable
- Check environment variables are set correctly
- Review error logs for database connection issues

#### 3. Tier Calculations Failing
**Symptoms:** Players not grouped into tiers
**Solutions:**
- Check data format and completeness
- Verify machine learning libraries are installed
- Review tier calculation algorithm logs
- Use sample data for testing

#### 4. Player Images Missing
**Symptoms:** Broken player image placeholders
**Solutions:**
- Check player image scraping scripts
- Verify image URLs are accessible
- Run image validation script
- Check CDN and caching settings

### Debug Commands
```bash
# Check data integrity
npm run validate:data

# Test ML tier calculations
npm run test:tiers

# Validate player images
npm run validate:images

# Full system health check
npm run health:check
```

### Performance Optimization
1. **Database Indexing:**
   ```sql
   CREATE INDEX idx_players_position ON players(position);
   CREATE INDEX idx_players_rank ON players(rank);
   CREATE INDEX idx_players_scoring_format ON players(scoring_format);
   ```

2. **Cache Configuration:**
   - Enable SQLite WAL mode for better performance
   - Configure appropriate cache sizes
   - Implement Redis for production caching

3. **Image Optimization:**
   - Use WebP format for player images
   - Implement lazy loading for image components
   - Set up CDN for image delivery

## 🚀 Production Deployment Checklist

- [ ] Environment variables configured
- [ ] Database initialized and accessible
- [ ] FantasyPros credentials working
- [ ] Cron jobs scheduled correctly
- [ ] SSL certificates installed
- [ ] Monitoring and logging enabled
- [ ] Backup systems configured
- [ ] Performance optimization applied
- [ ] Security headers configured
- [ ] API rate limiting enabled

## 📚 Additional Resources

- **[API.md](./API.md)** - Complete API documentation
- **[PERFORMANCE.md](./PERFORMANCE.md)** - Performance optimization guide
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[scripts/](./scripts/)** - Data collection and processing scripts

---

*This setup guide provides comprehensive coverage of the Fantasy Football Analytics Platform. For specific implementation details, refer to the individual documentation files and source code comments.*