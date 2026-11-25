import { projectCore, type RetirementPlanInput } from "./index";
import { decodeRetirementPlan } from "./persistence";
import { isRecord } from "../utils";
import {
  isFollowingId,
  isSourceTime,
  readRecordArray,
} from "../personalFollowing";

export const RETIREMENT_SCENARIOS_KEY = "retirement-scenarios-v1";
export interface RetirementScenario {
  id: string;
  name: string;
  savedAt: string;
  plan: RetirementPlanInput;
}

export function parseRetirementScenarios(raw: string): RetirementScenario[] {
  const ids = new Set<string>();
  return readRecordArray(raw)
    .flatMap((row): RetirementScenario[] => {
      if (
        !isFollowingId(row.id) ||
        ids.has(row.id) ||
        typeof row.name !== "string" ||
        !row.name.trim() ||
        !isSourceTime(row.savedAt) ||
        !isRecord(row.plan) ||
        typeof row.plan.currentAge !== "number" ||
        !Number.isFinite(row.plan.currentAge)
      )
        return [];
      const plan = decodeRetirementPlan(row.plan);
      if (!plan) return [];
      ids.add(row.id);
      return [
        {
          id: row.id,
          name: row.name.trim().slice(0, 80),
          savedAt: row.savedAt,
          plan,
        },
      ];
    })
    .slice(0, 20);
}

const PLAN_GROUPS: Record<keyof RetirementPlanInput, string> = {
  currentAge: "Current age",
  retirementAge: "Retirement age",
  horizonAge: "Planning horizon",
  desiredAnnualSpend: "Annual spending",
  preMedicareHealthcare: "Healthcare before Medicare",
  accounts: "Account balances and contributions",
  allocation: "Asset allocation",
  otherIncome: "Social Security, pension, and other income",
  lumpyExpenses: "One-time expenses",
  assumptions: "Simulation, inflation, withdrawal, and tax assumptions",
};
export function changedPlanGroups(
  first: RetirementPlanInput,
  next: RetirementPlanInput,
) {
  return (Object.keys(PLAN_GROUPS) as (keyof RetirementPlanInput)[])
    .filter((key) => JSON.stringify(first[key]) !== JSON.stringify(next[key]))
    .map((key) => PLAN_GROUPS[key]);
}

export function compareRetirementScenarios(
  rows: RetirementScenario[],
  year: number,
) {
  return rows.slice(0, 4).map((row) => {
    try {
      return { ...row, result: projectCore(row.plan, year) };
    } catch {
      return { ...row, result: null };
    }
  });
}
