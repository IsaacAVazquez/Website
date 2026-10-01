import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { BUDGET_PLANNER_STORAGE_KEY } from "@/lib/budgetPlanner";
import { RENT_VS_BUY_STORAGE_KEY } from "@/lib/rentVsBuy/persistence";
import { useBudgetPlanner } from "../useBudgetPlanner";
import { useRentVsBuy } from "../useRentVsBuy";
import { useMBAApplications } from "../useMBAApplications";
import { useMBAJobs } from "../useMBAJobs";
import type { MBAJob } from "@/types/mba-jobs";

const job: MBAJob = {
  id: "stripe-1", companyId: "stripe", companyName: "Stripe",
  title: "MBA Product Intern", location: "San Francisco", department: "Product",
  applyUrl: "https://example.com/apply", postedAt: "2026-09-30T12:00:00.000Z",
  atsType: "greenhouse", category: "fintech", snippet: "Summer internship",
  roleType: "internship", roleFamilies: ["product"],
};

describe("tool hooks with unavailable browser storage", () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    localStorage.clear();
    resetBrowserStorageMemory();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ jobs: [job], errors: [], sourceStatuses: [], fetchedAt: job.postedAt }),
    });
  });
  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
    resetBrowserStorageMemory();
    global.fetch = originalFetch;
  });

  it("synchronizes budget and rent inputs across tabs and handles storage clears", () => {
    const budget = renderHook(() => useBudgetPlanner("2026-09"));
    const rent = renderHook(() => useRentVsBuy());
    const months = { "2026-09": { ...budget.result.current.activeMonth, income: 7000 } };
    const input = { ...rent.result.current.input, homePrice: 700000 };
    act(() => {
      for (const [key, value] of [
        [BUDGET_PLANNER_STORAGE_KEY, JSON.stringify(months)],
        [RENT_VS_BUY_STORAGE_KEY, JSON.stringify(input)],
      ]) {
        localStorage.setItem(key, value);
        window.dispatchEvent(new StorageEvent("storage", { key, newValue: value, storageArea: localStorage }));
      }
    });
    expect(budget.result.current.activeMonth.income).toBe(7000);
    expect(rent.result.current.input.homePrice).toBe(700000);
    act(() => {
      localStorage.clear();
      window.dispatchEvent(new StorageEvent("storage", { key: null, storageArea: localStorage }));
    });
    expect(budget.result.current.activeMonth.income).toBe(0);
    expect(rent.result.current.input.homePrice).not.toBe(700000);
  });

  it.each(["reads and writes", "writes"])("keeps budgets and calculations usable when storage blocks %s", (blocked) => {
    if (blocked === "reads and writes") {
      jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("blocked", "SecurityError"); });
    }
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("full", "QuotaExceededError"); });
    const budget = renderHook(() => useBudgetPlanner("2026-09"));
    const rent = renderHook(() => useRentVsBuy());

    act(() => {
      budget.result.current.updateIncome(5000);
      budget.result.current.updateSavingsTarget(1000);
      rent.result.current.setField("homePrice", 600000);
      rent.result.current.setField("monthlyRent", 3000);
    });
    expect(budget.result.current.summary.availableToBudget).toBe(4000);
    expect(rent.result.current.input.homePrice).toBe(600000);
    expect(rent.result.current.input.monthlyRent).toBe(3000);
    const categoryId = budget.result.current.activeMonth.categories[0].id;
    act(() => budget.result.current.addExpense({ categoryId, amount: 42, date: "2026-09-30", note: "Lunch" }));
    expect(budget.result.current.summary.spentTotal).toBe(42);
    budget.unmount();
    rent.unmount();
    expect(renderHook(() => useBudgetPlanner("2026-09")).result.current.summary.spentTotal).toBe(42);
    expect(renderHook(() => useRentVsBuy()).result.current.input.homePrice).toBe(600000);
  });

  it("keeps job tracking and seen IDs usable when storage is blocked", async () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("blocked", "SecurityError"); });
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("blocked", "SecurityError"); });
    const applications = renderHook(() => useMBAApplications());
    const jobs = renderHook(() => useMBAJobs());
    await waitFor(() => expect(jobs.result.current.isLoading).toBe(false));
    expect(jobs.result.current.jobs).toHaveLength(1);
    act(() => {
      applications.result.current.trackJob(job);
      jobs.result.current.markJobSeen(job.id);
      jobs.result.current.setAllCompanies(false);
    });
    expect(applications.result.current.applications).toHaveLength(1);
    expect(jobs.result.current.seenIds.has(job.id)).toBe(true);
    expect(jobs.result.current.watchedCompanyIds.size).toBe(0);
    const id = applications.result.current.applications[0].id;
    act(() => applications.result.current.updateStatus(id, "applied"));
    expect(applications.result.current.applications[0].status).toBe("applied");
    jobs.unmount();
    applications.unmount();
    expect(renderHook(() => useMBAApplications()).result.current.applications[0].status).toBe("applied");
    const revisited = renderHook(() => useMBAJobs());
    await waitFor(() => expect(revisited.result.current.isLoading).toBe(false));
    expect(revisited.result.current.seenIds.has(job.id)).toBe(true);
    expect(revisited.result.current.watchedCompanyIds.size).toBe(0);
  });
});
