import { Player } from "@/types";

export interface Tier {
  tier: number;
  players: Player[];
  avgValue: number;
  minRank: number;
  maxRank: number;
}

/**
 * Calculate tiers using a clustering algorithm based on player values
 * Similar to Boris Chen's approach using gaussian mixture models
 */
export function calculateTiers(
  players: Player[],
  scoringFormat: "standard" | "halfPPR" | "ppr",
  maxTiers: number = 10
): Tier[] {
  if (players.length === 0) return [];

  // Sort players by averageRank first
  const sortedPlayers = [...players].sort((a, b) => {
    const aRank = parseFloat(a.averageRank?.toString() || "999");
    const bRank = parseFloat(b.averageRank?.toString() || "999");
    return aRank - bRank;
  });

  // Get player values (using averageRank and calculated value)
  const playerValues = sortedPlayers.map((player, index) => ({
    player,
    rank: index + 1,
    value: getPlayerValue(player, scoringFormat, index + 1)
  }));

  // Calculate tier breaks using value drops
  const tierBreaks = findTierBreaks(playerValues, maxTiers);
  
  // Group players into tiers
  const tiers: Tier[] = [];
  let currentTier: Player[] = [];
  let tierNumber = 1;
  let tierStartIdx = 0;

  playerValues.forEach((pv, index) => {
    currentTier.push(pv.player);

    // Check if we should start a new tier
    if (tierBreaks.includes(index) || index === playerValues.length - 1) {
      // Calculate tier stats
      const tierValues = playerValues.slice(tierStartIdx, index + 1);
      const avgValue = tierValues.reduce((sum, tv) => sum + tv.value, 0) / tierValues.length;

      tiers.push({
        tier: tierNumber,
        players: [...currentTier],
        avgValue,
        minRank: tierStartIdx + 1,
        maxRank: index + 1
      });

      // Reset for next tier
      currentTier = [];
      tierNumber++;
      tierStartIdx = index + 1;
    }
  });

  return tiers;
}

/**
 * Calculate player value based on various factors
 */
function getPlayerValue(
  player: Player,
  scoringFormat: "standard" | "halfPPR" | "ppr",
  rank: number
): number {
  // Base value from inverse of rank and averageRank
  const avgRank = parseFloat(player.averageRank?.toString() || rank.toString());
  let value = 100 / Math.sqrt(avgRank);

  // Adjust by position scarcity
  const positionMultipliers: Record<string, number> = {
    QB: 0.8,  // Less scarce
    RB: 1.2,  // More scarce
    WR: 1.0,  // Baseline
    TE: 1.1,  // Somewhat scarce
    K: 0.5,   // Much less valuable
    DST: 0.6  // Less valuable
  };

  value *= positionMultipliers[player.position] || 1.0;

  // Adjust for scoring format
  if (player.position === "RB" && scoringFormat === "standard") {
    value *= 1.1; // RBs more valuable in standard
  } else if (player.position === "WR" && scoringFormat === "ppr") {
    value *= 1.1; // WRs more valuable in PPR
  }

  // Use player's projected points if available
  if (player.projectedPoints) {
    const pointsBonus = player.projectedPoints / 100;
    value += pointsBonus;
  }

  // Factor in standard deviation (less consistent = lower value)
  if (player.standardDeviation) {
    const consistencyFactor = 1 - (Number(player.standardDeviation) / 100);
    value *= Math.max(consistencyFactor, 0.5); // Don't penalize too heavily
  }

  return value;
}

/**
 * Find natural tier breaks based on value drops
 */
function findTierBreaks(
  playerValues: { player: Player; rank: number; value: number }[],
  maxTiers: number
): number[] {
  const breaks: number[] = [];
  
  // Calculate value drops between consecutive players
  const valueDrops: { index: number; drop: number }[] = [];
  
  for (let i = 1; i < playerValues.length; i++) {
    const drop = playerValues[i - 1].value - playerValues[i].value;
    valueDrops.push({ index: i - 1, drop });
  }

  // Sort by drop size and take the largest drops as tier breaks
  valueDrops.sort((a, b) => b.drop - a.drop);
  
  // Take top drops, but ensure reasonable tier sizes
  const minTierSize = Math.max(2, Math.floor(playerValues.length / (maxTiers * 2)));
  const selectedBreaks: number[] = [];
  
  for (const vd of valueDrops) {
    // Check if this break would create tiers that are too small
    let validBreak = true;
    
    for (const existingBreak of selectedBreaks) {
      if (Math.abs(vd.index - existingBreak) < minTierSize) {
        validBreak = false;
        break;
      }
    }
    
    if (validBreak) {
      selectedBreaks.push(vd.index);
      if (selectedBreaks.length >= maxTiers - 1) break;
    }
  }

  return selectedBreaks.sort((a, b) => a - b);
}

/**
 * Get tier colors for visualization
 */
export function getTierColor(tierNumber: number): string {
  const colors = [
    "#00F5FF", // Electric Blue - Tier 1
    "#39FF14", // Matrix Green - Tier 2
    "#BF00FF", // Neon Purple - Tier 3
    "#FFB800", // Warning Amber - Tier 4
    "#00FFBF", // Cyber Teal - Tier 5
    "#FF073A", // Error Red - Tier 6
    "#4B5563", // Slate 600 - Tier 7+
    "#374151", // Slate 700
    "#1F2937", // Slate 800
    "#111827", // Slate 900
  ];

  return colors[Math.min(tierNumber - 1, colors.length - 1)];
}

/**
 * Get tier label
 */
export function getTierLabel(tierNumber: number, totalTiers: number): string {
  if (tierNumber === 1) return "Elite";
  if (tierNumber === 2) return "Excellent";
  if (tierNumber === 3) return "Very Good";
  if (tierNumber === 4) return "Good";
  if (tierNumber === totalTiers) return "Late Round";
  if (tierNumber === totalTiers - 1) return "Deep";
  return `Tier ${tierNumber}`;
}