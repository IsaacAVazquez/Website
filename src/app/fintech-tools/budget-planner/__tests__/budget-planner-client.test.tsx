import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { BudgetPlannerClient } from "../budget-planner-client";
import { BUDGET_PLANNER_STORAGE_KEY } from "@/lib/budgetPlanner";
import { toLocalDateKey } from "@/lib/date-formatters";

describe("BudgetPlannerClient", () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(Date.parse("2026-04-03T16:00:00.000Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it("seeds the current month into localStorage on first render", async () => {
    render(<BudgetPlannerClient />);

    expect(screen.getByRole("heading", { name: "Budget Planner" })).toBeVisible();
    expect(screen.getByLabelText("Budget month")).toHaveValue("2026-04");

    await waitFor(() => {
      const stored = localStorage.getItem(BUDGET_PLANNER_STORAGE_KEY);
      expect(stored).not.toBeNull();
    });

    const months = JSON.parse(localStorage.getItem(BUDGET_PLANNER_STORAGE_KEY) || "{}");
    expect(months["2026-04"]).toBeDefined();
    expect(months["2026-04"].categories.length).toBeGreaterThan(1);
  });

  it("copies a saved plan and records recurring bills only once", () => {
    localStorage.setItem(BUDGET_PLANNER_STORAGE_KEY, JSON.stringify({ "2026-03": {
      monthKey: "2026-03", income: 2000, savingsTarget: 200,
      categories: [{ id: "housing", name: "Housing", budgetedAmount: 1000, carryForward: true }],
      expenses: [{ id: "paid", categoryId: "housing", amount: 900, date: "2026-03-01", note: "Rent" }],
      recurringExpenses: [{ id: "rent", categoryId: "housing", amount: 900, day: 1, note: "Rent" }],
    } }));
    render(<BudgetPlannerClient />);
    fireEvent.click(screen.getByText("Reuse a plan and recurring bills"));
    fireEvent.click(screen.getByRole("button", { name: "Copy previous month’s plan" }));
    expect(screen.getByLabelText("Monthly income")).toHaveValue(2000);
    expect(screen.getByText(/Includes \$100 carried in/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Record this month’s bills/ }));
    expect(screen.getByRole("button", { name: /Record this month’s bills/ })).toBeDisabled();
    const saved = JSON.parse(localStorage.getItem(BUDGET_PLANNER_STORAGE_KEY) ?? "{}")["2026-04"];
    expect(saved.expenses).toHaveLength(1);
    expect(saved.expenses[0]).toMatchObject({ date: "2026-04-01", amount: 900 });
    expect(screen.getByRole("button", { name: "Copy previous month’s plan" })).toBeDisabled();
  });

  it("ends the check register on the same amount the month bar calls left to spend", async () => {
    localStorage.setItem(
      BUDGET_PLANNER_STORAGE_KEY,
      JSON.stringify({
        "2026-04": {
          monthKey: "2026-04",
          income: 7200,
          savingsTarget: 1000,
          categories: [{ id: "groceries", name: "Groceries", budgetedAmount: 600 }],
          expenses: [
            { id: "e1", categoryId: "groceries", amount: 120, date: "2026-04-01", note: "Market" },
            { id: "e2", categoryId: "groceries", amount: 45, date: "2026-04-02", note: "Bakery" },
          ],
        },
      })
    );

    render(<BudgetPlannerClient />);

    // 7200 income, 1000 set aside, 165 spent.
    const matches = await screen.findAllByText("$6,035");
    expect(matches.some((el) => el.classList.contains("bp-sum-value"))).toBe(true);
    const balances = screen.getAllByRole("cell").filter((cell) => cell.getAttribute("data-label") === "Balance");
    expect(balances[balances.length - 1]).toHaveTextContent("$6,035");
  });

  it("hydrates saved values and seeds a new month when the selector changes", async () => {
    localStorage.setItem(
      BUDGET_PLANNER_STORAGE_KEY,
      JSON.stringify({
        "2026-04": {
          monthKey: "2026-04",
          income: 7200,
          savingsTarget: 1400,
          categories: [
            { id: "housing", name: "Housing", budgetedAmount: 2200 },
            { id: "groceries", name: "Groceries", budgetedAmount: 600 },
          ],
          expenses: [],
        },
      })
    );

    render(<BudgetPlannerClient />);

    expect(screen.getByLabelText("Monthly income")).toHaveValue(7200);
    expect(screen.getByLabelText("Savings target")).toHaveValue(1400);

    fireEvent.change(screen.getByLabelText("Budget month"), {
      target: { value: "2026-05" },
    });

    await waitFor(() => {
      expect(screen.getAllByText("May 2026").length).toBeGreaterThan(0);
    });

    const months = JSON.parse(localStorage.getItem(BUDGET_PLANNER_STORAGE_KEY) || "{}");
    expect(months["2026-05"]).toBeDefined();
    expect(months["2026-05"].categories.length).toBeGreaterThan(1);
  });

  it("supports add, rename, rebudget, and delete category flows", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<BudgetPlannerClient />);

    await user.type(screen.getByLabelText("New category name"), "Travel");
    await user.click(screen.getByRole("button", { name: "Add category" }));

    const travelNameInput = screen.getByLabelText("Category name for Travel");
    expect(travelNameInput).toBeVisible();

    fireEvent.change(screen.getByLabelText("Budget amount for Travel"), {
      target: { value: "300" },
    });

    fireEvent.change(travelNameInput, {
      target: { value: "Summer Travel" },
    });
    fireEvent.blur(travelNameInput);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Summer Travel")).toBeVisible();
    });

    const monthsAfterEdit = JSON.parse(localStorage.getItem(BUDGET_PLANNER_STORAGE_KEY) || "{}");
    const travelCategory = monthsAfterEdit["2026-04"].categories.find(
      (category: { name: string }) => category.name === "Summer Travel"
    );
    expect(travelCategory?.budgetedAmount).toBe(300);

    await user.click(screen.getByLabelText("Delete Summer Travel"));

    expect(screen.queryByLabelText("Category name for Summer Travel")).not.toBeInTheDocument();
  });

  it("supports add, edit, and delete expense flows", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<BudgetPlannerClient />);

    await user.selectOptions(
      screen.getByLabelText("Expense category"),
      within(screen.getByLabelText("Expense category")).getByRole("option", { name: "Groceries" })
    );
    await user.type(screen.getByLabelText("Expense amount"), "125.45");
    fireEvent.change(screen.getByLabelText("Expense date"), {
      target: { value: "2026-04-05" },
    });
    await user.type(screen.getByLabelText("Expense note"), "Groceries run");
    await user.click(screen.getByRole("button", { name: "Add expense" }));

    expect(screen.getAllByText("Groceries run").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$125.45").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Edit Groceries run expense" }));
    expect(screen.getByRole("button", { name: "Save expense" })).toBeVisible();

    await user.clear(screen.getByLabelText("Expense amount"));
    await user.type(screen.getByLabelText("Expense amount"), "140");
    await user.click(screen.getByRole("button", { name: "Save expense" }));

    expect(screen.getAllByText("$140").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Delete Groceries run expense" }));

    expect(screen.queryAllByText("Groceries run")).toHaveLength(0);
  });

  it("lets a category name stay blank while retyping and commits it on blur", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<BudgetPlannerClient />);
    const name = screen.getByLabelText("Category name for Housing");

    await user.clear(name);
    expect(name).toHaveValue("");
    await user.type(name, "Home costs");
    await user.tab();

    expect(screen.getByLabelText("Category name for Home costs")).toHaveValue("Home costs");
    const months = JSON.parse(localStorage.getItem(BUDGET_PLANNER_STORAGE_KEY) || "{}");
    expect(months["2026-04"].categories[0].name).toBe("Home costs");

    await user.clear(screen.getByLabelText("Category name for Home costs"));
    await user.tab();
    expect(screen.getByLabelText("Category name for Home costs")).toHaveValue("Home costs");
  });

  it("prints no month or date in the server render, so a page built last month still hydrates", () => {
    // The month and today are the visitor's own, read after mount.
    const html = renderToString(<BudgetPlannerClient />);

    expect(html).toContain("this month");
    expect(html).not.toContain("April 2026");
    expect(html).not.toContain("2026-04");
  });

  it("hydrates a page built last month without a mismatch, then shows this month", async () => {
    // The server render stands in for the last build of March.
    jest.setSystemTime(new Date(2026, 2, 31, 12));
    const html = renderToString(<BudgetPlannerClient />);
    jest.setSystemTime(Date.parse("2026-04-03T16:00:00.000Z"));

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const recoverable: unknown[] = [];

    const root = await act(async () =>
      hydrateRoot(container, <BudgetPlannerClient />, {
        onRecoverableError: (error) => recoverable.push(error),
      })
    );

    expect(recoverable).toEqual([]);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(container.querySelector(".bp-month-name")).toHaveTextContent("April 2026");
    expect(within(container).getByLabelText("Budget month")).toHaveValue("2026-04");

    act(() => root.unmount());
    container.remove();
    errorSpy.mockRestore();
  });

  it("opens on the visitor's own month and day", () => {
    render(<BudgetPlannerClient />);

    expect(screen.getAllByText("April 2026").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Expense date")).toHaveValue(toLocalDateKey(new Date()));
  });

  it("holds an expense to the month it is logged under", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<BudgetPlannerClient />);
    const date = screen.getByLabelText("Expense date");

    expect(date).toHaveAttribute("min", "2026-04-01");
    expect(date).toHaveAttribute("max", "2026-04-30");

    await user.type(screen.getByLabelText("Expense amount"), "20");
    fireEvent.change(date, { target: { value: "2026-05-01" } });

    expect(date).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Pick a date in April 2026.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Add expense" })).toBeDisabled();

    fireEvent.change(date, { target: { value: "2026-04-30" } });

    expect(screen.queryByText("Pick a date in April 2026.")).toBeNull();
    expect(screen.getByRole("button", { name: "Add expense" })).toBeEnabled();
  });

  it("puts the month, income, and savings target ahead of the envelopes and the figures", () => {
    const { container } = render(<BudgetPlannerClient />);
    const savings = screen.getByLabelText("Savings target");
    const follows = (node: Element | null) =>
      Boolean(node && savings.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING);

    expect(follows(screen.getByLabelText("Budget month"))).toBe(false);
    expect(follows(screen.getByLabelText("Monthly income"))).toBe(false);
    expect(follows(container.querySelector(".bp-sum-value"))).toBe(true);
    expect(follows(container.querySelector(".bp-envelope-grid"))).toBe(true);
  });
});
