import { calculateTiers } from '../tierCalculator'
import { Player } from '@/types'

describe('tierCalculator', () => {
  const mockPlayers: Player[] = [
    {
      id: '1',
      name: 'Player 1',
      position: 'RB',
      team: 'KC',
      averageRank: 1,
      projectedPoints: 300,
      standardDeviation: 0.3,
      expertRanks: [1, 2],
      minRank: 1,
      maxRank: 2,
    },
    {
      id: '2',
      name: 'Player 2',
      position: 'RB',
      team: 'SF',
      averageRank: 2,
      projectedPoints: 280,
      standardDeviation: 0.4,
      expertRanks: [2, 3],
      minRank: 2,
      maxRank: 3,
    },
    {
      id: '3',
      name: 'Player 3',
      position: 'WR',
      team: 'BUF',
      averageRank: 3,
      projectedPoints: 250,
      standardDeviation: 0.8,
      expertRanks: [3, 5],
      minRank: 3,
      maxRank: 5,
    },
    {
      id: '4',
      name: 'Player 4',
      position: 'WR',
      team: 'MIA',
      averageRank: 4,
      projectedPoints: 230,
      standardDeviation: 0.9,
      expertRanks: [4, 6],
      minRank: 4,
      maxRank: 6,
    },
  ]

  describe('calculateTiers', () => {
    it('returns empty array for empty player list', () => {
      const result = calculateTiers([], 'ppr')
      expect(result).toEqual([])
    })

    it('creates tiers for valid player list', () => {
      const result = calculateTiers(mockPlayers, 'ppr')
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('tier')
      expect(result[0]).toHaveProperty('players')
      expect(result[0]).toHaveProperty('avgValue')
      expect(result[0]).toHaveProperty('minRank')
      expect(result[0]).toHaveProperty('maxRank')
    })

    it('sorts players by average rank', () => {
      const unsortedPlayers: Player[] = [
        { ...mockPlayers[0], averageRank: 5 },
        { ...mockPlayers[1], averageRank: 2 },
        { ...mockPlayers[2], averageRank: 1 },
      ]

      const result = calculateTiers(unsortedPlayers, 'ppr')
      const firstTier = result[0]

      // First tier should contain the lowest ranked player
      expect(firstTier.players[0].averageRank).toBe(1)
    })

    it('respects maxTiers parameter', () => {
      const manyPlayers: Player[] = Array.from({ length: 50 }, (_, i) => ({
        id: String(i + 1),
        name: `Player ${i + 1}`,
        position: 'RB' as const,
        team: 'TST',
        averageRank: i + 1,
        projectedPoints: 300 - i * 5,
        standardDeviation: 0.5,
        expertRanks: [i + 1, i + 2],
      }))

      const result = calculateTiers(manyPlayers, 'ppr', 5)
      expect(result.length).toBeLessThanOrEqual(5)
    })

    it('calculates tier stats correctly', () => {
      const result = calculateTiers(mockPlayers, 'ppr')

      result.forEach((tier) => {
        expect(tier.tier).toBeGreaterThan(0)
        expect(tier.avgValue).toBeGreaterThan(0)
        expect(tier.minRank).toBeLessThanOrEqual(tier.maxRank)
        expect(tier.players.length).toBeGreaterThan(0)
      })
    })

    it('handles different scoring formats', () => {
      const pprResult = calculateTiers(mockPlayers, 'ppr')
      const standardResult = calculateTiers(mockPlayers, 'standard')
      const halfPprResult = calculateTiers(mockPlayers, 'halfPPR')

      expect(pprResult).toBeDefined()
      expect(standardResult).toBeDefined()
      expect(halfPprResult).toBeDefined()
    })

    it('includes all players in tiers', () => {
      const result = calculateTiers(mockPlayers, 'ppr')
      const totalPlayersInTiers = result.reduce(
        (sum, tier) => sum + tier.players.length,
        0
      )
      expect(totalPlayersInTiers).toBe(mockPlayers.length)
    })

    it('assigns sequential tier numbers', () => {
      const result = calculateTiers(mockPlayers, 'ppr')
      result.forEach((tier, index) => {
        expect(tier.tier).toBe(index + 1)
      })
    })

    it('handles players with high averageRank gracefully', () => {
      const playersWithHighRank: Player[] = [
        { ...mockPlayers[0], averageRank: 999 },
        { ...mockPlayers[1], averageRank: 2 },
      ]

      const result = calculateTiers(playersWithHighRank, 'ppr')
      expect(result.length).toBeGreaterThan(0)
    })

    it('handles single player', () => {
      const result = calculateTiers([mockPlayers[0]], 'ppr')
      expect(result.length).toBe(1)
      expect(result[0].players.length).toBe(1)
      expect(result[0].tier).toBe(1)
    })

    it('calculates correct rank ranges', () => {
      const result = calculateTiers(mockPlayers, 'ppr')

      let expectedMinRank = 1
      result.forEach((tier) => {
        expect(tier.minRank).toBe(expectedMinRank)
        expectedMinRank = tier.maxRank + 1
      })
    })
  })
})
