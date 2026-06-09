import type {
  Formula1ConstructorStanding,
  Formula1DriverStanding,
  Formula1RaceResultEntry,
  Formula1Snapshot,
} from "@/types/formula1";
import type {
  FantasyFormula1Asset,
  FantasyFormula1Lineup,
  FantasyFormula1LineupSummary,
  FantasyFormula1OptimizationCandidate,
} from "@/types/fantasyFormula1";

export const FANTASY_FORMULA1_BUDGET = 100;
export const FANTASY_FORMULA1_DRIVER_SLOTS = 5;
export const FANTASY_FORMULA1_CONSTRUCTOR_SLOTS = 2;
export const FANTASY_FORMULA1_STORAGE_VERSION = 1;

const MIN_DRIVER_PRICE = 5.5;
const MAX_DRIVER_PRICE = 30;
const MIN_CONSTRUCTOR_PRICE = 5;
const MAX_CONSTRUCTOR_PRICE = 31;

export const EMPTY_FANTASY_FORMULA1_LINEUP: FantasyFormula1Lineup = {
  driverIds: [],
  constructorIds: [],
  lockedAssetIds: [],
};

function roundToTenths(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getCompletedRaceCount(snapshot: Formula1Snapshot): number {
  return Math.max(snapshot.seasonMetrics.completedRaces, 1);
}

function getSprintMultiplier(snapshot: Formula1Snapshot): number {
  return snapshot.nextMeeting?.hasSprint ? 1.12 : 1;
}

function getShortName(name: string): string {
  const words = name
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (words.length <= 1) {
    return name;
  }

  return words.at(-1) ?? name;
}

function formatRiskReason(kind: "driver" | "constructor", delta: number, position: number | null): string {
  if (position === null) {
    return "Limited recent sample";
  }

  if (delta <= 0) {
    return kind === "driver" ? "No last-race points" : "No last-race team gain";
  }

  if (position > 14 && kind === "driver") {
    return "Back-half standings profile";
  }

  if (position > 7 && kind === "constructor") {
    return "Lower-table constructor profile";
  }

  return "Stable recent production";
}

function getRisk(kind: "driver" | "constructor", delta: number, position: number | null, fieldSize: number) {
  if (position === null || delta <= 0) {
    return "high" as const;
  }

  const normalizedPosition = position / Math.max(fieldSize, 1);
  if (normalizedPosition > 0.68 || delta < 4) {
    return "medium" as const;
  }

  return "low" as const;
}

function getLastPublishedClassification(snapshot: Formula1Snapshot): Formula1RaceResultEntry[] {
  return (
    snapshot.meetings
      .filter((meeting) => meeting.resultPublished && meeting.classification.length > 0)
      .at(-1)?.classification ?? []
  );
}

function buildDriverRows(snapshot: Formula1Snapshot): Formula1DriverStanding[] {
  if (snapshot.driverStandings.length > 0) {
    return snapshot.driverStandings;
  }

  return getLastPublishedClassification(snapshot)
    .filter((entry) => entry.position !== null)
    .map((entry, index) => ({
      position: entry.position ?? index + 1,
      previousPosition: null,
      driverNumber: entry.driverNumber,
      driverName: entry.driverName,
      broadcastName: entry.broadcastName,
      acronym: entry.acronym,
      teamName: entry.teamName ?? "Unknown team",
      teamColor: entry.teamColor,
      headshotUrl: entry.headshotUrl,
      points: entry.points,
      pointsBeforeRace: 0,
      pointsDelta: entry.points,
    }));
}

function buildConstructorRows(snapshot: Formula1Snapshot): Formula1ConstructorStanding[] {
  if (snapshot.constructorStandings.length > 0) {
    return snapshot.constructorStandings;
  }

  const teamPoints = new Map<string, Formula1ConstructorStanding>();
  for (const entry of getLastPublishedClassification(snapshot)) {
    if (!entry.teamName) {
      continue;
    }

    const current = teamPoints.get(entry.teamName) ?? {
      position: 0,
      previousPosition: null,
      teamName: entry.teamName,
      teamColor: entry.teamColor,
      points: 0,
      pointsBeforeRace: 0,
      pointsDelta: 0,
    };

    current.points += entry.points;
    current.pointsDelta += entry.points;
    teamPoints.set(entry.teamName, current);
  }

  return Array.from(teamPoints.values())
    .sort((left, right) => right.points - left.points || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, position: index + 1 }));
}

function buildDriverAsset(
  standing: Formula1DriverStanding,
  index: number,
  snapshot: Formula1Snapshot,
  fieldSize: number
): FantasyFormula1Asset {
  const completedRaces = getCompletedRaceCount(snapshot);
  const rankStrength = (fieldSize - standing.position + 1) / Math.max(fieldSize, 1);
  const pointsPerRace = standing.points / completedRaces;
  const formScore = Math.max(standing.pointsDelta, 0) + pointsPerRace * 0.45;
  const sprintMultiplier = getSprintMultiplier(snapshot);
  const projectedPoints = roundToTenths(
    (4 + rankStrength * 10 + pointsPerRace * 0.68 + Math.max(standing.pointsDelta, 0) * 0.22) *
      sprintMultiplier
  );
  const price = roundToTenths(
    clamp(
      6 + rankStrength * 17 + pointsPerRace * 0.12 + Math.max(standing.pointsDelta, 0) * 0.04,
      MIN_DRIVER_PRICE,
      MAX_DRIVER_PRICE
    )
  );

  return {
    id: `driver-${standing.driverNumber}`,
    kind: "driver",
    name: standing.driverName,
    shortName: standing.acronym ?? getShortName(standing.driverName),
    teamName: standing.teamName,
    teamColor: standing.teamColor,
    headshotUrl: standing.headshotUrl,
    standingPosition: Number.isFinite(standing.position) ? standing.position : index + 1,
    seasonPoints: roundToTenths(standing.points),
    lastRacePoints: roundToTenths(standing.pointsDelta),
    price,
    projectedPoints,
    valueRating: roundToTenths((projectedPoints / Math.max(price, 0.1)) * 10),
    formScore: roundToTenths(formScore),
    risk: getRisk("driver", standing.pointsDelta, standing.position, fieldSize),
    riskReason: formatRiskReason("driver", standing.pointsDelta, standing.position),
  };
}

function buildConstructorAsset(
  standing: Formula1ConstructorStanding,
  index: number,
  snapshot: Formula1Snapshot,
  fieldSize: number
): FantasyFormula1Asset {
  const completedRaces = getCompletedRaceCount(snapshot);
  const rankStrength = (fieldSize - standing.position + 1) / Math.max(fieldSize, 1);
  const pointsPerRace = standing.points / completedRaces;
  const formScore = Math.max(standing.pointsDelta, 0) + pointsPerRace * 0.28;
  const sprintMultiplier = getSprintMultiplier(snapshot);
  const projectedPoints = roundToTenths(
    (6 + rankStrength * 12 + pointsPerRace * 0.42 + Math.max(standing.pointsDelta, 0) * 0.16) *
      sprintMultiplier
  );
  const price = roundToTenths(
    clamp(
      5.8 + rankStrength * 18 + pointsPerRace * 0.05 + Math.max(standing.pointsDelta, 0) * 0.025,
      MIN_CONSTRUCTOR_PRICE,
      MAX_CONSTRUCTOR_PRICE
    )
  );

  return {
    id: `constructor-${standing.teamName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    kind: "constructor",
    name: standing.teamName,
    shortName: standing.teamName,
    teamName: standing.teamName,
    teamColor: standing.teamColor,
    headshotUrl: null,
    standingPosition: Number.isFinite(standing.position) ? standing.position : index + 1,
    seasonPoints: roundToTenths(standing.points),
    lastRacePoints: roundToTenths(standing.pointsDelta),
    price,
    projectedPoints,
    valueRating: roundToTenths((projectedPoints / Math.max(price, 0.1)) * 10),
    formScore: roundToTenths(formScore),
    risk: getRisk("constructor", standing.pointsDelta, standing.position, fieldSize),
    riskReason: formatRiskReason("constructor", standing.pointsDelta, standing.position),
  };
}

export function buildFantasyFormula1Assets(snapshot: Formula1Snapshot): FantasyFormula1Asset[] {
  const driverRows = buildDriverRows(snapshot);
  const constructorRows = buildConstructorRows(snapshot);
  const driverAssets = driverRows.map((standing, index) =>
    buildDriverAsset(standing, index, snapshot, driverRows.length)
  );
  const constructorAssets = constructorRows.map((standing, index) =>
    buildConstructorAsset(standing, index, snapshot, constructorRows.length)
  );

  return [...driverAssets, ...constructorAssets];
}

export function getFantasyFormula1StorageKey(season: number): string {
  return `fantasy-formula-1-lineup-v${FANTASY_FORMULA1_STORAGE_VERSION}-${season}`;
}

export function getFantasyFormula1AssetMap(
  assets: FantasyFormula1Asset[]
): Map<string, FantasyFormula1Asset> {
  return new Map(assets.map((asset) => [asset.id, asset]));
}

export function summarizeFantasyFormula1Lineup(
  assets: FantasyFormula1Asset[],
  lineup: FantasyFormula1Lineup
): FantasyFormula1LineupSummary {
  const assetMap = getFantasyFormula1AssetMap(assets);
  const drivers = lineup.driverIds
    .map((id) => assetMap.get(id))
    .filter((asset): asset is FantasyFormula1Asset => asset?.kind === "driver");
  const constructors = lineup.constructorIds
    .map((id) => assetMap.get(id))
    .filter((asset): asset is FantasyFormula1Asset => asset?.kind === "constructor");
  const selectedAssets = [...drivers, ...constructors];
  const totalPrice = roundToTenths(
    selectedAssets.reduce((total, asset) => total + asset.price, 0)
  );
  const projectedPoints = roundToTenths(
    selectedAssets.reduce((total, asset) => total + asset.projectedPoints, 0)
  );

  return {
    drivers,
    constructors,
    assets: selectedAssets,
    totalPrice,
    projectedPoints,
    valueRating: totalPrice > 0 ? roundToTenths((projectedPoints / totalPrice) * 10) : 0,
    budgetRemaining: roundToTenths(FANTASY_FORMULA1_BUDGET - totalPrice),
    isComplete:
      drivers.length === FANTASY_FORMULA1_DRIVER_SLOTS &&
      constructors.length === FANTASY_FORMULA1_CONSTRUCTOR_SLOTS,
    isOverBudget: totalPrice > FANTASY_FORMULA1_BUDGET,
  };
}

function getCombinations<T>(items: T[], size: number): T[][] {
  if (size === 0) {
    return [[]];
  }

  if (items.length < size) {
    return [];
  }

  const result: T[][] = [];

  function visit(startIndex: number, combination: T[]) {
    if (combination.length === size) {
      result.push([...combination]);
      return;
    }

    const remainingSlots = size - combination.length;
    for (let index = startIndex; index <= items.length - remainingSlots; index += 1) {
      combination.push(items[index]);
      visit(index + 1, combination);
      combination.pop();
    }
  }

  visit(0, []);
  return result;
}

function scoreAssetForOptimization(asset: FantasyFormula1Asset): number {
  return asset.projectedPoints + asset.valueRating * 0.18 + asset.formScore * 0.08;
}

interface AssetCombination {
  assets: FantasyFormula1Asset[];
  price: number;
  projectedPoints: number;
}

function summarizeCombination(assets: FantasyFormula1Asset[]): AssetCombination {
  return {
    assets,
    price: assets.reduce((total, asset) => total + asset.price, 0),
    projectedPoints: assets.reduce((total, asset) => total + asset.projectedPoints, 0),
  };
}

function getCandidatePool(
  assets: FantasyFormula1Asset[],
  kind: "driver" | "constructor",
  lockedAssetIds: Set<string>
): FantasyFormula1Asset[] {
  const lockedAssets = assets.filter((asset) => asset.kind === kind && lockedAssetIds.has(asset.id));
  const unlockedAssets = assets
    .filter((asset) => asset.kind === kind && !lockedAssetIds.has(asset.id))
    .sort((left, right) => scoreAssetForOptimization(right) - scoreAssetForOptimization(left));
  const poolLimit = kind === "driver" ? 24 : 12;

  return [...lockedAssets, ...unlockedAssets.slice(0, poolLimit)];
}

export function optimizeFantasyFormula1Lineups(
  assets: FantasyFormula1Asset[],
  lockedAssetIds: Iterable<string> = [],
  maxResults = 5
): FantasyFormula1OptimizationCandidate[] {
  const lockedIds = new Set(lockedAssetIds);
  const lockedDrivers = assets.filter((asset) => asset.kind === "driver" && lockedIds.has(asset.id));
  const lockedConstructors = assets.filter(
    (asset) => asset.kind === "constructor" && lockedIds.has(asset.id)
  );

  if (
    lockedDrivers.length > FANTASY_FORMULA1_DRIVER_SLOTS ||
    lockedConstructors.length > FANTASY_FORMULA1_CONSTRUCTOR_SLOTS
  ) {
    return [];
  }

  const lockedPrice = [...lockedDrivers, ...lockedConstructors].reduce(
    (total, asset) => total + asset.price,
    0
  );
  if (lockedPrice > FANTASY_FORMULA1_BUDGET) {
    return [];
  }

  const driverPool = getCandidatePool(assets, "driver", lockedIds);
  const constructorPool = getCandidatePool(assets, "constructor", lockedIds);
  const remainingDriverSlots = FANTASY_FORMULA1_DRIVER_SLOTS - lockedDrivers.length;
  const remainingConstructorSlots =
    FANTASY_FORMULA1_CONSTRUCTOR_SLOTS - lockedConstructors.length;
  const availableDrivers = driverPool.filter((asset) => !lockedIds.has(asset.id));
  const availableConstructors = constructorPool.filter((asset) => !lockedIds.has(asset.id));

  if (
    availableDrivers.length < remainingDriverSlots ||
    availableConstructors.length < remainingConstructorSlots
  ) {
    return [];
  }

  const driverCombinations = getCombinations(availableDrivers, remainingDriverSlots)
    .map((combo) => summarizeCombination([...lockedDrivers, ...combo]))
    .filter((combo) => combo.price <= FANTASY_FORMULA1_BUDGET)
    .sort((left, right) => right.projectedPoints - left.projectedPoints);
  const constructorCombinations = getCombinations(
    availableConstructors,
    remainingConstructorSlots
  )
    .map((combo) => summarizeCombination([...lockedConstructors, ...combo]))
    .filter((combo) => combo.price <= FANTASY_FORMULA1_BUDGET)
    .sort((left, right) => right.projectedPoints - left.projectedPoints);

  const limit = Math.max(0, maxResults);
  if (limit === 0 || constructorCombinations.length === 0) {
    return [];
  }

  // The unlocked cross product is ~26k driver combos × 55 constructor pairs
  // (~1.4M lineups) and runs on the render path. Both lists are sorted by
  // projected points, so a small sorted top-k plus early breaks visits only a
  // sliver of it while returning exactly what the full sort-and-slice did.
  const top: FantasyFormula1OptimizationCandidate[] = [];
  const bestConstructorPoints = constructorCombinations[0].projectedPoints;

  for (const drivers of driverCombinations) {
    if (
      top.length === limit &&
      roundToTenths(drivers.projectedPoints + bestConstructorPoints) <
        top[top.length - 1].projectedPoints
    ) {
      // Even the best constructor pairing can't beat the current kth-best
      // lineup, and every later driver combination scores lower still.
      break;
    }
    for (const constructors of constructorCombinations) {
      const projectedPoints = roundToTenths(
        drivers.projectedPoints + constructors.projectedPoints
      );
      if (top.length === limit && projectedPoints < top[top.length - 1].projectedPoints) {
        break;
      }
      const totalPrice = roundToTenths(drivers.price + constructors.price);
      if (totalPrice > FANTASY_FORMULA1_BUDGET) {
        continue;
      }

      insertTopCandidate(
        top,
        {
          drivers: drivers.assets,
          constructors: constructors.assets,
          assets: [...drivers.assets, ...constructors.assets],
          totalPrice,
          projectedPoints,
          valueRating: totalPrice > 0 ? roundToTenths((projectedPoints / totalPrice) * 10) : 0,
          budgetRemaining: roundToTenths(FANTASY_FORMULA1_BUDGET - totalPrice),
          isComplete: true,
          isOverBudget: false,
          rank: 0,
        },
        limit
      );
    }
  }

  return top.map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}

function compareCandidates(
  left: FantasyFormula1OptimizationCandidate,
  right: FantasyFormula1OptimizationCandidate
): number {
  return (
    right.projectedPoints - left.projectedPoints ||
    right.valueRating - left.valueRating ||
    left.budgetRemaining - right.budgetRemaining
  );
}

/**
 * Keeps `top` sorted best-first and at most `limit` long. Equal candidates
 * insert after existing ones, matching the stable sort the full enumeration
 * used to rely on.
 */
function insertTopCandidate(
  top: FantasyFormula1OptimizationCandidate[],
  candidate: FantasyFormula1OptimizationCandidate,
  limit: number
): void {
  let index = top.length;
  while (index > 0 && compareCandidates(candidate, top[index - 1]) < 0) {
    index -= 1;
  }
  if (index === top.length && top.length >= limit) return;
  top.splice(index, 0, candidate);
  if (top.length > limit) top.pop();
}

export function sanitizeFantasyFormula1Lineup(
  lineup: FantasyFormula1Lineup,
  assets: FantasyFormula1Asset[]
): FantasyFormula1Lineup {
  const assetMap = getFantasyFormula1AssetMap(assets);
  // Dedupe persisted ids: a tampered or corrupt payload with the same driver
  // twice would otherwise count as a "complete" lineup with double-counted
  // price and projection.
  const driverIds = Array.from(new Set(lineup.driverIds))
    .filter((id) => assetMap.get(id)?.kind === "driver")
    .slice(0, FANTASY_FORMULA1_DRIVER_SLOTS);
  const constructorIds = Array.from(new Set(lineup.constructorIds))
    .filter((id) => assetMap.get(id)?.kind === "constructor")
    .slice(0, FANTASY_FORMULA1_CONSTRUCTOR_SLOTS);
  const selectedIds = new Set([...driverIds, ...constructorIds]);
  const lockedAssetIds = lineup.lockedAssetIds.filter((id) => selectedIds.has(id));

  return {
    driverIds,
    constructorIds,
    lockedAssetIds,
  };
}
