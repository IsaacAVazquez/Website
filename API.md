# API Documentation

This document provides comprehensive documentation for all API endpoints in the Isaac Vazquez Portfolio project.

## 📋 Table of Contents

- [Overview](#overview)
- [Contact Form API](#contact-form-api)
- [Analytics API](#analytics-api)
- [Content API](#content-api)
- [Error Handling](#error-handling)
- [Examples](#examples)

## 🌐 Overview

The Portfolio API is built using Next.js App Router API routes with TypeScript. All endpoints return JSON responses and follow RESTful conventions.

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
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## 📧 Contact Form API

### Submit Contact Form

Handle contact form submissions from the portfolio website.

```http
POST /api/contact
```

**Request Body:**
```typescript
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}
```

**Example Request:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "subject": "Project Collaboration",
  "message": "I'd like to discuss a potential project collaboration..."
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "msg_123456",
    "timestamp": "2025-01-16T10:30:00Z"
  }
}
```

**Validation Rules:**
- `name`: Required, 2-100 characters
- `email`: Required, valid email format
- `subject`: Required, 5-200 characters
- `message`: Required, 10-2000 characters

### Get Contact Status

Check the status of a contact form submission.

```http
GET /api/contact/status?id={messageId}
```

**Query Parameters:**
- `id`: Message ID returned from form submission

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "msg_123456",
    "status": "delivered",
    "timestamp": "2025-01-16T10:30:00Z"
  }
}
```

## 📊 Analytics API

### Track Events

Track user interactions and portfolio engagement.

```http
POST /api/analytics/events
```

**Request Body:**
```typescript
interface AnalyticsEvent {
  event: string;
  category: string;
  label?: string;
  value?: number;
  userId?: string;
  metadata?: Record<string, any>;
}
```

**Example Request:**
```json
{
  "event": "project_view",
  "category": "portfolio",
  "label": "cyberpunk-dashboard",
  "metadata": {
    "source": "projects_page",
    "device": "desktop"
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Event tracked successfully",
  "data": {
    "eventId": "evt_789012",
    "timestamp": "2025-01-16T10:35:00Z"
  }
}
```

### Web Vitals Tracking

Track Core Web Vitals and performance metrics.

```http
POST /api/analytics/web-vitals
```

**Request Body:**
```typescript
interface WebVitalMetric {
  name: 'CLS' | 'FCP' | 'LCP' | 'FID' | 'TTFB';
  value: number;
  id: string;
  delta: number;
  url: string;
  userAgent?: string;
}
```

**Example Request:**
```json
{
  "name": "LCP",
  "value": 1250,
  "id": "v2-1642123456789-1234567890",
  "delta": 1250,
  "url": "https://isaacavazquez.com/",
  "userAgent": "Mozilla/5.0..."
}
```

### Get Analytics Dashboard

Retrieve analytics data for the portfolio dashboard.

```http
GET /api/analytics/dashboard
```

**Query Parameters:**
- `period`: Time period (`7d`, `30d`, `90d`, `1y`)
- `metrics`: Comma-separated list of metrics to include

**Example Response:**
```json
{
  "success": true,
  "data": {
    "pageViews": {
      "total": 1247,
      "change": 12.5
    },
    "uniqueVisitors": {
      "total": 892,
      "change": 8.3
    },
    "topPages": [
      { "path": "/", "views": 456 },
      { "path": "/projects", "views": 321 },
      { "path": "/about", "views": 234 }
    ],
    "webVitals": {
      "LCP": { "value": 1.2, "grade": "good" },
      "FID": { "value": 85, "grade": "good" },
      "CLS": { "value": 0.08, "grade": "good" }
    }
  }
}
```

## 📄 Content API

### Get Projects

Retrieve portfolio project data.

```http
GET /api/projects
```

**Query Parameters:**
- `featured`: Return only featured projects (`true`/`false`)
- `technology`: Filter by technology (e.g., `React`, `TypeScript`)
- `limit`: Number of projects to return

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cyberpunk-dashboard",
      "title": "Cyberpunk Portfolio Dashboard",
      "description": "A modern portfolio website with cyberpunk aesthetics",
      "technologies": ["Next.js", "TypeScript", "Tailwind CSS"],
      "featured": true,
      "image": "/images/projects/dashboard.webp",
      "liveUrl": "https://isaacavazquez.com",
      "githubUrl": "https://github.com/IsaacAVazquez/portfolio"
    }
  ]
}
```

### Get Resume Data

Retrieve structured resume information.

```http
GET /api/resume
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "experience": [
      {
        "company": "Tech Company",
        "position": "Senior QA Engineer",
        "startDate": "2022-01",
        "endDate": "present",
        "description": "Lead QA initiatives and automation strategies..."
      }
    ],
    "skills": [
      {
        "category": "Testing",
        "items": ["Selenium", "Jest", "Cypress", "Playwright"]
      },
      {
        "category": "Development",
        "items": ["JavaScript", "TypeScript", "React", "Node.js"]
      }
    ],
    "education": [
      {
        "institution": "University Name",
        "degree": "Bachelor of Computer Science",
        "year": "2020"
      }
    ]
  }
}
```

### Search Content

Search across portfolio content (projects, blog posts, etc.).

```http
GET /api/search
```

**Query Parameters:**
- `q`: Search query
- `type`: Content type filter (`projects`, `blog`, `all`)
- `limit`: Number of results to return

**Example Request:**
```http
GET /api/search?q=react&type=projects&limit=5
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "project",
        "title": "React Dashboard",
        "description": "Modern React-based dashboard...",
        "url": "/projects/react-dashboard",
        "relevance": 0.95
      }
    ],
    "total": 3,
    "query": "react"
  }
}
```

## ❌ Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
}
```

### Common Error Types

**1. Validation Errors (400)**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "name": "Name is required",
    "email": "Invalid email format"
  }
}
```

**2. Not Found (404)**
```json
{
  "success": false,
  "error": "Resource not found"
}
```

**3. Rate Limit (429)**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Please wait before making more requests"
}
```

**4. Server Errors (500)**
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

### Error Handling Best Practices

**Client-Side Error Handling:**
```typescript
async function submitContactForm(formData: ContactFormData) {
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

## 📝 Examples

### Contact Form Integration

```typescript
// Contact form submission with validation
async function handleContactSubmit(formData: ContactFormData) {
  // Client-side validation
  const errors = validateContactForm(formData);
  if (Object.keys(errors).length > 0) {
    throw new Error('Please fix form errors');
  }
  
  // Submit to API
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.data;
}
```

### Analytics Event Tracking

```typescript
// Track user interactions
class AnalyticsService {
  static async trackEvent(event: string, category: string, label?: string) {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          category,
          label,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }
  
  static async trackPageView(path: string) {
    await this.trackEvent('page_view', 'navigation', path);
  }
  
  static async trackProjectView(projectId: string) {
    await this.trackEvent('project_view', 'portfolio', projectId);
  }
}

// Usage in components
AnalyticsService.trackProjectView('cyberpunk-dashboard');
```

### Content Fetching

```typescript
// Fetch and cache project data
class ContentService {
  private static cache = new Map();
  
  static async getProjects(featured = false) {
    const cacheKey = `projects-${featured}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const response = await fetch(`/api/projects?featured=${featured}`);
    const data = await response.json();
    
    if (data.success) {
      this.cache.set(cacheKey, data.data);
      return data.data;
    }
    
    throw new Error(data.error);
  }
  
  static async searchContent(query: string, type = 'all') {
    const response = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=${type}`
    );
    
    const data = await response.json();
    return data.success ? data.data : null;
  }
}
```

### Web Vitals Monitoring

```typescript
// Track Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
      url: window.location.href
    })
  }).catch(console.warn);
}

// Track all Core Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## 🔧 TypeScript SDK

### API Client

```typescript
// lib/api-client.ts
export class PortfolioAPI {
  private baseURL: string;
  
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
  }
  
  // Contact form methods
  async submitContact(data: ContactFormData) {
    return this.post('/contact', data);
  }
  
  async getContactStatus(id: string) {
    return this.get(`/contact/status?id=${id}`);
  }
  
  // Analytics methods
  async trackEvent(event: AnalyticsEvent) {
    return this.post('/analytics/events', event);
  }
  
  async getAnalytics(period = '30d') {
    return this.get(`/analytics/dashboard?period=${period}`);
  }
  
  // Content methods
  async getProjects(featured?: boolean) {
    const params = featured ? '?featured=true' : '';
    return this.get(`/projects${params}`);
  }
  
  async getResume() {
    return this.get('/resume');
  }
  
  async search(query: string, type = 'all') {
    return this.get(`/search?q=${encodeURIComponent(query)}&type=${type}`);
  }
  
  // Private helper methods
  private async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }
  
  private async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
  
  private async request(endpoint: string, options: RequestInit) {
    const response = await fetch(`${this.baseURL}${endpoint}`, options);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  }
}

// Usage
const api = new PortfolioAPI();
const projects = await api.getProjects(true); // Get featured projects
```

## 📚 Additional Resources

### Related Documentation
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development environment setup
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common API issues
- [PERFORMANCE.md](./PERFORMANCE.md) - API performance optimization

### External References
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Web Vitals Library](https://github.com/GoogleChrome/web-vitals)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

*This API documentation reflects the portfolio-focused architecture of v2.0. For the latest changes, see [CHANGELOG.md](./CHANGELOG.md).*