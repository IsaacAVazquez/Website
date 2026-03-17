import { buildInvestmentSnapshot } from "../investmentSnapshot";

describe("buildInvestmentSnapshot", () => {
  it("normalizes sections and caps price/news output", () => {
    const rawPrice = Array.from({ length: 300 }, (_, index) => ({
      report_date: `2026-01-${String((index % 28) + 1).padStart(2, "0")}`,
      open: 100 + index,
      high: 101 + index,
      low: 99 + index,
      close: 100 + index,
      volume: 1000 + index,
    }));
    const rawNews = Array.from({ length: 25 }, (_, index) => ({
      uuid: `n-${index}`,
      title: `Headline ${index}`,
      publisher: "Test",
      report_date: "2026-03-16",
    }));

    const snapshot = buildInvestmentSnapshot("AAPL", "2026-03-16T08:00:00.000Z", {
      info: [
        {
          symbol: "AAPL",
          sector: "Technology",
          industry: "Consumer Electronics",
        },
      ],
      fundamentals: {
        ttmPe: [{ ttm_pe: 28.4 }],
        ttmEps: [{ tailing_eps: 7.12 }],
        marketCap: [{ market_capitalization: 2900000000000 }],
        psRatio: [{ ps_ratio: 7.9 }],
        pbRatio: [{ pb_ratio: 41.2 }],
        pegRatio: [{ peg_ratio: 2.1 }],
      },
      profitability: {
        roe: [{ roe: 0.33 }],
        roa: [{ roa: 0.19 }],
        roic: [{ roic: 0.28 }],
        equityMultiplier: [{ equity_multiplier: 2.7 }],
        assetTurnover: [{ asset_turnover: 0.8 }],
      },
      margins: {
        quarterly_gross: [{ gross_margin: 0.46 }],
        quarterly_operating: [{ operating_margin: 0.31 }],
        quarterly_net: [{ net_margin: 0.24 }],
        quarterly_ebitda: [{ ebitda_margin: 0.35 }],
        quarterly_fcf: [{ fcf_margin: 0.26 }],
      },
      growth: {
        annual_revenue: [{ yoy_growth: 0.085 }],
        annual_operating_income: [{ yoy_growth: 0.091 }],
        annual_net_income: [{ yoy_growth: 0.074 }],
        annual_fcf: [{ yoy_growth: 0.102 }],
        quarterly_eps: [{ yoy_growth: 0.066 }],
      },
      income_statement: { quarterly: [], annual: [] },
      balance_sheet: { quarterly: [], annual: [] },
      cash_flow: { quarterly: [], annual: [] },
      wacc: [{ wacc: 0.084, cost_of_equity: 0.1, cost_of_debt: 0.05, tax_rate_for_calcs: 0.21 }],
      industry: {
        ttm_pe: [{ industry_pe: 31.2 }],
        ps_ratio: [{ industry_ps_ratio: 8.4 }],
        pb_ratio: [{ industry_pb_ratio: 45.0 }],
        roe: [{ industry_roe: 0.24 }],
        roa: [{ industry_roa: 0.12 }],
        gross_margin: [{ industry_gross_margin: 0.39 }],
        ebitda_margin: [{ industry_ebitda_margin: 0.28 }],
        net_margin: [{ industry_net_margin: 0.18 }],
      },
      beta: [{ period: "5y", beta: 1.12 }],
      news: rawNews,
      price: rawPrice,
    });

    expect(snapshot.source).toBe("prefetched");
    expect(snapshot.sections.price).toHaveLength(252);
    expect(snapshot.sections.news).toHaveLength(10);
    expect(snapshot.capabilities.news).toBe(true);
    expect(snapshot.capabilities.price).toBe(true);
    expect(snapshot.sections.fundamentals).toMatchObject({ ttmPe: 28.4 });
  });
});
