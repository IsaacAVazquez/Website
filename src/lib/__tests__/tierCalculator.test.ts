import { calculateTiers } from '../tierCalculator'
import { Player } from '@/types'

describe('tierCalculator', () => {
  const mockPlayers: Player[] = [
    {
      player_name: 'Player 1',
      position: 'RB',
      team: 'KC',
      rank_ecr: 1,
      rank_min: 1,
      rank_max: 2,
      rank_ave: 1.2,
      rank_std: 0.3,
      averageRank: 1,
    },
    {
      player_name: 'Player 2',
      position: 'RB',
      team: 'SF',
      rank_ecr: 2,
      rank_min: 2,
      rank_max: 3,
      rank_ave: 2.3,
      rank_std: 0.4,
      averageRank: 2,
    },
    {
      player_name: 'Player 3',
      position: 'WR',
      team: 'BUF',
      rank_ecr: 3,
      rank_min: 3,
      rank_max: 5,
      rank_ave: 3.5,
      rank_std: 0.8,
      averageRank: 3,
    },
    {
      player_name: 'Player 4',
      position: 'WR',
      team: 'MIA',
      rank_ecr: 4,
      rank_min: 4,
      rank_max: 6,
      rank_ave: 4.8,
      rank_std: 0.9,
      averageRank: 4,
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
        player_name: `Player ${i + 1}`,
        position: 'RB',
        team: 'TST',
        rank_ecr: i + 1,
        rank_min: i + 1,
        rank_max: i + 2,
        rank_ave: i + 1.5,
        rank_std: 0.5,
        averageRank: i + 1,
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

    it('handles players with missing averageRank', () => {
      const playersWithMissingRank: Player[] = [
        { ...mockPlayers[0], averageRank: undefined },
        { ...mockPlayers[1], averageRank: 2 },
      ]

      const result = calculateTiers(playersWithMissingRank, 'ppr')
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
