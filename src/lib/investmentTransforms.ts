/**
 * Shared investment data transform functions.
 *
 * Used by both the API route (server-side) and useStockData hook (client-side)
 * to convert raw pre-fetched JSON into the shapes expected by UI components.
 */
import type { DcfData } from "@/types/investment";

type RawRecord = Record<string, unknown>;

/** Return the most recent non-null value for a field in a time-series array */
export function latest(arr: unknown, field: string): number | undefined {
  if (!Array.isArray(arr)) return undefined;
  const found = [...arr]
    .reverse()
    .find((r: RawRecord) => r[field] != null) as RawRecord | undefined;
  return found ? Number(found[field]) : undefined;
}

/** Allow transcript_{YEAR}_{QUARTER} dynamic sections */
export function isTranscriptSection(section: string): boolean {
  return /^transcript_\d{4}_\d{1,2}$/.test(section);
}

export function transformSection(section: string, raw: unknown): unknown {
  // --- fundamentals ---
  if (section === "fundamentals") {
    const d = raw as Record<string, unknown[]>;
    return {
      ttmEps: latest(d.ttmEps, "tailing_eps"),
      ttmPe: latest(d.ttmPe, "ttm_pe"),
      marketCap: latest(d.marketCap, "market_capitalization"),
      psRatio: latest(d.psRatio, "ps_ratio"),
      pbRatio: latest(d.pbRatio, "pb_ratio"),
      pegRatio: latest(d.pegRatio, "peg_ratio"),
    };
  }

  // --- profitability ---
  if (section === "profitability") {
    const d = raw as Record<string, unknown[]>;
    const roe = latest(d.roe, "roe");
    const roa = latest(d.roa, "roa");
    const roic = latest(d.roic, "roic");
    const equityMultiplier = latest(d.equityMultiplier, "equity_multiplier");
    const assetTurnover = latest(d.assetTurnover, "asset_turnover");
    return {
      roe: roe !== undefined ? roe * 100 : undefined,
      roa: roa !== undefined ? roa * 100 : undefined,
      roic: roic !== undefined ? roic * 100 : undefined,
      equityMultiplier: equityMultiplier !== undefined ? equityMultiplier * 100 : undefined,
      assetTurnover: assetTurnover !== undefined ? assetTurnover * 100 : undefined,
    };
  }

  // --- margins ---
  if (section === "margins") {
    const d = raw as Record<string, unknown[]>;
    const gm = latest(d.quarterly_gross, "gross_margin");
    const om = latest(d.quarterly_operating, "operating_margin");
    const nm = latest(d.quarterly_net, "net_margin");
    const em = latest(d.quarterly_ebitda, "ebitda_margin");
    const fm = latest(d.quarterly_fcf, "fcf_margin");
    return [
      {
        grossMargin: gm !== undefined ? gm * 100 : undefined,
        operatingMargin: om !== undefined ? om * 100 : undefined,
        netMargin: nm !== undefined ? nm * 100 : undefined,
        ebitdaMargin: em !== undefined ? em * 100 : undefined,
        fcfMargin: fm !== undefined ? fm * 100 : undefined,
      },
    ];
  }

  // --- growth ---
  if (section === "growth") {
    const d = raw as Record<string, unknown[]>;

    const latestGrowth = (arr: unknown[]): number | null => {
      if (!Array.isArray(arr)) return null;
      const rec = [...arr]
        .reverse()
        .find((r: unknown) => (r as RawRecord).yoy_growth != null) as RawRecord | undefined;
      return rec ? Number(rec.yoy_growth) * 100 : null;
    };

    const rows = [
      { metric: "Revenue YoY", yoyGrowth: latestGrowth(d.annual_revenue ?? []) },
      { metric: "Operating Income YoY", yoyGrowth: latestGrowth(d.annual_operating_income ?? []) },
      { metric: "Net Income YoY", yoyGrowth: latestGrowth(d.annual_net_income ?? []) },
      { metric: "FCF YoY", yoyGrowth: latestGrowth(d.annual_fcf ?? []) },
      { metric: "EPS YoY", yoyGrowth: latestGrowth(d.quarterly_eps ?? []) },
    ].filter((r) => r.yoyGrowth !== null);
    return rows;
  }

  // --- beta ---
  if (section === "beta") {
    const arr = raw as { beta: number; period: string }[];
    const by = (p: string) => arr.find((r) => r.period === p)?.beta;
    return { beta5y: by("5y"), beta3y: by("3y"), beta1y: by("1y") };
  }

  // --- wacc ---
  if (section === "wacc") {
    const arr = raw as RawRecord[];
    const rec = arr[arr.length - 1];
    return {
      wacc: rec?.wacc != null ? Number(rec.wacc) * 100 : undefined,
      costOfEquity: rec?.cost_of_equity != null ? Number(rec.cost_of_equity) * 100 : undefined,
      costOfDebt: rec?.cost_of_debt != null ? Number(rec.cost_of_debt) * 100 : undefined,
      taxRate: rec?.tax_rate_for_calcs != null ? Number(rec.tax_rate_for_calcs) * 100 : undefined,
      beta: rec?.beta_5y,
      marketCap: rec?.market_capitalization,
    };
  }

  // --- info ---
  if (section === "info") {
    const arr = raw as RawRecord[];
    const d = arr[0] ?? {};
    return {
      address: d.address,
      city: d.city,
      country: d.country,
      industry: d.industry,
      sector: d.sector,
      longBusinessSummary: d.long_business_summary,
      fullTimeEmployees: d.full_time_employees,
      website: d.web_site,
      shortName: d.symbol,
      longName: d.symbol,
    };
  }

  // --- financial statements (income_statement, balance_sheet, cash_flow) ---
  if (
    section === "income_statement" ||
    section === "balance_sheet" ||
    section === "cash_flow"
  ) {
    const d = raw as { quarterly?: RawRecord[]; annual?: RawRecord[] };
    return { quarterly: d.quarterly ?? [], annual: d.annual ?? [] };
  }

  // --- transcripts list ---
  if (section === "transcripts") {
    const arr = raw as { fiscal_year: number; fiscal_quarter: number; report_date: string }[];
    return arr.map((t) => ({
      fiscalYear: t.fiscal_year,
      fiscalQuarter: t.fiscal_quarter,
      date: t.report_date,
    }));
  }

  // --- individual transcript (transcript_YEAR_Q) ---
  if (isTranscriptSection(section)) {
    const arr = raw as { speaker: string; content: string }[];
    return {
      paragraphs: arr
        .filter((p) => p.content?.trim())
        .map((p) => ({ speaker: p.speaker, content: p.content })),
    };
  }

  // --- news ---
  if (section === "news") {
    const arr = raw as {
      uuid?: string;
      title: string;
      publisher?: string;
      report_date?: string;
      link?: string;
      type?: string;
    }[];
    return arr.map((n) => ({
      uuid: n.uuid,
      title: n.title,
      publisher: n.publisher,
      reportDate: n.report_date,
      link: n.link,
      type: n.type,
    }));
  }

  // Pass through all other sections unchanged (price, officers, revenue_segments)
  return raw;
}

export function transformIndustryWithStockValues(
  industryRaw: unknown,
  fundRaw: unknown,
  profRaw: unknown,
  marginsRaw: unknown,
): unknown {
  const fund = transformSection("fundamentals", fundRaw ?? {}) as Record<string, number | undefined>;
  const prof = transformSection("profitability", profRaw ?? {}) as Record<string, number | undefined>;
  const margins = transformSection("margins", marginsRaw ?? {}) as Array<Record<string, number | undefined>>;
  const marginRow = margins[0] ?? {};

  const d = industryRaw as Record<string, RawRecord[]>;

  const fieldMap: {
    key: string;
    label: string;
    valueField: string;
    isRatio?: boolean;
    stockValue: number | undefined;
  }[] = [
    { key: "ttm_pe",       label: "P/E (TTM)",      valueField: "industry_pe",            stockValue: fund.ttmPe },
    { key: "ps_ratio",     label: "P/S Ratio",      valueField: "industry_ps_ratio",       stockValue: fund.psRatio },
    { key: "pb_ratio",     label: "P/B Ratio",      valueField: "industry_pb_ratio",       stockValue: fund.pbRatio },
    { key: "roe",          label: "ROE",             valueField: "industry_roe",    isRatio: true, stockValue: prof.roe },
    { key: "roa",          label: "ROA",             valueField: "industry_roa",    isRatio: true, stockValue: prof.roa },
    { key: "gross_margin", label: "Gross Margin",   valueField: "industry_gross_margin",   isRatio: true, stockValue: marginRow.grossMargin },
    { key: "ebitda_margin",label: "EBITDA Margin",  valueField: "industry_ebitda_margin",  isRatio: true, stockValue: marginRow.ebitdaMargin },
    { key: "net_margin",   label: "Net Margin",     valueField: "industry_net_margin",     isRatio: true, stockValue: marginRow.netMargin },
  ];

  return fieldMap
    .map(({ key, label, valueField, isRatio, stockValue }) => {
      const arr = d[key];
      const val = latest(arr, valueField);
      const industryAvg = val !== undefined && isRatio ? val * 100 : val;
      return { metric: label, value: stockValue, industryAvg };
    })
    .filter((r) => r.industryAvg !== undefined);
}

export function computeDcf(
  waccRaw: unknown,
  fundRaw: unknown,
  growthRaw: unknown,
  priceRaw: unknown,
): DcfData {
  if (!waccRaw || !fundRaw || !growthRaw || !priceRaw) {
    return { error: "Insufficient data for DCF calculation" };
  }

  const waccArr = waccRaw as RawRecord[];
  const waccRec = waccArr[waccArr.length - 1];
  const wacc = waccRec?.wacc != null ? Number(waccRec.wacc) : undefined;

  const fundData = fundRaw as Record<string, unknown[]>;
  const baseFCF = latest(fundData.ttmEps, "tailing_eps");

  const growthData = growthRaw as Record<string, unknown[]>;
  const epsArr = growthData.quarterly_eps ?? [];
  const latestEpsGrowthRec = [...epsArr]
    .reverse()
    .find((r: unknown) => (r as RawRecord).yoy_growth != null) as RawRecord | undefined;
  const rawGrowth = latestEpsGrowthRec ? Number(latestEpsGrowthRec.yoy_growth) : 0;
  const gShort = Math.max(-0.3, Math.min(0.5, rawGrowth));

  const priceArr = priceRaw as RawRecord[];
  const currentPrice =
    priceArr.length > 0 ? Number(priceArr[priceArr.length - 1].close) : undefined;

  if (!wacc || !baseFCF || !currentPrice) {
    return { error: "Insufficient data for DCF calculation" };
  }

  const gTerminal = 0.03;
  const effectiveWacc = Math.max(wacc, gTerminal + 0.01);

  let fcf = baseFCF;
  let pvSum = 0;
  for (let i = 1; i <= 5; i++) {
    const g = gShort + (gTerminal - gShort) * (i / 5);
    fcf = fcf * (1 + g);
    pvSum += fcf / Math.pow(1 + effectiveWacc, i);
  }
  const terminalValue = (fcf * (1 + gTerminal)) / (effectiveWacc - gTerminal);
  const pvTerminal = terminalValue / Math.pow(1 + effectiveWacc, 5);
  const fairValue = pvSum + pvTerminal;
  const upside = ((fairValue - currentPrice) / currentPrice) * 100;
  const recommendation = upside > 20 ? "Buy" : upside < -10 ? "Sell" : "Hold";

  return {
    fairValue: Math.round(fairValue * 100) / 100,
    currentPrice: Math.round(currentPrice * 100) / 100,
    upside: Math.round(upside * 100) / 100,
    wacc: Math.round(effectiveWacc * 10000) / 100,
    growthEstimates: {
      "Near-term growth (Yrs 1-3)": Math.round(gShort * 10000) / 100,
      "Terminal growth": 3.0,
    },
    recommendation,
  };
}
