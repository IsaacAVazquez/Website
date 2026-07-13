import { act, renderHook, waitFor } from "@testing-library/react";
import { createDefaultPlan, type RetirementPlanInput } from "@/lib/retirement";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { useRetirementPlan, type RetirementSeed } from "../useRetirementPlan";

const STORAGE_KEY = "retirement_plan";
const STORAGE_VERSION = 1;
const VERDICTS = ["on-track", "good", "fair", "at-risk"];

function readStoredPlan(): RetirementPlanInput {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) throw new Error("nothing persisted");
  const parsed = JSON.parse(raw) as { version: number; plan: RetirementPlanInput };
  expect(parsed.version).toBe(STORAGE_VERSION);
  return parsed.plan;
}

describe("useRetirementPlan", () => {
  beforeEach(() => {
    resetBrowserStorageMemory();
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    resetBrowserStorageMemory();
    window.localStorage.clear();
  });

  it("becomes ready and produces a projection with a valid verdict from defaults", async () => {
    const { result } = renderHook(() => useRetirementPlan());

    await waitFor(() => expect(result.current.ready).toBe(true));
    await waitFor(() => expect(result.current.result).not.toBeNull());

    const { plan, result: projection } = result.current;
    // Defaults flow through when there is no seed and no stored plan.
    expect(plan.currentAge).toBe(35);
    expect(plan.retirementAge).toBe(65);

    expect(result.current.hasError).toBe(false);
    expect(projection).not.toBeNull();
    expect(VERDICTS).toContain(projection!.verdict);
    expect(typeof projection!.monteCarlo.successRate).toBe("number");
    expect(projection!.monteCarlo.successRate).toBeGreaterThanOrEqual(0);
    expect(projection!.monteCarlo.successRate).toBeLessThanOrEqual(1);
    expect(projection!.targetNestEgg).toBeGreaterThan(0);
  });

  it("seeds a fresh plan from a portfolio value into a taxable account", async () => {
    const seed: RetirementSeed = {
      portfolioValue: 250000,
      allocation: { stocks: 60, bonds: 30, cash: 10, other: 0 },
    };
    const { result } = renderHook(() => useRetirementPlan(seed));

    await waitFor(() => expect(result.current.ready).toBe(true));

    const taxable = result.current.plan.accounts.find((a) => a.type === "taxable");
    expect(taxable?.balance).toBe(250000);
    expect(result.current.plan.allocation).toMatchObject({ stocks: 60, bonds: 30, cash: 10 });
  });

  it("updates inputs and persists the change to localStorage", async () => {
    const { result } = renderHook(() => useRetirementPlan());
    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => {
      result.current.updatePlan({ desiredAnnualSpend: 90000 });
    });

    expect(result.current.plan.desiredAnnualSpend).toBe(90000);
    await waitFor(() => expect(readStoredPlan().desiredAnnualSpend).toBe(90000));

    act(() => {
      result.current.updateAllocation({ stocks: 50, bonds: 40 });
    });
    expect(result.current.plan.allocation.stocks).toBe(50);
    expect(result.current.plan.allocation.bonds).toBe(40);
    await waitFor(() => expect(readStoredPlan().allocation.stocks).toBe(50));
  });

  it("recomputes the projection after the debounced inputs settle", async () => {
    const { result } = renderHook(() => useRetirementPlan());
    await waitFor(() => expect(result.current.ready).toBe(true));
    await waitFor(() => expect(result.current.result).not.toBeNull());

    const baseline = result.current.result!.targetNestEgg;

    // A much larger spend requirement should raise the target nest egg.
    act(() => {
      result.current.updatePlan({ desiredAnnualSpend: 200000 });
    });

    // The debounced projection catches up to the new (much larger) spend.
    await waitFor(
      () => expect(result.current.result!.targetNestEgg).toBeGreaterThan(baseline),
      { timeout: 3000 },
    );
  });

  it("manages accounts: add, update, and remove", async () => {
    const { result } = renderHook(() => useRetirementPlan());
    await waitFor(() => expect(result.current.ready).toBe(true));

    const startCount = result.current.plan.accounts.length;

    act(() => {
      result.current.addAccount();
    });
    expect(result.current.plan.accounts).toHaveLength(startCount + 1);

    const newId = result.current.plan.accounts[result.current.plan.accounts.length - 1].id;
    act(() => {
      result.current.updateAccount(newId, { balance: 123456 });
    });
    expect(result.current.plan.accounts.find((a) => a.id === newId)?.balance).toBe(123456);

    act(() => {
      result.current.removeAccount(newId);
    });
    expect(result.current.plan.accounts).toHaveLength(startCount);
    await waitFor(() => expect(readStoredPlan().accounts).toHaveLength(startCount));
  });

  it("applyPortfolioBalance sets the first account balance", async () => {
    const { result } = renderHook(() => useRetirementPlan());
    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => {
      result.current.applyPortfolioBalance(777000);
    });
    expect(result.current.plan.accounts[0].balance).toBe(777000);
  });

  it("hydrates from a pre-seeded localStorage value on mount", async () => {
    const stored = createDefaultPlan();
    stored.currentAge = 42;
    stored.retirementAge = 60;
    stored.desiredAnnualSpend = 75000;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, plan: stored }),
    );

    // A seed is provided but the stored plan must win.
    const { result } = renderHook(() =>
      useRetirementPlan({ portfolioValue: 999999 }),
    );

    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.plan.currentAge).toBe(42);
    expect(result.current.plan.retirementAge).toBe(60);
    expect(result.current.plan.desiredAnnualSpend).toBe(75000);
    // Stored plan had no taxable seed account.
    expect(result.current.plan.accounts.some((a) => a.balance === 999999)).toBe(false);
  });

  it("reset restores a fresh seeded plan", async () => {
    const { result } = renderHook(() => useRetirementPlan({ portfolioValue: 300000 }));
    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => {
      result.current.updatePlan({ desiredAnnualSpend: 111111 });
    });
    expect(result.current.plan.desiredAnnualSpend).toBe(111111);

    act(() => {
      result.current.reset();
    });

    expect(result.current.plan.desiredAnnualSpend).toBe(createDefaultPlan().desiredAnnualSpend);
    expect(result.current.plan.accounts.some((a) => a.balance === 300000)).toBe(true);
  });

  it("repairs malformed stored plan fields before running the engine", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        plan: {
          currentAge: "unknown",
          retirementAge: 20,
          horizonAge: 10,
          desiredAnnualSpend: "a lot",
          accounts: [{ id: "", type: "mystery", balance: "all of it" }],
          allocation: { stocks: 70, bonds: "thirty" },
          assumptions: { simulations: 1_000_000, withdrawalStrategy: "wishful" },
        },
      }),
    );

    const { result } = renderHook(() => useRetirementPlan());
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.plan.currentAge).toBe(35);
    expect(result.current.plan.retirementAge).toBe(36);
    expect(result.current.plan.horizonAge).toBe(37);
    expect(result.current.plan.desiredAnnualSpend).toBe(60000);
    expect(result.current.plan.accounts).toEqual([]);
    expect(result.current.plan.allocation).toMatchObject({ stocks: 70, bonds: 15 });
    expect(result.current.plan.assumptions.simulations).toBe(10000);
    expect(result.current.plan.assumptions.withdrawalStrategy).toBe("fixed-real");
  });

  it("keeps retirement age above a valid current age when the stored value has the wrong type", async () => {
    const stored = createDefaultPlan();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        plan: { ...stored, currentAge: 70, retirementAge: "sixty-five" },
      }),
    );

    const { result } = renderHook(() => useRetirementPlan());
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.plan.currentAge).toBe(70);
    // The type-corrupted retirement age must not fall back below currentAge + 1.
    expect(result.current.plan.retirementAge).toBe(71);
    expect(result.current.plan.horizonAge).toBeGreaterThanOrEqual(72);
  });

  it("surfaces memory-only persistence when a plan write is rejected", async () => {
    const { result } = renderHook(() => useRetirementPlan());
    await waitFor(() => expect(result.current.ready).toBe(true));
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "QuotaExceededError");
    });

    act(() => result.current.updatePlan({ desiredAnnualSpend: 123456 }));

    expect(result.current.plan.desiredAnnualSpend).toBe(123456);
    await waitFor(() => expect(result.current.persistenceStatus).toBe("memory-only"));
  });
});
