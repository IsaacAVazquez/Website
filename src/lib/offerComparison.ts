import { boundedNumber, enumValue, isRecord } from "@/lib/utils";

/**
 * Offer comparison. A pure, pre-tax model of what each job offer pays in each
 * of the four years a standard equity grant takes to vest: base with an annual
 * raise, target bonus, the grant's vesting share, a signing bonus in year one,
 * and the employer's retirement match.
 */

export const OFFER_YEARS = 4;
export const MIN_OFFERS = 2;
export const MAX_OFFERS = 3;
/** Within this share of the leader's four-year total, the offers read as a wash. */
export const CLOSE_SHARE = 0.02;

export const VESTING_SCHEDULES = {
  even: { label: "25/25/25/25", shares: [0.25, 0.25, 0.25, 0.25] },
  backLoaded: { label: "5/15/40/40", shares: [0.05, 0.15, 0.4, 0.4] },
  frontLoaded: { label: "33/33/22/12", shares: [0.33, 0.33, 0.22, 0.12] },
} as const;

export type VestingSchedule = keyof typeof VESTING_SCHEDULES;
const SCHEDULE_IDS = Object.keys(VESTING_SCHEDULES) as VestingSchedule[];

export interface Offer {
  name: string;
  baseSalary: number;
  /** Target annual bonus as a percent of base. */
  bonusPercent: number;
  /** One-time cash paid in year one. */
  signingBonus: number;
  /** The grant's value on the day it is granted, across the whole vest. */
  equityGrant: number;
  vesting: VestingSchedule;
  /** Assumed yearly change in the grant's share price. */
  equityGrowthPercent: number;
  /** Employer retirement match as a percent of base. */
  matchPercent: number;
  /** Yearly raise to base. */
  raisePercent: number;
}

type NumericField = {
  [K in keyof Offer]: Offer[K] extends number ? K : never;
}[keyof Offer];

export const OFFER_BOUNDS: Record<NumericField, { min: number; max: number }> = {
  baseSalary: { min: 0, max: 5_000_000 },
  bonusPercent: { min: 0, max: 200 },
  signingBonus: { min: 0, max: 5_000_000 },
  equityGrant: { min: 0, max: 50_000_000 },
  equityGrowthPercent: { min: -50, max: 50 },
  matchPercent: { min: 0, max: 25 },
  raisePercent: { min: 0, max: 25 },
};

export const OFFER_NAME_MAX = 40;

export interface OfferYear {
  year: number;
  base: number;
  bonus: number;
  equity: number;
  signing: number;
  match: number;
  total: number;
}

export interface OfferResult {
  name: string;
  years: OfferYear[];
  /** Each component summed over the four years. */
  sums: Omit<OfferYear, "year">;
}

export interface OfferComparisonResult {
  offers: OfferResult[];
  /** Index of the offer that pays the most over four years. */
  leader: number;
  /** The leader's four-year margin over the next best offer. */
  lead: number;
  close: boolean;
  /** Index of the offer that pays the most in year one. */
  firstYearLeader: number;
  firstYearLead: number;
}

/** Example numbers, not drawn from any real offer. */
export function createDefaultOffers(): Offer[] {
  return [
    {
      name: "Offer A",
      baseSalary: 165_000,
      bonusPercent: 15,
      signingBonus: 30_000,
      equityGrant: 200_000,
      vesting: "backLoaded",
      equityGrowthPercent: 0,
      matchPercent: 4,
      raisePercent: 3,
    },
    {
      name: "Offer B",
      baseSalary: 155_000,
      bonusPercent: 10,
      signingBonus: 10_000,
      equityGrant: 240_000,
      vesting: "even",
      equityGrowthPercent: 0,
      matchPercent: 5,
      raisePercent: 3,
    },
  ];
}

export function createBlankOffer(index: number): Offer {
  return {
    name: `Offer ${String.fromCharCode(65 + index)}`,
    baseSalary: 150_000,
    bonusPercent: 10,
    signingBonus: 0,
    equityGrant: 0,
    vesting: "even",
    equityGrowthPercent: 0,
    matchPercent: 4,
    raisePercent: 3,
  };
}

function decodeOffer(value: unknown, index: number): Offer {
  const fallback = createBlankOffer(index);
  if (!isRecord(value)) return fallback;
  const num = (key: NumericField) =>
    boundedNumber(value[key], fallback[key], OFFER_BOUNDS[key].min, OFFER_BOUNDS[key].max);
  const name = typeof value.name === "string" ? value.name.slice(0, OFFER_NAME_MAX) : fallback.name;
  return {
    name,
    baseSalary: num("baseSalary"),
    bonusPercent: num("bonusPercent"),
    signingBonus: num("signingBonus"),
    equityGrant: num("equityGrant"),
    vesting: enumValue(value.vesting, SCHEDULE_IDS, fallback.vesting),
    equityGrowthPercent: num("equityGrowthPercent"),
    matchPercent: num("matchPercent"),
    raisePercent: num("raisePercent"),
  };
}

/** Repair a persisted list, keeping between two and three offers. */
export function decodeOffers(value: unknown): Offer[] {
  if (!Array.isArray(value) || value.length < MIN_OFFERS) return createDefaultOffers();
  return value.slice(0, MAX_OFFERS).map(decodeOffer);
}

/** An empty name prints as its letter, so a cleared field never leaves a blank column. */
export function offerLabel(offers: readonly Pick<Offer, "name">[], index: number): string {
  return offers[index].name.trim() || `Offer ${String.fromCharCode(65 + index)}`;
}

export function projectOffer(offer: Offer, label = offer.name): OfferResult {
  const shares = VESTING_SCHEDULES[offer.vesting].shares;
  const years = shares.map((share, i): OfferYear => {
    const year = i + 1;
    const base = offer.baseSalary * (1 + offer.raisePercent / 100) ** i;
    const bonus = base * (offer.bonusPercent / 100);
    const match = base * (offer.matchPercent / 100);
    // Priced mid-year, since a grant usually vests monthly or quarterly through the year.
    const equity = offer.equityGrant * share * (1 + offer.equityGrowthPercent / 100) ** (year - 0.5);
    const signing = year === 1 ? offer.signingBonus : 0;
    return { year, base, bonus, equity, signing, match, total: base + bonus + equity + signing + match };
  });
  const sum = (key: keyof Omit<OfferYear, "year">) => years.reduce((acc, y) => acc + y[key], 0);
  return {
    name: label,
    years,
    sums: {
      base: sum("base"),
      bonus: sum("bonus"),
      equity: sum("equity"),
      signing: sum("signing"),
      match: sum("match"),
      total: sum("total"),
    },
  };
}

/** The best index by `value`, and its margin over the next best. */
function rank(values: number[]) {
  const order = values.map((v, i) => [v, i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  return { index: order[0][1], lead: order[0][0] - order[1][0] };
}

export function compareOffers(offers: Offer[]): OfferComparisonResult {
  const results = offers.map((offer, i) => projectOffer(offer, offerLabel(offers, i)));
  const overall = rank(results.map((r) => r.sums.total));
  const firstYear = rank(results.map((r) => r.years[0].total));
  const leaderTotal = results[overall.index].sums.total;
  return {
    offers: results,
    leader: overall.index,
    lead: overall.lead,
    close: leaderTotal <= 0 || overall.lead <= leaderTotal * CLOSE_SHARE,
    firstYearLeader: firstYear.index,
    firstYearLead: firstYear.lead,
  };
}
