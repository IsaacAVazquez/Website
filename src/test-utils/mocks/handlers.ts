import { http, HttpResponse } from 'msw'

// Mock player data for testing
const mockPlayerData = [
  {
    player_name: 'Patrick Mahomes',
    position: 'QB',
    team: 'KC',
    rank_ecr: 1,
    rank_min: 1,
    rank_max: 3,
    rank_ave: 1.5,
    rank_std: 0.5,
    tier: 1,
  },
  {
    player_name: 'Christian McCaffrey',
    position: 'RB',
    team: 'SF',
    rank_ecr: 1,
    rank_min: 1,
    rank_max: 2,
    rank_ave: 1.2,
    rank_std: 0.3,
    tier: 1,
  },
]

// Define request handlers
export const handlers = [
  // Fantasy data endpoint
  http.get('/api/fantasy-football/fantasy-data', () => {
    return HttpResponse.json({
      success: true,
      data: mockPlayerData,
      lastUpdated: new Date().toISOString(),
    })
  }),

  // Fantasy Pros endpoint
  http.get('/api/fantasy-football/fantasy-pros', () => {
    return HttpResponse.json({
      success: true,
      data: mockPlayerData,
      source: 'FantasyPros',
    })
  }),

  // Analytics endpoints
  http.post('/api/analytics/events', () => {
    return HttpResponse.json({ success: true })
  }),

  http.post('/api/analytics/web-vitals', () => {
    return HttpResponse.json({ success: true })
  }),

  // Newsletter subscription
  http.post('/api/newsletter/subscribe', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      success: true,
      email: body.email,
    })
  }),
]
