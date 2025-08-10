# API Documentation

This document provides comprehensive documentation for all API endpoints in the Isaac Vazquez Portfolio project.

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Data Manager API](#data-manager-api)
- [FantasyPros Integration APIs](#fantasypros-integration-apis)
- [Utility APIs](#utility-apis)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## 🌐 Overview

The API is built using Next.js App Router API routes with TypeScript. All endpoints return JSON responses and follow RESTful conventions where applicable.

**Base URL:** `https://isaacavazquez.com/api` (Production)  
**Development:** `http://localhost:3000/api`

### Response Format

All API responses follow a consistent format:

```typescript
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  note?: string;
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## 🔐 Authentication

### Session-Based Authentication

For FantasyPros integration, the API uses session-based authentication with CSRF token management.

**Headers:**
```http
Content-Type: application/json
User-Agent: Mozilla/5.0 (compatible; Portfolio-Bot)
```

**Credentials:**
```typescript
interface FantasyProsCredentials {
  username: string;
  password: string;
}
```

## 📊 Data Manager API

### Overview

The Data Manager API handles persistent storage and retrieval of fantasy football player data across different scoring formats.

**Base Path:** `/api/data-manager`

### Get Player Data

Retrieve stored player data for a specific position and scoring format.

```http
GET /api/data-manager
```

**Query Parameters:**
- `position` (optional): Position to filter (`QB`, `RB`, `WR`, `TE`, `FLEX`, `K`, `DST`)
- `dataset` (optional): Dataset to query (`current`, `fantasypros-session`, `free-ranking`)
- `scoringFormat` (optional): Scoring format (`standard`, `ppr`, `half-ppr`)
- `compare` (optional): Return comparison data (`true` for all datasets)

**Example Request:**
```http
GET /api/data-manager?position=RB&dataset=fantasypros-session&scoringFormat=ppr
```

**Example Response:**
```json
{
  "success": true,
  "position": "RB",
  "dataset": "fantasypros-session-ppr",
  "scoringFormat": "ppr",
  "players": [
    {
      "id": "1",
      "name": "Christian McCaffrey",
      "team": "SF",
      "position": "RB",
      "averageRank": 1.2,
      "standardDeviation": 0.8,
      "tier": 1,
      "projectedPoints": 285.5
    }
  ],
  "count": 45
}
```

### Store Player Data

Store player rankings data for a specific position and scoring format.

```http
POST /api/data-manager
```

**Request Body:**
```typescript
interface StoreDataRequest {
  position: string;
  players: Player[];
  action?: 'set' | 'append' | 'clear';
  dataset?: string;
  source?: string;
  scoringFormat?: string;
}
```

**Example Request:**
```json
{
  "position": "RB",
  "players": [
    {
      "name": "Christian McCaffrey",
      "team": "SF",
      "position": "RB",
      "averageRank": 1.2,
      "standardDeviation": 0.8,
      "projectedPoints": 285.5
    }
  ],
  "action": "set",
  "source": "fantasypros-session",
  "scoringFormat": "ppr"
}
```

**Example Response:**
```json
{
  "success": true,
  "position": "RB",
  "action": "set",
  "dataset": "fantasypros-session-ppr",
  "scoringFormat": "ppr",
  "source": "fantasypros-session",
  "playersStored": 45,
  "message": "Successfully set 45 players for RB in fantasypros-session-ppr dataset"
}
```

### Clear Data

Remove stored data for a specific position or entire dataset.

```http
DELETE /api/data-manager
```

**Query Parameters:**
- `position` (optional): Position to clear
- `dataset` (optional): Dataset to clear (`all` for all datasets)

**Example Request:**
```http
DELETE /api/data-manager?position=RB&dataset=fantasypros-session-ppr
```

**Example Response:**
```json
{
  "success": true,
  "message": "Cleared data for RB in fantasypros-session-ppr dataset",
  "position": "RB",
  "dataset": "fantasypros-session-ppr"
}
```

## 🏈 FantasyPros Integration APIs

### Session-Based Authentication

Authenticate with FantasyPros using username/password and fetch rankings data.

```http
POST /api/fantasy-pros-session
```

**Request Body:**
```typescript
interface SessionRequest {
  username: string;
  password: string;
  position?: string;
  week?: number;
  scoringFormat?: 'standard' | 'ppr' | 'half-ppr';
}
```

**Example Request:**
```json
{
  "username": "your_username",
  "password": "your_password",
  "position": "RB",
  "scoringFormat": "ppr"
}
```

**Example Response (Single Position):**
```json
{
  "success": true,
  "players": [
    {
      "name": "Christian McCaffrey",
      "team": "SF",
      "position": "RB",
      "averageRank": 1.2,
      "standardDeviation": 0.8,
      "projectedPoints": 285.5
    }
  ],
  "position": "RB",
  "week": 1,
  "source": "fantasypros-session"
}
```

**Example Response (All Positions):**
```json
{
  "success": true,
  "allRankings": {
    "QB": [...],
    "RB": [...],
    "WR": [...],
    "TE": [...],
    "K": [...],
    "DST": [...]
  },
  "totalPlayers": 450,
  "week": 1,
  "source": "fantasypros-session"
}
```

### Free Rankings Access

Attempt to access public FantasyPros rankings without authentication.

```http
GET /api/fantasy-pros-free
```

**Query Parameters:**
- `position` (optional): Position to fetch
- `scoringFormat` (optional): Scoring format (`standard`, `ppr`, `half-ppr`)

**Example Request:**
```http
GET /api/fantasy-pros-free?position=RB&scoringFormat=ppr
```

**Example Response:**
```json
{
  "success": true,
  "players": [...],
  "position": "RB",
  "source": "fantasypros-free",
  "message": "Found 45 RB players from public rankings"
}
```

### API Key Authentication

Use FantasyPros API key for official API access (when available).

```http
GET /api/fantasy-pros
```

**Query Parameters:**
- `position`: Position to fetch
- `scoring`: Scoring format

**Request Headers:**
```http
Authorization: Bearer your_api_key
```

**Example Response:**
```json
{
  "success": true,
  "players": [...],
  "source": "fantasypros-api"
}
```

## 🛠️ Utility APIs

### Debug FantasyPros Structure

Analyze FantasyPros website structure for debugging authentication issues.

```http
GET /api/debug-fantasypros
```

**Example Response:**
```json
{
  "success": true,
  "loginPageLength": 45230,
  "hasCookies": true,
  "csrfPatternResults": [
    {
      "pattern": "csrf_token.*?value=[\"'](.*?)[\"']",
      "found": true,
      "token": "abc123token"
    }
  ],
  "tokenLikeStrings": ["csrf_token", "authenticity_token"],
  "inputFields": 2,
  "forms": 1
}
```

### Test Scraping

Test web scraping capabilities for a specific URL.

```http
GET /api/test-scrape
```

**Example Response:**
```json
{
  "success": true,
  "url": "https://www.fantasypros.com/nfl/rankings/rb-cheatsheets.php",
  "htmlLength": 125000,
  "hasContent": true,
  "hasJavaScript": true,
  "hasTable": true,
  "samplePlayers": [
    {
      "rank": 1,
      "name": "Christian McCaffrey",
      "team": "SF"
    }
  ]
}
```

### Data Format Testing

Test data parsing and format validation.

```http
POST /api/test-data-format
```

**Request Body:**
```json
{
  "data": "raw_data_string",
  "format": "csv|json|text"
}
```

**Example Response:**
```json
{
  "success": true,
  "parsedPlayers": [...],
  "validationErrors": [],
  "format": "csv"
}
```

## ❌ Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  note?: string;
  details?: any;
}
```

### Common Error Types

**1. Validation Errors (400)**
```json
{
  "success": false,
  "error": "Position parameter is required",
  "note": "Valid positions are: QB, RB, WR, TE, FLEX, K, DST"
}
```

**2. Authentication Errors (401)**
```json
{
  "success": false,
  "error": "Invalid FantasyPros credentials",
  "note": "Check your username and password"
}
```

**3. Server Errors (500)**
```json
{
  "success": false,
  "error": "Failed to fetch data from FantasyPros",
  "note": "FantasyPros may be temporarily unavailable"
}
```

### Error Handling Best Practices

**Client-Side Error Handling:**
```typescript
async function fetchPlayerData(position: string) {
  try {
    const response = await fetch(`/api/data-manager?position=${position}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }
    
    return data.players;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

## 🚦 Rate Limiting

### Current Limits

- **Development:** No rate limiting
- **Production:** 100 requests per minute per IP
- **FantasyPros APIs:** Respectful delays between requests

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "note": "Please wait before making more requests"
}
```

## 📝 Examples

### Complete Data Import Workflow

```typescript
// 1. Authenticate with FantasyPros
const authResponse = await fetch('/api/fantasy-pros-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'your_username',
    password: 'your_password',
    scoringFormat: 'ppr'
  })
});

// 2. Fetch all positions
const allDataResponse = await fetch('/api/fantasy-pros-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'your_username',
    password: 'your_password',
    scoringFormat: 'ppr'
    // No position = all positions
  })
});

// 3. Retrieve stored data
const storedDataResponse = await fetch(
  '/api/data-manager?dataset=fantasypros-session&scoringFormat=ppr'
);

// 4. Get specific position data
const rbDataResponse = await fetch(
  '/api/data-manager?position=RB&dataset=fantasypros-session&scoringFormat=ppr'
);
```

### CSV Data Import

```typescript
// Parse CSV and store
const csvData = `name,team,position,rank,projected_points
Christian McCaffrey,SF,RB,1,285.5
Derrick Henry,TEN,RB,2,275.0`;

const storeResponse = await fetch('/api/data-manager', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    position: 'RB',
    players: parsedCsvData,
    action: 'set',
    source: 'csv-import'
  })
});
```

### Data Comparison

```typescript
// Compare data across all datasets
const comparisonResponse = await fetch(
  '/api/data-manager?position=RB&compare=true'
);

const comparison = await comparisonResponse.json();
console.log(comparison.comparison);
// {
//   "current": { "players": [...], "count": 45 },
//   "fantasypros-session-ppr": { "players": [...], "count": 45 },
//   "free-ranking-ppr": { "players": [...], "count": 30 }
// }
```

## 🔧 SDK Usage

### TypeScript Client

```typescript
// lib/api-client.ts
class FantasyFootballAPI {
  private baseURL: string;
  
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
  }
  
  async getPlayerData(position: string, scoringFormat = 'ppr') {
    const response = await fetch(
      `${this.baseURL}/data-manager?position=${position}&dataset=fantasypros-session&scoringFormat=${scoringFormat}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
  
  async storePlayerData(position: string, players: Player[], scoringFormat = 'ppr') {
    const response = await fetch(`${this.baseURL}/data-manager`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        position,
        players,
        action: 'set',
        source: 'manual',
        scoringFormat
      })
    });
    
    return response.json();
  }
}

// Usage
const api = new FantasyFootballAPI();
const rbData = await api.getPlayerData('RB', 'ppr');
```

## 📚 Additional Resources

### Related Documentation
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development environment setup
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common API issues
- [FANTASY_FOOTBALL_SETUP.md](./FANTASY_FOOTBALL_SETUP.md) - Feature-specific setup

### External APIs
- [FantasyPros API Documentation](https://www.fantasypros.com/api/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

*This API documentation is automatically updated with each release. For the latest changes, see [CHANGELOG.md](./CHANGELOG.md).*