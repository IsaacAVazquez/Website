# Automation Scripts Documentation

## Overview
The Isaac Vazquez Digital Platform includes 50+ automation scripts for data collection, processing, and maintenance of the fantasy football analytics system. This documentation provides comprehensive coverage of all automation capabilities.

## 📋 Table of Contents

- [Script Categories](#script-categories)
- [Data Collection Scripts](#data-collection-scripts)
- [Data Processing Scripts](#data-processing-scripts)
- [Image Management Scripts](#image-management-scripts)
- [Maintenance Scripts](#maintenance-scripts)
- [Testing & Debug Scripts](#testing--debug-scripts)
- [Usage Guidelines](#usage-guidelines)
- [Troubleshooting](#troubleshooting)

## 🗂️ Script Categories

### Data Collection (15+ scripts)
Scripts for gathering fantasy football data from multiple sources.

### Data Processing (10+ scripts)
Scripts for processing, validating, and transforming collected data.

### Image Management (15+ scripts)
Scripts for player image collection, optimization, and validation.

### Maintenance (8+ scripts)
Scripts for database maintenance, cleanup, and system health.

### Testing & Debug (5+ scripts)
Scripts for testing integrations and debugging data issues.

## 📊 Data Collection Scripts

### Primary Data Collectors

#### `comprehensive-player-scraper.js`
**Purpose:** Advanced player data collection from multiple sources with intelligent fallback handling.

**Features:**
- Multi-source data aggregation (ESPN, FantasyPros, NFL.com)
- Intelligent player matching across sources
- Automatic data validation and quality scoring
- Rate limiting and respectful scraping practices

**Usage:**
```bash
node scripts/comprehensive-player-scraper.js --position QB --format ppr
node scripts/comprehensive-player-scraper.js --all-positions --validate
```

**Configuration:**
- Source priorities and fallback order
- Rate limiting settings (default: 1 request/second)
- Data quality thresholds
- Output format preferences

#### `nfl-roster-scraper.js`
**Purpose:** Maintains up-to-date NFL roster information including transactions, injuries, and depth charts.

**Features:**
- Real-time roster updates
- Transaction tracking (trades, waivers, cuts)
- Injury status monitoring
- Depth chart position tracking

**Usage:**
```bash
node scripts/nfl-roster-scraper.js --update-all
node scripts/nfl-roster-scraper.js --team KC --verbose
```

#### `fantasypros-image-scraper.js`
**Purpose:** FantasyPros data integration with image collection and expert consensus rankings.

**Features:**
- Expert consensus data collection
- Standard deviation calculations for tier analysis
- Player image harvesting with quality assessment
- Multi-format support (PPR, Standard, Half-PPR)

**Usage:**
```bash
node scripts/fantasypros-image-scraper.js --position RB --scoring ppr
node scripts/fantasypros-image-scraper.js --consensus-only
```

### Specialized Collectors

#### `espn-headshot-scraper.js`
**Purpose:** High-quality player headshot collection from ESPN with advanced image processing.

**Features:**
- ESPN's high-resolution player images
- Automatic image optimization and resizing
- Multiple format support (WebP, JPEG, PNG)
- Facial recognition for image validation

**Usage:**
```bash
node scripts/espn-headshot-scraper.js --batch-size 50 --optimize
node scripts/espn-headshot-scraper.js --player "Josh Allen" --high-res
```

#### `enhanced-player-scraper.js`
**Purpose:** Enhanced data collection with advanced statistics and projections.

**Features:**
- Advanced statistical metrics
- Injury history and analysis
- Performance trend analysis
- Predictive modeling data points

**Usage:**
```bash
node scripts/enhanced-player-scraper.js --season 2025 --advanced-stats
node scripts/enhanced-player-scraper.js --injury-analysis --trends
```

## 🔄 Data Processing Scripts

### Data Quality & Validation

#### `advanced-player-matcher.js`
**Purpose:** Intelligent player matching across different data sources using fuzzy matching algorithms.

**Features:**
- Fuzzy string matching for player names
- Team affiliation cross-referencing
- Position consistency validation
- Duplicate detection and merging

**Usage:**
```bash
node scripts/advanced-player-matcher.js --threshold 0.85 --validate
node scripts/advanced-player-matcher.js --merge-duplicates --backup
```

**Configuration:**
```javascript
const matchingConfig = {
  similarity_threshold: 0.85,
  team_weight: 0.3,
  position_weight: 0.2,
  name_weight: 0.5,
  auto_merge: false
};
```

#### `fix-player-mapping.js`
**Purpose:** Corrects player mapping inconsistencies and updates cross-reference tables.

**Features:**
- Automatic mapping correction
- Manual override support
- Mapping validation and verification
- Backup and rollback capabilities

**Usage:**
```bash
node scripts/fix-player-mapping.js --auto-fix --backup
node scripts/fix-player-mapping.js --player-id 12345 --manual-map
```

### Data Transformation

#### `create-master-player-database.js`
**Purpose:** Creates and maintains the master player database with all collected information.

**Features:**
- Data aggregation from multiple sources
- Conflict resolution with source prioritization
- Database schema validation
- Performance optimization

**Usage:**
```bash
node scripts/create-master-player-database.js --rebuild --optimize
node scripts/create-master-player-database.js --incremental --validate
```

#### `update-data.js`
**Purpose:** Orchestrates comprehensive data updates across all systems.

**Features:**
- Coordinated multi-source updates
- Dependency management and ordering
- Error handling and recovery
- Progress tracking and reporting

**Usage:**
```bash
node scripts/update-data.js --full-update --notify
node scripts/update-data.js --fantasy-only --skip-images
```

## 🖼️ Image Management Scripts

### Image Collection & Processing

#### `unified-player-image-scraper.js`
**Purpose:** Unified image collection system with intelligent source selection and quality optimization.

**Features:**
- Multi-source image aggregation
- Quality assessment and ranking
- Automatic format conversion and optimization
- Fallback image generation for missing players

**Usage:**
```bash
node scripts/unified-player-image-scraper.js --quality-threshold 0.8
node scripts/unified-player-image-scraper.js --missing-only --generate-fallbacks
```

**Quality Metrics:**
- Resolution and aspect ratio assessment
- Face detection and centering
- Background removal and consistency
- Compression optimization

#### `cleanup-player-images.js`
**Purpose:** Maintains image library hygiene with duplicate removal and quality improvement.

**Features:**
- Duplicate image detection using perceptual hashing
- Low-quality image identification and replacement
- Orphaned image cleanup
- Storage optimization

**Usage:**
```bash
node scripts/cleanup-player-images.js --remove-duplicates --optimize-storage
node scripts/cleanup-player-images.js --quality-scan --threshold 0.6
```

### Image Validation & Quality

#### `validate-image-system.js`
**Purpose:** Comprehensive image system validation with automated quality assessment.

**Features:**
- Image accessibility and loading validation
- Quality scoring across multiple dimensions
- Missing image detection and reporting
- Performance impact assessment

**Usage:**
```bash
node scripts/validate-image-system.js --full-scan --report
node scripts/validate-image-system.js --fix-broken-links --update-mappings
```

**Validation Checks:**
- URL accessibility and response times
- Image dimensions and file sizes
- Format compatibility and optimization
- CDN integration and caching

#### `resize-oversized-images.js`
**Purpose:** Optimizes image sizes for performance while maintaining quality.

**Features:**
- Intelligent resizing based on usage context
- Multiple size variant generation
- Progressive JPEG and WebP support
- Batch processing with progress tracking

**Usage:**
```bash
node scripts/resize-oversized-images.js --max-size 800x600 --quality 85
node scripts/resize-oversized-images.js --generate-variants --webp-support
```

## 🔧 Maintenance Scripts

### Database Maintenance

#### `validate-images-quality.js`
**Purpose:** Ensures image quality standards and database consistency.

**Features:**
- Quality threshold enforcement
- Database integrity checks
- Performance optimization suggestions
- Automated cleanup recommendations

**Usage:**
```bash
node scripts/validate-images-quality.js --standard-quality --optimize-db
node scripts/validate-images-quality.js --repair-corrupted --backup-first
```

#### `final-validation.js`
**Purpose:** Final system validation before deployment or major updates.

**Features:**
- Comprehensive system health check
- Data consistency validation
- Performance benchmark testing
- Deployment readiness assessment

**Usage:**
```bash
node scripts/final-validation.js --full-system --performance-test
node scripts/final-validation.js --deployment-check --generate-report
```

### System Health

#### `final-coverage-report.js`
**Purpose:** Generates comprehensive coverage reports for data completeness and system health.

**Features:**
- Data completeness analysis
- Feature coverage assessment
- Performance metrics compilation
- Trend analysis and recommendations

**Usage:**
```bash
node scripts/final-coverage-report.js --detailed --export-csv
node scripts/final-coverage-report.js --summary --email-report
```

## 🧪 Testing & Debug Scripts

### Debug & Troubleshooting

#### `debug-espn-scraping.js`
**Purpose:** Debug ESPN data collection issues with detailed logging and analysis.

**Features:**
- Request/response debugging
- Rate limiting analysis
- Error pattern identification
- Performance bottleneck detection

**Usage:**
```bash
node scripts/debug-espn-scraping.js --verbose --trace-requests
node scripts/debug-espn-scraping.js --player "Patrick Mahomes" --deep-debug
```

#### `test-image-mappings.js`
**Purpose:** Validates image mapping accuracy and identifies issues.

**Features:**
- Mapping accuracy verification
- Visual validation support
- Bulk testing capabilities
- Error reporting and suggestions

**Usage:**
```bash
node scripts/test-image-mappings.js --sample-size 100 --visual-check
node scripts/test-image-mappings.js --position QB --detailed-report
```

### Performance Testing

#### `comprehensive-image-test.js`
**Purpose:** Comprehensive testing of image system performance and reliability.

**Features:**
- Load testing with concurrent requests
- CDN performance analysis
- Cache effectiveness measurement
- Mobile performance simulation

**Usage:**
```bash
node scripts/comprehensive-image-test.js --load-test --concurrent 50
node scripts/comprehensive-image-test.js --mobile-sim --cache-analysis
```

## 📋 Usage Guidelines

### Running Scripts Safely

#### Before Running Scripts
1. **Backup Data:** Always backup database and images before major operations
2. **Check Dependencies:** Ensure all required packages are installed
3. **Verify Configuration:** Review script configuration and settings
4. **Test Environment:** Run in development environment first when possible

#### Script Execution Best Practices
```bash
# Always use logging for important operations
node scripts/script-name.js --verbose --log-file operations.log

# Use dry-run mode when available
node scripts/script-name.js --dry-run --preview-changes

# Backup before destructive operations
node scripts/script-name.js --backup --backup-path ./backups/

# Monitor resource usage for large operations
node --max-old-space-size=4096 scripts/large-operation.js
```

### Common Script Options
Most scripts support these common flags:
- `--verbose` - Detailed logging output
- `--dry-run` - Preview changes without executing
- `--backup` - Create backup before operation
- `--help` - Display help and usage information
- `--config path/to/config.json` - Use custom configuration

### Environment Variables
```bash
# Data source credentials
export FANTASYPROS_USERNAME="your-username"
export FANTASYPROS_PASSWORD="your-password"
export ESPN_API_KEY="your-api-key"

# Rate limiting and performance
export SCRAPING_DELAY=1000  # milliseconds between requests
export BATCH_SIZE=50        # items per batch
export MAX_CONCURRENT=10    # concurrent operations

# Output and logging
export LOG_LEVEL=info
export OUTPUT_FORMAT=json
export BACKUP_ENABLED=true
```

## 🔧 Troubleshooting

### Common Issues

#### Rate Limiting Errors
**Symptoms:** HTTP 429 errors, blocked requests
**Solutions:**
- Increase delay between requests (`--delay 2000`)
- Use smaller batch sizes (`--batch-size 25`)
- Implement exponential backoff
- Check IP reputation and rotate if needed

#### Image Quality Issues
**Symptoms:** Low-quality or broken images
**Solutions:**
- Run image validation scripts
- Update source URLs and mappings
- Implement fallback image strategies
- Adjust quality thresholds

#### Data Inconsistency
**Symptoms:** Mismatched player data across sources
**Solutions:**
- Run player matching scripts with higher thresholds
- Manually review and correct mappings
- Update source priorities in configuration
- Validate data integrity after updates

#### Performance Problems
**Symptoms:** Slow script execution, memory issues
**Solutions:**
- Increase Node.js memory limit
- Use streaming for large datasets
- Implement batch processing
- Optimize database queries and indexes

### Debug Commands
```bash
# Enable detailed debugging
DEBUG=scraper:* node scripts/script-name.js

# Memory usage monitoring
node --trace-warnings --max-old-space-size=4096 scripts/script-name.js

# CPU profiling
node --prof scripts/script-name.js
node --prof-process isolate-*.log > profile.txt
```

### Log Analysis
```bash
# Filter error logs
grep "ERROR" logs/automation.log

# Count operation types
awk '{print $3}' logs/automation.log | sort | uniq -c

# Analyze performance patterns
grep "duration:" logs/automation.log | awk '{print $NF}' | sort -n
```

## 🔄 Automation Workflows

### Daily Maintenance
```bash
#!/bin/bash
# Daily automation workflow
node scripts/nfl-roster-scraper.js --update-transactions
node scripts/comprehensive-player-scraper.js --incremental
node scripts/validate-image-system.js --quick-check
node scripts/final-validation.js --health-check
```

### Weekly Deep Clean
```bash
#!/bin/bash
# Weekly comprehensive maintenance
node scripts/cleanup-player-images.js --full-cleanup
node scripts/advanced-player-matcher.js --resolve-conflicts
node scripts/validate-images-quality.js --standard-quality
node scripts/final-coverage-report.js --detailed
```

### Pre-Season Setup
```bash
#!/bin/bash
# Pre-season comprehensive update
node scripts/nfl-roster-scraper.js --full-rebuild
node scripts/comprehensive-player-scraper.js --all-positions --season 2025
node scripts/unified-player-image-scraper.js --complete-collection
node scripts/create-master-player-database.js --rebuild --optimize
```

## 📚 Related Documentation

- **[FANTASY_PLATFORM_SETUP.md](./FANTASY_PLATFORM_SETUP.md)** - Platform configuration and setup
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database structure and relationships
- **[ENVIRONMENT_CONFIGURATION.md](./ENVIRONMENT_CONFIGURATION.md)** - Environment variables and security
- **[PERFORMANCE.md](./PERFORMANCE.md)** - Performance optimization strategies
- **[../API.md](../API.md)** - API endpoints and data flow
- **[../TROUBLESHOOTING.md](../TROUBLESHOOTING.md)** - General troubleshooting guide

---

*This automation documentation covers the comprehensive suite of 50+ scripts powering the fantasy football analytics platform. Regular updates ensure optimal performance and data quality for the dual-purpose digital platform.*