# Database Schema Documentation

## Overview
The Isaac Vazquez Digital Platform uses SQLite as the primary database for fantasy football analytics data, with support for alternative databases in production environments.

## 📋 Table of Contents

- [Database Architecture](#database-architecture)
- [Core Tables](#core-tables)
- [Data Models](#data-models)
- [Relationships](#relationships)
- [Indexes & Performance](#indexes--performance)
- [Data Migration](#data-migration)
- [Backup & Recovery](#backup--recovery)
- [Query Examples](#query-examples)

## 🏗️ Database Architecture

### Primary Database: SQLite
- **File Location:** `./fantasy-data.db`
- **Configuration:** WAL mode enabled for better concurrent access
- **Size:** Typically 10-50MB depending on data volume
- **Performance:** Optimized with strategic indexing and caching

### Alternative Database Support
The platform supports PostgreSQL, MySQL, and other databases via connection string configuration.

## 📊 Core Tables

### 1. Players Table
Stores comprehensive player information and statistics.

```sql
CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    team TEXT,
    jersey_number INTEGER,
    height TEXT,
    weight INTEGER,
    age INTEGER,
    experience INTEGER,
    college TEXT,
    
    -- Fantasy Data
    fantasy_points REAL,
    fantasy_rank INTEGER,
    tier INTEGER,
    average_rank REAL,
    std_deviation REAL,
    
    -- Scoring Formats
    ppr_rank INTEGER,
    half_ppr_rank INTEGER,
    standard_rank INTEGER,
    
    -- Status & Metadata
    status TEXT DEFAULT 'active', -- active, injured, suspended, retired
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_source TEXT DEFAULT 'fantasypros',
    season INTEGER DEFAULT 2025,
    
    UNIQUE(name, position, season)
);
```

### 2. Tiers Table
Machine learning-generated tier groupings for draft strategy.

```sql
CREATE TABLE tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position TEXT NOT NULL,
    tier_number INTEGER NOT NULL,
    tier_name TEXT,
    tier_description TEXT,
    
    -- Tier Statistics
    players_count INTEGER,
    avg_fantasy_points REAL,
    min_rank INTEGER,
    max_rank INTEGER,
    std_deviation REAL,
    
    -- Configuration
    scoring_format TEXT NOT NULL, -- ppr, half_ppr, standard
    calculation_method TEXT DEFAULT 'gaussian_mixture',
    confidence_score REAL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    season INTEGER DEFAULT 2025,
    
    UNIQUE(position, tier_number, scoring_format, season)
);
```

### 3. Player Images Table
Manages player headshot images and metadata.

```sql
CREATE TABLE player_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    
    -- Image Data
    image_url TEXT,
    thumbnail_url TEXT,
    image_hash TEXT,
    file_size INTEGER,
    image_width INTEGER,
    image_height INTEGER,
    
    -- Image Sources
    source TEXT, -- espn, fantasypros, nfl, manual
    source_url TEXT,
    backup_urls TEXT, -- JSON array of fallback URLs
    
    -- Status & Quality
    status TEXT DEFAULT 'active', -- active, broken, pending
    quality_score REAL, -- 0.0-1.0 quality assessment
    verified BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_validated TIMESTAMP,
    
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);
```

### 4. Teams Table
NFL team information and metadata.

```sql
CREATE TABLE teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    abbreviation TEXT NOT NULL UNIQUE,
    city TEXT,
    conference TEXT, -- AFC, NFC
    division TEXT, -- North, South, East, West
    
    -- Visual Identity
    primary_color TEXT,
    secondary_color TEXT,
    logo_url TEXT,
    
    -- Stadium & Location
    stadium_name TEXT,
    stadium_capacity INTEGER,
    timezone TEXT,
    
    -- Metadata
    founded_year INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Draft History Table
Tracks draft selections and analysis.

```sql
CREATE TABLE draft_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    draft_id TEXT NOT NULL,
    
    -- Draft Details
    round INTEGER,
    pick INTEGER,
    overall_pick INTEGER,
    
    -- Player Selection
    player_id INTEGER,
    player_name TEXT NOT NULL,
    position TEXT,
    team TEXT,
    
    -- Draft Analysis
    projected_rank INTEGER,
    actual_rank INTEGER,
    tier_at_selection INTEGER,
    value_assessment TEXT, -- reach, value, expected
    
    -- Context
    league_size INTEGER,
    scoring_format TEXT,
    draft_date TIMESTAMP,
    draft_type TEXT, -- snake, auction, etc.
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (player_id) REFERENCES players(id)
);
```

### 6. Analytics Events Table
User interaction and performance tracking.

```sql
CREATE TABLE analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Event Details
    event_type TEXT NOT NULL,
    event_category TEXT,
    event_label TEXT,
    
    -- User Context
    user_id TEXT, -- Anonymous or authenticated
    session_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    
    -- Page Context
    page_path TEXT,
    page_title TEXT,
    referrer TEXT,
    
    -- Custom Data
    custom_data TEXT, -- JSON string for flexible data
    
    -- Metadata
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE
);
```

## 🔗 Relationships

### Player-Tier Relationship
```sql
-- Players belong to tiers based on position and scoring format
SELECT p.name, p.position, t.tier_number, t.tier_name 
FROM players p
JOIN tiers t ON p.position = t.position 
    AND p.ppr_rank BETWEEN t.min_rank AND t.max_rank
    AND t.scoring_format = 'ppr';
```

### Player-Image Relationship
```sql
-- One-to-many relationship: player can have multiple images
SELECT p.name, pi.image_url, pi.source, pi.quality_score
FROM players p
LEFT JOIN player_images pi ON p.id = pi.player_id
WHERE pi.status = 'active'
ORDER BY pi.quality_score DESC;
```

## 📈 Indexes & Performance

### Primary Indexes
```sql
-- Performance-critical indexes
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_players_rank ON players(ppr_rank, half_ppr_rank, standard_rank);
CREATE INDEX idx_players_team ON players(team);
CREATE INDEX idx_players_status ON players(status);
CREATE INDEX idx_players_tier ON players(tier);

CREATE INDEX idx_tiers_position_format ON tiers(position, scoring_format);
CREATE INDEX idx_tiers_season ON tiers(season);

CREATE INDEX idx_player_images_player_id ON player_images(player_id);
CREATE INDEX idx_player_images_status ON player_images(status);

CREATE INDEX idx_analytics_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
```

### Composite Indexes
```sql
-- Multi-column indexes for complex queries
CREATE INDEX idx_players_pos_rank_tier ON players(position, ppr_rank, tier);
CREATE INDEX idx_players_season_status ON players(season, status);
CREATE INDEX idx_tiers_pos_format_season ON tiers(position, scoring_format, season);
```

## 🔄 Data Migration

### Initial Setup
```sql
-- Run these commands to set up the database
-- Create all tables
.read schema.sql

-- Insert initial team data
INSERT INTO teams (name, abbreviation, city, conference, division) VALUES
('Kansas City Chiefs', 'KC', 'Kansas City', 'AFC', 'West'),
('Buffalo Bills', 'BUF', 'Buffalo', 'AFC', 'East'),
-- ... (all 32 NFL teams)
```

### Migration Scripts
```sql
-- Version 1.0 to 1.1: Add experience column
ALTER TABLE players ADD COLUMN experience INTEGER;

-- Version 1.1 to 1.2: Add tier confidence scores
ALTER TABLE tiers ADD COLUMN confidence_score REAL;

-- Version 1.2 to 1.3: Add player image quality assessment
ALTER TABLE player_images ADD COLUMN quality_score REAL;
ALTER TABLE player_images ADD COLUMN verified BOOLEAN DEFAULT FALSE;
```

## 💾 Backup & Recovery

### Automatic Backups
```bash
# Daily backup via cron job
sqlite3 fantasy-data.db ".backup backup-$(date +%Y%m%d).db"

# Backup with compression
sqlite3 fantasy-data.db ".backup backup-$(date +%Y%m%d).db" && gzip backup-$(date +%Y%m%d).db
```

### Data Export
```sql
-- Export player data to CSV
.headers on
.mode csv
.output players_export.csv
SELECT * FROM players WHERE season = 2025;
.output stdout

-- Export tier analysis
.output tiers_export.csv
SELECT position, scoring_format, tier_number, players_count, avg_fantasy_points 
FROM tiers WHERE season = 2025;
```

### Recovery Procedures
```bash
# Restore from backup
cp backup-20250101.db fantasy-data.db

# Verify data integrity
sqlite3 fantasy-data.db "PRAGMA integrity_check;"

# Rebuild indexes if needed
sqlite3 fantasy-data.db "REINDEX;"
```

## 📊 Query Examples

### Fantasy Analytics Queries
```sql
-- Top 10 players by position
SELECT name, team, ppr_rank, fantasy_points, tier 
FROM players 
WHERE position = 'RB' AND status = 'active'
ORDER BY ppr_rank 
LIMIT 10;

-- Tier distribution by position
SELECT position, tier_number, tier_name, players_count,
       ROUND(avg_fantasy_points, 2) as avg_points
FROM tiers 
WHERE scoring_format = 'ppr' AND season = 2025
ORDER BY position, tier_number;

-- Draft value analysis
SELECT p.name, p.position, p.ppr_rank, 
       dh.overall_pick, dh.value_assessment,
       (dh.overall_pick - p.ppr_rank) as reach_value
FROM draft_history dh
JOIN players p ON dh.player_id = p.id
WHERE dh.draft_date >= '2024-08-01'
ORDER BY reach_value DESC;
```

### Performance Analytics
```sql
-- Most viewed players
SELECT p.name, p.position, COUNT(ae.id) as view_count
FROM analytics_events ae
JOIN players p ON CAST(JSON_EXTRACT(ae.custom_data, '$.player_id') AS INTEGER) = p.id
WHERE ae.event_type = 'player_view'
AND ae.timestamp >= datetime('now', '-30 days')
GROUP BY p.id
ORDER BY view_count DESC
LIMIT 20;

-- Tier chart interactions
SELECT event_label as position, COUNT(*) as interactions
FROM analytics_events 
WHERE event_type = 'tier_chart_view'
AND timestamp >= datetime('now', '-7 days')
GROUP BY event_label
ORDER BY interactions DESC;
```

### Data Quality Queries
```sql
-- Players missing images
SELECT p.name, p.position, p.team
FROM players p
LEFT JOIN player_images pi ON p.id = pi.player_id
WHERE pi.id IS NULL AND p.status = 'active';

-- Image quality assessment
SELECT source, 
       COUNT(*) as total_images,
       AVG(quality_score) as avg_quality,
       SUM(CASE WHEN quality_score > 0.8 THEN 1 ELSE 0 END) as high_quality_count
FROM player_images
WHERE status = 'active'
GROUP BY source;
```

## 🛠️ Database Maintenance

### Regular Maintenance Tasks
```sql
-- Vacuum database to reclaim space
VACUUM;

-- Analyze query planner statistics
ANALYZE;

-- Check database integrity
PRAGMA integrity_check;

-- View database size and page info
PRAGMA page_count;
PRAGMA page_size;
```

### Performance Monitoring
```sql
-- Check query performance
.timer on
.explain query plan
SELECT * FROM players WHERE position = 'QB' ORDER BY ppr_rank;

-- Index usage analysis
.schema --indent
PRAGMA index_list('players');
PRAGMA index_info('idx_players_position');
```

## 📚 Related Documentation

- **[FANTASY_PLATFORM_SETUP.md](./FANTASY_PLATFORM_SETUP.md)** - Platform setup and configuration
- **[API.md](./API.md)** - API endpoints for database operations
- **[PERFORMANCE.md](./PERFORMANCE.md)** - Performance optimization strategies
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common database issues and solutions

---

*This schema documentation provides complete coverage of the fantasy football analytics database structure. The design prioritizes performance, data integrity, and scalability while maintaining simplicity for development and maintenance.*