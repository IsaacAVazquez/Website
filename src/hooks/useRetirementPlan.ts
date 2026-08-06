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
import { decodeRetirementPlan } from "@/lib/retirement/persistence";
import {
  readValidatedBrowserStorage,
  writeBrowserStorageJson,
  type PersistenceStatus,
} from "@/lib/browserStorage";
import { useLocalStoragePersistenceStatus } from "@/hooks/useLocalStorageString";

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
  const payload: StoredPlan = { version: STORAGE_VERSION, plan };
  writeBrowserStorageJson(STORAGE_KEY, payload);
}

function loadPlan(): RetirementPlanInput | null {
  return readValidatedBrowserStorage<RetirementPlanInput | null>(
    STORAGE_KEY,
    (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
      const stored = value as Partial<StoredPlan>;
      if (stored.version !== STORAGE_VERSION) return undefined;
      return decodeRetirementPlan(stored.plan);
    },
    () => null,
  ).value;
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
  /** True when the engine failed on the current inputs (not just still computing). */
  hasError: boolean;
  persistenceStatus: PersistenceStatus;
  /**
   * True while the plan is still the seeded example rather than anything the
   * visitor entered. The engine computes a full verdict on the default plan,
   * so without this the planner told a first-time visitor their money runs out
   * at 79 under a panel captioned "Your numbers", about figures they had never
   * seen. Goes false on the first edit and when a stored plan is hydrated.
   */
  isSampleScenario: boolean;
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
  const persistenceStatus = useLocalStoragePersistenceStatus(STORAGE_KEY);
  const [plan, setPlan] = useState<RetirementPlanInput>(() => createDefaultPlan());
  const [debouncedPlan, setDebouncedPlan] = useState<RetirementPlanInput>(plan);
  const [ready, setReady] = useState(false);
  const [isSampleScenario, setIsSampleScenario] = useState(true);
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
    // A stored plan means this visitor has used the planner before, so the
    // figures are theirs even though no edit has happened in this session.
    if (stored) setIsSampleScenario(false);
    setReady(true);
  }, []);

  // Every visitor-driven mutation goes through this rather than setPlan, so the
  // sample flag flips on the first real edit. Hydrate and reset call setPlan
  // directly, so neither is mistaken for the visitor entering something.
  const editPlan = useCallback(
    (updater: React.SetStateAction<RetirementPlanInput>) => {
      setIsSampleScenario(false);
      setPlan(updater);
    },
    [],
  );

  // Persist + debounce the projection so typing stays responsive.
  useEffect(() => {
    if (!ready) return;
    // Never write the untouched example to storage. Writing it meant the next
    // visit hydrated a stored plan, concluded the visitor had entered these
    // figures, and went back to calling seeded defaults "Your numbers" — so
    // the sample framing would have shown on the first page view and never
    // again. The debounce below still runs, so the example still computes.
    if (!isSampleScenario) safeWrite(plan);
    const handle = setTimeout(() => setDebouncedPlan(plan), RECOMPUTE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [plan, ready, isSampleScenario]);

  // Fast path — verdict, chart, and assumptions paint immediately. An engine
  // failure must be distinguishable from "still computing", or the UI shows a
  // permanent loading state.
  const { core, hasError } = useMemo(() => {
    if (!ready) return { core: null, hasError: false };
    try {
      return { core: projectCore(debouncedPlan, new Date().getFullYear()), hasError: false };
    } catch {
      return { core: null, hasError: true };
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
        setLeverState({
          plan: debouncedPlan,
          levers: computeLevers(debouncedPlan, new Date().getFullYear()),
        });
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
  const isComputing = ready && !hasError && (debouncedPlan !== plan || !leversReady);

  // ─── Mutators ──────────────────────────────────────────────────────────────

  const updatePlan = useCallback((updates: Partial<RetirementPlanInput>) => {
    editPlan((prev) => ({ ...prev, ...updates }));
  }, [editPlan]);

  const updateAssumptions = useCallback((updates: Partial<RetirementAssumptions>) => {
    editPlan((prev) => ({ ...prev, assumptions: { ...prev.assumptions, ...updates } }));
  }, [editPlan]);

  const updateAllocation = useCallback((updates: Partial<AllocationInput>) => {
    editPlan((prev) => ({ ...prev, allocation: { ...prev.allocation, ...updates } }));
  }, [editPlan]);

  const updateOtherIncome = useCallback((updates: Partial<OtherIncomeInput>) => {
    editPlan((prev) => ({ ...prev, otherIncome: { ...prev.otherIncome, ...updates } }));
  }, [editPlan]);

  const addAccount = useCallback(() => {
    editPlan((prev) => ({
      ...prev,
      accounts: [
        ...prev.accounts,
        { id: nextAccountId(), type: "taxable", balance: 0, annualContribution: 0, employerMatch: 0 },
      ],
    }));
  }, [editPlan]);

  const updateAccount = useCallback((id: string, updates: Partial<RetirementAccountInput>) => {
    editPlan((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  }, [editPlan]);

  const removeAccount = useCallback((id: string) => {
    editPlan((prev) => ({ ...prev, accounts: prev.accounts.filter((a) => a.id !== id) }));
  }, [editPlan]);

  const addLumpyExpense = useCallback(() => {
    editPlan((prev) => ({
      ...prev,
      lumpyExpenses: [
        ...prev.lumpyExpenses,
        { id: nextAccountId(), label: "One-time expense", amount: 10000, age: prev.retirementAge + 5 },
      ],
    }));
  }, [editPlan]);

  const updateLumpyExpense = useCallback((id: string, updates: Partial<LumpyExpense>) => {
    editPlan((prev) => ({
      ...prev,
      lumpyExpenses: prev.lumpyExpenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  }, [editPlan]);

  const removeLumpyExpense = useCallback((id: string) => {
    editPlan((prev) => ({ ...prev, lumpyExpenses: prev.lumpyExpenses.filter((e) => e.id !== id) }));
  }, [editPlan]);

  const applyPortfolioBalance = useCallback((value: number) => {
    editPlan((prev) => {
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
  }, [editPlan]);

  const reset = useCallback(() => {
    const fresh = seedFreshPlan(seedRef.current);
    setPlan(fresh);
    setDebouncedPlan(fresh);
    // Reset puts the seeded example back, so the verdict stops being theirs.
    setIsSampleScenario(true);
  }, []);

  return {
    plan,
    result,
    ready,
    isComputing,
    hasError,
    persistenceStatus,
    isSampleScenario,
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
