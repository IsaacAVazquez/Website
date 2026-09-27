import { checkRegister, envelope } from "../envelopes";
import type { BudgetExpenseLine } from "@/types/budget";

function expense(overrides: Partial<BudgetExpenseLine>): BudgetExpenseLine {
  return {
    id: "exp-1",
    categoryId: "cat-1",
    categoryName: "Groceries",
    amount: 0,
    date: "2026-04-01",
    note: "",
    ...overrides,
  };
}

describe("envelope", () => {
  it("reads empty as no fill and not torn", () => {
    const result = envelope(0, 0);
    expect(result).toEqual({
      fill: 0,
      torn: false,
      overBy: 0,
      spentLabel: "$0",
      budgetLabel: "$0",
    });
  });

  it("fills fully and tears on a zero budget with any spend", () => {
    const result = envelope(45, 0);
    expect(result.fill).toBe(1);
    expect(result.torn).toBe(true);
    expect(result.overBy).toBe(45);
  });

  it("fills fully but stays sealed exactly at budget", () => {
    const result = envelope(600, 600);
    expect(result.fill).toBe(1);
    expect(result.torn).toBe(false);
    expect(result.overBy).toBe(0);
  });

  it("tears open once spend passes budget", () => {
    const result = envelope(720, 600);
    expect(result.fill).toBe(1);
    expect(result.torn).toBe(true);
    expect(result.overBy).toBe(120);
  });

  it("clamps the fill at one for an outlier expense far past budget", () => {
    const result = envelope(100_000, 500);
    expect(result.fill).toBe(1);
    expect(result.torn).toBe(true);
    expect(result.overBy).toBe(99_500);
  });

  it("reads a partial fill under budget", () => {
    const result = envelope(300, 500);
    expect(result.fill).toBe(0.6);
    expect(result.torn).toBe(false);
  });
});

describe("checkRegister", () => {
  it("returns no rows for an empty ledger", () => {
    expect(checkRegister(1000, [])).toEqual([]);
  });

  it("orders rows by date and runs the balance down from income", () => {
    const rows = checkRegister(1000, [
      expense({ id: "b", date: "2026-04-10", amount: 200 }),
      expense({ id: "a", date: "2026-04-01", amount: 100 }),
    ]);

    expect(rows.map((row) => row.id)).toEqual(["a", "b"]);
    expect(rows[0].balance).toBe(900);
    expect(rows[1].balance).toBe(700);
  });

  it("keeps insertion order stable for same-day expenses", () => {
    const rows = checkRegister(500, [
      expense({ id: "first", date: "2026-04-05", amount: 50 }),
      expense({ id: "second", date: "2026-04-05", amount: 25 }),
    ]);

    expect(rows.map((row) => row.id)).toEqual(["first", "second"]);
    expect(rows[0].balance).toBe(450);
    expect(rows[1].balance).toBe(425);
  });

  it("carries an outlier expense through to a negative balance without breaking", () => {
    const rows = checkRegister(1000, [expense({ id: "huge", date: "2026-04-01", amount: 50_000 })]);
    expect(rows[0].balance).toBe(-49_000);
  });
});
