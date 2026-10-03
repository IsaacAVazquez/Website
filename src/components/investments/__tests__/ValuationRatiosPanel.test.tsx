import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ValuationRatiosPanel } from "../ValuationRatiosPanel";

type HookState = {
  data: unknown;
  isLoading: boolean;
  error: string | null;
  isNotFetched: boolean;
  refetch: jest.Mock;
};

const sections: Record<string, Partial<HookState>> = {};
const refetch = jest.fn();
const calls: Array<[string | null, string]> = [];

jest.mock("@/hooks/useStockData", () => ({
  useStockData: (symbol: string | null, section: string) => {
    calls.push([symbol, section]);
    return { data: null, isLoading: false, error: null, isNotFetched: false, refetch, ...sections[section] };
  },
}));

beforeEach(() => {
  for (const key of Object.keys(sections)) delete sections[key];
  calls.length = 0;
  refetch.mockReset();
});

/** The row for one industry metric: [label, stock value, industry value, badge?]. */
function compareRow(label: string) {
  const labelEl = screen.getByText(label, { selector: "span" });
  const row = labelEl.parentElement as HTMLElement;
  const values = Array.from(row.querySelectorAll("p.text-sm")).map((p) => p.textContent);
  const badge = row.querySelector("span.text-xs");
  return { values, badge: badge?.textContent ?? null, badgeClass: badge?.className ?? "" };
}

describe("ValuationRatiosPanel with industry comparison", () => {
  it("compares each metric against the industry with units and a favorable side", () => {
    sections.industry = {
      data: [
        { metric: "P/E (TTM)", value: 28.4, industryAvg: 31.2 },
        { metric: "Gross margin", value: 46.1, industryAvg: 38 },
        { metric: "ROE", value: 10, industryAvg: 20 },
        { metric: "P/S ratio", value: 9, industryAvg: 4 },
      ],
    };
    render(<ValuationRatiosPanel symbol="AAPL" />);

    expect(screen.getByText("Valuation vs industry")).toBeInTheDocument();

    const pe = compareRow("P/E (TTM)");
    expect(pe.values).toEqual(["28.40", "31.20"]);
    expect(pe.badge).toBe("Below");
    expect(pe.badgeClass).toContain("--c97-positive"); // cheaper than peers reads favorable

    const margin = compareRow("Gross margin");
    expect(margin.values).toEqual(["46.10%", "38.00%"]);
    expect(margin.badge).toBe("Above");
    expect(margin.badgeClass).toContain("--c97-positive");

    const roe = compareRow("ROE");
    expect(roe.values).toEqual(["10.00%", "20.00%"]);
    expect(roe.badge).toBe("Below");
    expect(roe.badgeClass).toContain("--c97-negative");

    const ps = compareRow("P/S ratio");
    expect(ps.badge).toBe("Above");
    expect(ps.badgeClass).toContain("--c97-negative");

    expect(calls).toContainEqual(["AAPL", "industry"]);
  });

  it("reads a metric-keyed object and leaves out the badge when a side is missing", () => {
    sections.industry = {
      data: {
        WACC: { value: 8.4, industryAvg: 9.1 },
        Beta: 1.12,
      },
    };
    render(<ValuationRatiosPanel symbol="AAPL" />);

    const wacc = compareRow("WACC");
    expect(wacc.values).toEqual(["8.40%", "9.10%"]);
    expect(wacc.badge).toBe("Below");

    const beta = compareRow("Beta");
    expect(beta.values).toEqual(["1.12", "—"]);
    expect(beta.badge).toBeNull();
  });

  it("labels an unnamed row by position", () => {
    sections.industry = { data: [{ value: 3, industryAvg: 2 }] };
    render(<ValuationRatiosPanel symbol="AAPL" />);
    expect(compareRow("Metric 1").values).toEqual(["3.00", "2.00"]);
  });

  it("shows a loading status while industry data loads", () => {
    sections.industry = { isLoading: true };
    render(<ValuationRatiosPanel symbol="AAPL" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading valuation ratios");
  });

  it("shows the unavailable state with retry when there are no rows", () => {
    sections.industry = { data: [] };
    render(<ValuationRatiosPanel symbol="AAPL" />);
    expect(screen.getByText("Industry comparison data unavailable")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("shows the hook's error message", () => {
    sections.industry = { error: "Industry section failed" };
    render(<ValuationRatiosPanel symbol="AAPL" />);
    expect(screen.getByText("Industry section failed")).toBeInTheDocument();
  });
});

describe("ValuationRatiosPanel standalone", () => {
  function metricValue(label: string) {
    const labelEl = screen.getByText(label, { selector: "p" });
    return (labelEl.nextElementSibling as HTMLElement).textContent;
  }

  it("skips the industry fetch and shows the snapshot multiples", () => {
    sections.fundamentals = {
      data: { ttmPe: 28.444, psRatio: 7.9, pbRatio: 41.2, pegRatio: 2.1, marketCap: 2_900_000_000_000 },
    };
    sections.wacc = { data: { wacc: 8.4 } };
    sections.beta = { data: { beta5y: 1.125 } };
    render(<ValuationRatiosPanel symbol="AAPL" showIndustryComparison={false} />);

    expect(screen.getByText("Valuation snapshot")).toBeInTheDocument();
    expect(calls).toContainEqual([null, "industry"]);
    expect(metricValue("P/E (TTM)")).toBe("28.44");
    expect(metricValue("P/S ratio")).toBe("7.90");
    expect(metricValue("P/B ratio")).toBe("41.20");
    expect(metricValue("PEG ratio")).toBe("2.10");
    expect(metricValue("Beta (5Y)")).toBe("1.13");
    expect(metricValue("WACC")).toBe("8.40%");
    expect(metricValue("Market cap")).toBe("$2.9T");
  });

  it("prints dashes for every missing figure", () => {
    render(<ValuationRatiosPanel symbol="AAPL" showIndustryComparison={false} />);
    for (const label of ["P/E (TTM)", "P/S ratio", "P/B ratio", "PEG ratio", "Beta (5Y)", "WACC", "Market cap"]) {
      expect(metricValue(label)).toBe("—");
    }
  });
});
