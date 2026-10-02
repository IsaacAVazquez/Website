import { act, renderHook } from "@testing-library/react";
import {
  computeLevers,
  createDefaultPlan,
  type RetirementPlanInput,
  type RetirementResult,
} from "@/lib/retirement";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { useRetirementPlan, type RetirementSeed } from "../useRetirementPlan";

// The engine stays real. The lever search is wrapped so a test can count how
// many times the hook runs it, and the default plan runs 100 simulations where
// the app runs 1,000. No test here reads a figure that depends on the count,
// and 100 is the fewest a stored plan may ask for. That about halves a lever
// search, and it goes no lower because the search solves its targets at a
// fixed 250 simulations whatever the plan says.
jest.mock("@/lib/retirement", () => {
  const actual = jest.requireActual("@/lib/retirement");
  return {
    ...actual,
    computeLevers: jest.fn(actual.computeLevers),
    createDefaultPlan: () => {
      const plan = actual.createDefaultPlan();
      plan.assumptions.simulations = 100;
      return plan;
    },
  };
});
const leverSearch = jest.mocked(computeLevers);

// The projection and the lever search are CPU bound, so they take as long as
// the machine lets them. On a saturated machine they ran up to fourteen times
// slower than alone, which Jest's 5 second default does not allow for. No test
// waits on this limit, and it only ends a test that hangs.
jest.setTimeout(30_000);

const STORAGE_KEY = "retirement_plan";
const STORAGE_VERSION = 1;
const VERDICTS = ["on-track", "good", "fair", "at-risk"];
// RECOMPUTE_DEBOUNCE_MS in the hook, which keeps it private.
const DEBOUNCE_MS = 200;

/**
 * Returns once every timer the hook has queued for `delay` or less has fired
 * and the work behind it has run. A timer cannot fire ahead of one that was
 * set earlier for no longer, so this holds however long that work takes. With
 * no argument it covers the zero timeout the lever search waits behind.
 */
function waitForDeferredWork(delay = 0) {
  return act(async () => {
    await new Promise((resolve) => setTimeout(resolve, delay + 50));
  });
}

// Jest stops waiting for a test that passes its time limit, but the body keeps
// running. React counts act scopes in one place for the whole file, so a body
// that resumed during the next test opened scopes that overlapped that test's,
// and every later act in the file stopped flushing when it closed. Each test
// that waits on something runs through this, and afterEach waits for its body
// to finish, so a test that times out fails alone.
let testBody: Promise<unknown> = Promise.resolve();
function tracked(body: () => Promise<unknown>) {
  return () => (testBody = body());
}

function readStoredPlan(): RetirementPlanInput {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) throw new Error("nothing persisted");
  const parsed = JSON.parse(raw) as { version: number; plan: RetirementPlanInput };
  expect(parsed.version).toBe(STORAGE_VERSION);
  return parsed.plan;
}

describe("useRetirementPlan", () => {
  it("preserves another tab's age when changing spending", () => {
    const { result } = renderHook(() => useRetirementPlan(undefined, false));
    const savedPlan = { ...createDefaultPlan(), currentAge: 42 };
    const saved = JSON.stringify({ version: STORAGE_VERSION, plan: savedPlan });
    act(() => {
      localStorage.setItem(STORAGE_KEY, saved);
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: saved }));
    });
    expect(result.current.plan.currentAge).toBe(42);
    act(() => result.current.updatePlan({ desiredAnnualSpend: 80_000 }));
    expect(readStoredPlan().currentAge).toBe(42);
    expect(readStoredPlan().desiredAnnualSpend).toBe(80_000);
  });

  beforeEach(() => {
    resetBrowserStorageMemory();
    window.localStorage.clear();
  });

  afterEach(async () => {
    await testBody.catch(() => undefined);
    jest.restoreAllMocks();
    resetBrowserStorageMemory();
    window.localStorage.clear();
  });

  // Mounting hydrates the plan and runs the core projection before renderHook
  // returns, so the tests below read both straight away.
  it("becomes ready and produces a projection with a valid verdict from defaults", () => {
    const { result } = renderHook(() => useRetirementPlan());

    expect(result.current.ready).toBe(true);
    expect(result.current.result).not.toBeNull();

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

  // The planner is the last section on the investments page, and the
  // projection is about 150 ms of main-thread work, so the planner holds the
  // hook back until its section is near the viewport.
  it("runs no projection until it is enabled", tracked(async () => {
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useRetirementPlan(undefined, enabled),
      { initialProps: { enabled: false } },
    );

    expect(result.current.ready).toBe(true);
    await waitForDeferredWork();
    expect(result.current.result).toBeNull();
    expect(result.current.isComputing).toBe(false);
    expect(result.current.hasError).toBe(false);

    rerender({ enabled: true });

    expect(result.current.result).not.toBeNull();
    await waitForDeferredWork();
    expect(result.current.result?.levers.length).toBeGreaterThan(0);
  }));

  // The browser lays a print out when the beforeprint handlers return, and
  // printing never scrolls the planner into view. A projection that is still
  // held back has to be complete by then, levers included, and the levers
  // normally wait behind a timeout.
  it("has the projection and the levers ready when a beforeprint handler returns", () => {
    const { result } = renderHook(() => useRetirementPlan(undefined, false));
    expect(result.current.ready).toBe(true);
    expect(result.current.result).toBeNull();

    const atPrint: (RetirementResult | null)[] = [];
    act(() => {
      window.dispatchEvent(new Event("beforeprint"));
      atPrint.push(result.current.result);
    });

    expect(atPrint[0]).not.toBeNull();
    expect(VERDICTS).toContain(atPrint[0]?.verdict);
    expect(atPrint[0]?.levers.length).toBeGreaterThan(0);
  });

  // The lever search is the expensive part, about 150 ms on a desktop, and
  // the print handler has already run it by the time the page is laid out.
  it("does not repeat the lever search after a print", tracked(async () => {
    const { result } = renderHook(() => useRetirementPlan(undefined, false));
    expect(result.current.ready).toBe(true);
    leverSearch.mockClear();

    act(() => {
      window.dispatchEvent(new Event("beforeprint"));
    });
    await waitForDeferredWork();

    expect(leverSearch).toHaveBeenCalledTimes(1);
  }));

  it("prints the levers it already has without searching again", tracked(async () => {
    const { result } = renderHook(() => useRetirementPlan());
    expect(result.current.ready).toBe(true);
    // The deferred search is queued by now, so this waits on the search
    // itself. Polling for the levers against a clock failed on a busy machine.
    await waitForDeferredWork();
    expect(result.current.result?.levers.length).toBeGreaterThan(0);
    leverSearch.mockClear();

    act(() => {
      window.dispatchEvent(new Event("beforeprint"));
    });
    await waitForDeferredWork();

    expect(leverSearch).not.toHaveBeenCalled();
  }));

  it.each([true, false])("prints pending edits when enabled is %s", (enabled) => tracked(async () => {
    const { result } = renderHook(() => useRetirementPlan(undefined, enabled));
    expect(result.current.ready).toBe(true);
    await waitForDeferredWork();
    leverSearch.mockClear();

    act(() => result.current.updatePlan({ retirementAge: 55 }));
    const atPrint: (RetirementResult | null)[] = [];
    act(() => {
      window.dispatchEvent(new Event("beforeprint"));
      atPrint.push(result.current.result);
    });

    expect(atPrint[0]?.input.retirementAge).toBe(55);
    expect(atPrint[0]?.levers.length).toBeGreaterThan(0);
    expect(result.current.isComputing).toBe(false);
    expect(leverSearch).toHaveBeenLastCalledWith(result.current.plan, expect.any(Number));
    await waitForDeferredWork(DEBOUNCE_MS);
    expect(leverSearch).toHaveBeenCalledTimes(1);
    expect(result.current.result?.input.retirementAge).toBe(55);
  })());

  it("seeds a fresh plan from a portfolio value into a taxable account", () => {
    const seed: RetirementSeed = {
      portfolioValue: 250000,
      allocation: { stocks: 60, bonds: 30, cash: 10, other: 0 },
    };
    const { result } = renderHook(() => useRetirementPlan(seed));

    expect(result.current.ready).toBe(true);

    const taxable = result.current.plan.accounts.find((a) => a.type === "taxable");
    expect(taxable?.balance).toBe(250000);
    expect(result.current.plan.allocation).toMatchObject({ stocks: 60, bonds: 30, cash: 10 });
  });

  // The hook writes the plan in an effect, and act has run that effect by the
  // time it returns, so the stored plan is read straight after each change.
  it("updates inputs and persists the change to localStorage", () => {
    const { result } = renderHook(() => useRetirementPlan());
    expect(result.current.ready).toBe(true);

    act(() => {
      result.current.updatePlan({ desiredAnnualSpend: 90000 });
    });

    expect(result.current.plan.desiredAnnualSpend).toBe(90000);
    expect(readStoredPlan().desiredAnnualSpend).toBe(90000);

    act(() => {
      result.current.updateAllocation({ stocks: 50, bonds: 40 });
    });
    expect(result.current.plan.allocation.stocks).toBe(50);
    expect(result.current.plan.allocation.bonds).toBe(40);
    expect(readStoredPlan().allocation.stocks).toBe(50);
  });

  it("recomputes the projection after the debounced inputs settle", tracked(async () => {
    const { result } = renderHook(() => useRetirementPlan());
    expect(result.current.ready).toBe(true);
    expect(result.current.result).not.toBeNull();

    const baseline = result.current.result!.targetNestEgg;

    // A much larger spend requirement should raise the target nest egg.
    act(() => {
      result.current.updatePlan({ desiredAnnualSpend: 200000 });
    });

    // The debounced projection catches up to the new (much larger) spend.
    await waitForDeferredWork(DEBOUNCE_MS);
    expect(result.current.result!.targetNestEgg).toBeGreaterThan(baseline);
  }));

  it("manages accounts: add, update, and remove", () => {
    const { result } = renderHook(() => useRetirementPlan());
    expect(result.current.ready).toBe(true);

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
    expect(readStoredPlan().accounts).toHaveLength(startCount);
  });

  it("applyPortfolioBalance sets the first account balance", () => {
    const { result } = renderHook(() => useRetirementPlan());
    expect(result.current.ready).toBe(true);

    act(() => {
      result.current.applyPortfolioBalance(777000);
    });
    expect(result.current.plan.accounts[0].balance).toBe(777000);
  });

  it("hydrates from a pre-seeded localStorage value on mount", () => {
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

    expect(result.current.ready).toBe(true);

    expect(result.current.plan.currentAge).toBe(42);
    expect(result.current.plan.retirementAge).toBe(60);
    expect(result.current.plan.desiredAnnualSpend).toBe(75000);
    // Stored plan had no taxable seed account.
    expect(result.current.plan.accounts.some((a) => a.balance === 999999)).toBe(false);
  });

  it("reset restores a fresh seeded plan", () => {
    const { result } = renderHook(() => useRetirementPlan({ portfolioValue: 300000 }));
    expect(result.current.ready).toBe(true);

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

  it("keeps the plan reset on the next visit", () => {
    const first = renderHook(() => useRetirementPlan(undefined, false));
    act(() => first.result.current.updatePlan({ desiredAnnualSpend: 111111 }));
    expect(readStoredPlan().desiredAnnualSpend).toBe(111111);

    act(() => first.result.current.reset());
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    first.unmount();
    // A new page load also discards the helper's memory fallback.
    resetBrowserStorageMemory();
    const next = renderHook(() => useRetirementPlan(undefined, false));
    expect(next.result.current.isSampleScenario).toBe(true);
    expect(next.result.current.plan.desiredAnnualSpend).toBe(createDefaultPlan().desiredAnnualSpend);
  });

  it("repairs malformed stored plan fields before running the engine", () => {
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
    expect(result.current.ready).toBe(true);

    expect(result.current.plan.currentAge).toBe(35);
    expect(result.current.plan.retirementAge).toBe(36);
    expect(result.current.plan.horizonAge).toBe(37);
    expect(result.current.plan.desiredAnnualSpend).toBe(60000);
    expect(result.current.plan.accounts).toEqual([]);
    expect(result.current.plan.allocation).toMatchObject({ stocks: 70, bonds: 15 });
    expect(result.current.plan.assumptions.simulations).toBe(10000);
    expect(result.current.plan.assumptions.withdrawalStrategy).toBe("fixed-real");
  });

  it("keeps retirement age above a valid current age when the stored value has the wrong type", () => {
    const stored = createDefaultPlan();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        plan: { ...stored, currentAge: 70, retirementAge: "sixty-five" },
      }),
    );

    const { result } = renderHook(() => useRetirementPlan());
    expect(result.current.ready).toBe(true);

    expect(result.current.plan.currentAge).toBe(70);
    // The type-corrupted retirement age must not fall back below currentAge + 1.
    expect(result.current.plan.retirementAge).toBe(71);
    expect(result.current.plan.horizonAge).toBeGreaterThanOrEqual(72);
  });

  it("surfaces memory-only persistence when a plan write is rejected", () => {
    const { result } = renderHook(() => useRetirementPlan());
    expect(result.current.ready).toBe(true);
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "QuotaExceededError");
    });

    act(() => result.current.updatePlan({ desiredAnnualSpend: 123456 }));

    expect(result.current.plan.desiredAnnualSpend).toBe(123456);
    expect(result.current.persistenceStatus).toBe("memory-only");
  });
});
