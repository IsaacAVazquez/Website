import { Player, Position } from '@/types';
import { getTierGroups } from '@/lib/tierGrouping';

export interface TierGroup {
  tierNumber: number;
  players: Player[];
  color: string;
  minRank: number;
  maxRank: number;
  avgRank: number;
}

export function generateTierGroups(players: Player[], position: Position): TierGroup[] {
  // Get tier assignments
  const tierData = getTierGroups(players, position);
  
  // Group players by tier
  const tierMap = new Map<number, Player[]>();
  players.forEach((player, index) => {
    const tier = tierData[index]?.tier || 1;
    if (!tierMap.has(tier)) {
      tierMap.set(tier, []);
    }
    tierMap.get(tier)!.push(player);
  });

  // Create tier groups with metadata
  const tierGroups: TierGroup[] = [];
  const tierColors = [
    '#FF073A', // Red - Tier 1
    '#FF851B', // Orange - Tier 2
    '#FFD700', // Gold - Tier 3
    '#2ECC71', // Green - Tier 4
    '#00D9FF', // Cyan - Tier 5
    '#0074D9', // Blue - Tier 6
    '#B10DC9', // Purple - Tier 7
    '#85144b', // Maroon - Tier 8
    '#F012BE', // Magenta - Tier 9
    '#01FF70', // Lime - Tier 10
    '#7FDBFF', // Light Blue - Tier 11
    '#FFDC00', // Yellow - Tier 12
  ];

  tierMap.forEach((tierPlayers, tierNumber) => {
    const ranks = tierPlayers.map(p => p.rank_ecr);
    tierGroups.push({
      tierNumber,
      players: tierPlayers.sort((a, b) => a.rank_ecr - b.rank_ecr),
      color: tierColors[tierNumber - 1] || '#666666',
      minRank: Math.min(...ranks),
      maxRank: Math.max(...ranks),
      avgRank: ranks.reduce((a, b) => a + b, 0) / ranks.length
    });
  });

  return tierGroups.sort((a, b) => a.tierNumber - b.tierNumber);
}

export function formatTierGroupForDisplay(tierGroup: TierGroup, includeTeam: boolean = true): string[] {
  return tierGroup.players.map(player => {
    const name = player.player_name;
    const team = includeTeam && player.player_team_id ? ` (${player.player_team_id})` : '';
    const rank = `#${Math.round(player.rank_ecr)}`;
    return `${rank} ${name}${team}`;
  });
}