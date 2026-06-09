"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  projectCore,
  computeLevers,
  createDefaultPlan,
  type AllocationInput,
  type LeverEffect,
  type LumpyExpense,
  type OtherIncomeInput,
  type RetirementAccountInput,
  type RetirementAssumptions,
  type RetirementPlanInput,
  type RetirementResult,
} from "@/lib/retirement";

const STORAGE_KEY = "retirement_plan";
const STORAGE_VERSION = 1;
const RECOMPUTE_DEBOUNCE_MS = 200;

interface StoredPlan {
  version: number;
  plan: RetirementPlanInput;
}

/** Optional values used to seed a *fresh* plan from the user's portfolio. */
export interface RetirementSeed {
  portfolioValue?: number;
  allocation?: AllocationInput;
}

function safeWrite(plan: RetirementPlanInput): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredPlan = { version: STORAGE_VERSION, plan };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota exceeded or storage disabled — projection still works in-memory.
  }
}

function loadPlan(): RetirementPlanInput | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPlan;
    if (!parsed || parsed.version !== STORAGE_VERSION || !parsed.plan) return null;
    // Merge over defaults so newly-added fields are always present.
    const base = createDefaultPlan();
    return {
      ...base,
      ...parsed.plan,
      otherIncome: { ...base.otherIncome, ...parsed.plan.otherIncome },
      allocation: { ...base.allocation, ...parsed.plan.allocation },
      assumptions: {
        ...base.assumptions,
        ...parsed.plan.assumptions,
        taxRates: { ...base.assumptions.taxRates, ...parsed.plan.assumptions?.taxRates },
      },
    };
  } catch {
    return null;
  }
}

function seedFreshPlan(seed?: RetirementSeed): RetirementPlanInput {
  const plan = createDefaultPlan();
  if (seed?.portfolioValue && seed.portfolioValue > 0) {
    // A brokerage portfolio is a taxable account; pre-fill it as a starting point.
    plan.accounts = [
      { id: "portfolio", type: "taxable", balance: Math.round(seed.portfolioValue), annualContribution: 0, employerMatch: 0 },
      ...plan.accounts.map((a) => ({ ...a, balance: 0 })),
    ];
  }
  if (seed?.allocation) {
    plan.allocation = { ...plan.allocation, ...seed.allocation };
  }
  return plan;
}

let accountCounter = 0;
function nextAccountId(): string {
  accountCounter += 1;
  return `acct-${Date.now()}-${accountCounter}`;
}

export interface UseRetirementPlanReturn {
  plan: RetirementPlanInput;
  result: RetirementResult | null;
  ready: boolean;
  /** True while the (debounced) projection catches up to the latest inputs. */
  isComputing: boolean;
  updatePlan: (updates: Partial<RetirementPlanInput>) => void;
  updateAssumptions: (updates: Partial<RetirementAssumptions>) => void;
  updateAllocation: (updates: Partial<AllocationInput>) => void;
  updateOtherIncome: (updates: Partial<OtherIncomeInput>) => void;
  addAccount: () => void;
  updateAccount: (id: string, updates: Partial<RetirementAccountInput>) => void;
  removeAccount: (id: string) => void;
  addLumpyExpense: () => void;
  updateLumpyExpense: (id: string, updates: Partial<LumpyExpense>) => void;
  removeLumpyExpense: (id: string) => void;
  applyPortfolioBalance: (value: number) => void;
  reset: () => void;
}

export function useRetirementPlan(seed?: RetirementSeed): UseRetirementPlanReturn {
  const [plan, setPlan] = useState<RetirementPlanInput>(() => createDefaultPlan());
  const [debouncedPlan, setDebouncedPlan] = useState<RetirementPlanInput>(plan);
  const [ready, setReady] = useState(false);
  const seedRef = useRef(seed);

  // Keep the latest seed in a ref for reset(), updated after render.
  useEffect(() => {
    seedRef.current = seed;
  });

  // Hydrate from localStorage on mount (SSR-safe — must run in an effect).
  useEffect(() => {
    const stored = loadPlan();
    const initial = stored ?? seedFreshPlan(seedRef.current);
    setPlan(initial);
    setDebouncedPlan(initial);
    setReady(true);
  }, []);

  // Persist + debounce the projection so typing stays responsive.
  useEffect(() => {
    if (!ready) return;
    safeWrite(plan);
    const handle = setTimeout(() => setDebouncedPlan(plan), RECOMPUTE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [plan, ready]);

  // Fast path — verdict, chart, and assumptions paint immediately.
  const core = useMemo(() => {
    if (!ready) return null;
    try {
      return projectCore(debouncedPlan);
    } catch {
      return null;
    }
  }, [debouncedPlan, ready]);

  // Heavier lever sensitivity runs off the critical path, after the core paints.
  // We track which plan the levers belong to so "computing" can be derived
  // (no synchronous setState in the effect body).
  const [leverState, setLeverState] = useState<{
    plan: RetirementPlanInput | null;
    levers: LeverEffect[];
  }>({ plan: null, levers: [] });

  useEffect(() => {
    if (!core) return;
    const handle = setTimeout(() => {
      try {
        setLeverState({ plan: debouncedPlan, levers: computeLevers(debouncedPlan) });
      } catch {
        setLeverState({ plan: debouncedPlan, levers: [] });
      }
    }, 0);
    return () => clearTimeout(handle);
  }, [debouncedPlan, core]);

  const result = useMemo<RetirementResult | null>(() => {
    if (!core) return null;
    const levers = leverState.plan === debouncedPlan ? leverState.levers : [];
    return { ...core, levers };
  }, [core, leverState, debouncedPlan]);

  const leversReady = leverState.plan === debouncedPlan;
  const isComputing = ready && (debouncedPlan !== plan || !leversReady);

  // ─── Mutators ──────────────────────────────────────────────────────────────

  const updatePlan = useCallback((updates: Partial<RetirementPlanInput>) => {
    setPlan((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateAssumptions = useCallback((updates: Partial<RetirementAssumptions>) => {
    setPlan((prev) => ({ ...prev, assumptions: { ...prev.assumptions, ...updates } }));
  }, []);

  const updateAllocation = useCallback((updates: Partial<AllocationInput>) => {
    setPlan((prev) => ({ ...prev, allocation: { ...prev.allocation, ...updates } }));
  }, []);

  const updateOtherIncome = useCallback((updates: Partial<OtherIncomeInput>) => {
    setPlan((prev) => ({ ...prev, otherIncome: { ...prev.otherIncome, ...updates } }));
  }, []);

  const addAccount = useCallback(() => {
    setPlan((prev) => ({
      ...prev,
      accounts: [
        ...prev.accounts,
        { id: nextAccountId(), type: "taxable", balance: 0, annualContribution: 0, employerMatch: 0 },
      ],
    }));
  }, []);

  const updateAccount = useCallback((id: string, updates: Partial<RetirementAccountInput>) => {
    setPlan((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  }, []);

  const removeAccount = useCallback((id: string) => {
    setPlan((prev) => ({ ...prev, accounts: prev.accounts.filter((a) => a.id !== id) }));
  }, []);

  const addLumpyExpense = useCallback(() => {
    setPlan((prev) => ({
      ...prev,
      lumpyExpenses: [
        ...prev.lumpyExpenses,
        { id: nextAccountId(), label: "One-time expense", amount: 10000, age: prev.retirementAge + 5 },
      ],
    }));
  }, []);

  const updateLumpyExpense = useCallback((id: string, updates: Partial<LumpyExpense>) => {
    setPlan((prev) => ({
      ...prev,
      lumpyExpenses: prev.lumpyExpenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  }, []);

  const removeLumpyExpense = useCallback((id: string) => {
    setPlan((prev) => ({ ...prev, lumpyExpenses: prev.lumpyExpenses.filter((e) => e.id !== id) }));
  }, []);

  const applyPortfolioBalance = useCallback((value: number) => {
    setPlan((prev) => {
      if (prev.accounts.length === 0) {
        return {
          ...prev,
          accounts: [
            { id: "portfolio", type: "taxable", balance: Math.round(value), annualContribution: 0, employerMatch: 0 },
          ],
        };
      }
      return {
        ...prev,
        accounts: prev.accounts.map((a, i) => (i === 0 ? { ...a, balance: Math.round(value) } : a)),
      };
    });
  }, []);

  const reset = useCallback(() => {
    const fresh = seedFreshPlan(seedRef.current);
    setPlan(fresh);
    setDebouncedPlan(fresh);
  }, []);

  return {
    plan,
    result,
    ready,
    isComputing,
    updatePlan,
    updateAssumptions,
    updateAllocation,
    updateOtherIncome,
    addAccount,
    updateAccount,
    removeAccount,
    addLumpyExpense,
    updateLumpyExpense,
    removeLumpyExpense,
    applyPortfolioBalance,
    reset,
  };
}
