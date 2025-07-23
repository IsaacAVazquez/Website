import { Player, TierGroup } from '@/types';

interface GaussianComponent {
  mean: number;
  variance: number;
  weight: number;
}

export class GaussianMixtureModel {
  private components: GaussianComponent[];
  private maxIterations: number;
  private tolerance: number;

  constructor(
    private k: number = 6, // number of tiers
    maxIterations: number = 100,
    tolerance: number = 1e-6
  ) {
    this.components = [];
    this.maxIterations = maxIterations;
    this.tolerance = tolerance;
  }

  // Fit the GMM to the player ranks
  fit(players: Player[]): void {
    const ranks = players.map(p => Number(p.averageRank));
    
    // Initialize components with k-means++ style initialization
    this.initializeComponents(ranks);
    
    let previousLogLikelihood = -Infinity;
    
    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      // E-step: Calculate responsibilities
      const responsibilities = this.expectationStep(ranks);
      
      // M-step: Update parameters
      this.maximizationStep(ranks, responsibilities);
      
      // Check convergence
      const logLikelihood = this.calculateLogLikelihood(ranks);
      if (Math.abs(logLikelihood - previousLogLikelihood) < this.tolerance) {
        break;
      }
      previousLogLikelihood = logLikelihood;
    }
  }

  // Predict tier assignments for players
  predict(players: Player[]): TierGroup[] {
    const ranks = players.map(p => Number(p.averageRank));
    const responsibilities = this.expectationStep(ranks);
    
    // Assign each player to the component with highest responsibility
    const assignments = responsibilities.map(resp => {
      let maxProb = -1;
      let bestComponent = 0;
      for (let k = 0; k < this.k; k++) {
        if (resp[k] > maxProb) {
          maxProb = resp[k];
          bestComponent = k;
        }
      }
      return bestComponent;
    });

    // Sort components by mean rank to ensure tier 1 is best
    const sortedIndices = this.components
      .map((c, i) => ({ mean: c.mean, index: i }))
      .sort((a, b) => a.mean - b.mean)
      .map(item => item.index);

    // Create tier mapping
    const tierMapping = new Map<number, number>();
    sortedIndices.forEach((oldIndex, newTier) => {
      tierMapping.set(oldIndex, newTier + 1);
    });

    // Group players by tier
    const tierGroups: Map<number, Player[]> = new Map();
    players.forEach((player, i) => {
      const tier = tierMapping.get(assignments[i]) || 1;
      player.tier = tier;
      
      if (!tierGroups.has(tier)) {
        tierGroups.set(tier, []);
      }
      tierGroups.get(tier)!.push(player);
    });

    // Convert to TierGroup array
    const tiers: TierGroup[] = [];
    const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'];
    
    Array.from(tierGroups.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([tier, players]) => {
        const ranks = players.map(p => Number(p.averageRank));
        tiers.push({
          tier,
          players: players.sort((a, b) => Number(a.averageRank) - Number(b.averageRank)),
          color: colors[tier - 1] || '#6B7280',
          minRank: Math.min(...ranks),
          maxRank: Math.max(...ranks),
          avgRank: ranks.reduce((a, b) => a + b, 0) / ranks.length
        });
      });

    return tiers;
  }

  private initializeComponents(ranks: number[]): void {
    // K-means++ style initialization
    const minRank = Math.min(...ranks);
    const maxRank = Math.max(...ranks);
    const range = maxRank - minRank;
    
    this.components = [];
    
    // Initialize means evenly across the rank range
    for (let i = 0; i < this.k; i++) {
      const mean = minRank + (range * (i + 0.5) / this.k);
      this.components.push({
        mean,
        variance: Math.pow(range / (this.k * 2), 2),
        weight: 1.0 / this.k
      });
    }
  }

  private expectationStep(ranks: number[]): number[][] {
    const n = ranks.length;
    const responsibilities: number[][] = Array(n).fill(null).map(() => Array(this.k).fill(0));
    
    for (let i = 0; i < n; i++) {
      const rank = ranks[i];
      let totalProb = 0;
      
      // Calculate probability for each component
      for (let k = 0; k < this.k; k++) {
        const prob = this.components[k].weight * this.gaussianPdf(rank, this.components[k]);
        responsibilities[i][k] = prob;
        totalProb += prob;
      }
      
      // Normalize
      if (totalProb > 0) {
        for (let k = 0; k < this.k; k++) {
          responsibilities[i][k] /= totalProb;
        }
      }
    }
    
    return responsibilities;
  }

  private maximizationStep(ranks: number[], responsibilities: number[][]): void {
    const n = ranks.length;
    
    for (let k = 0; k < this.k; k++) {
      let sumResp = 0;
      let sumRankResp = 0;
      
      // Calculate new weight and mean
      for (let i = 0; i < n; i++) {
        sumResp += responsibilities[i][k];
        sumRankResp += responsibilities[i][k] * ranks[i];
      }
      
      const newWeight = sumResp / n;
      const newMean = sumRankResp / sumResp;
      
      // Calculate new variance
      let sumVariance = 0;
      for (let i = 0; i < n; i++) {
        const diff = ranks[i] - newMean;
        sumVariance += responsibilities[i][k] * diff * diff;
      }
      const newVariance = Math.max(sumVariance / sumResp, 0.1); // Prevent zero variance
      
      this.components[k] = {
        weight: newWeight,
        mean: newMean,
        variance: newVariance
      };
    }
  }

  private calculateLogLikelihood(ranks: number[]): number {
    let logLikelihood = 0;
    
    for (const rank of ranks) {
      let prob = 0;
      for (const component of this.components) {
        prob += component.weight * this.gaussianPdf(rank, component);
      }
      logLikelihood += Math.log(Math.max(prob, 1e-10));
    }
    
    return logLikelihood;
  }

  private gaussianPdf(x: number, component: GaussianComponent): number {
    const { mean, variance } = component;
    const coefficient = 1 / Math.sqrt(2 * Math.PI * variance);
    const exponent = -Math.pow(x - mean, 2) / (2 * variance);
    return coefficient * Math.exp(exponent);
  }
}

// Wrapper function to match existing interface
export function clusterPlayersWithGMM(
  players: Player[],
  numberOfTiers: number = 6
): TierGroup[] {
  if (players.length === 0) return [];
  
  const gmm = new GaussianMixtureModel(numberOfTiers);
  gmm.fit(players);
  return gmm.predict(players);
}