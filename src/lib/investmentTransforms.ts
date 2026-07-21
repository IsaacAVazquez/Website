/**
 * Shared investment data transform functions.
 *
 * Used by both the API route (server-side) and useStockData hook (client-side)
 * to convert raw pre-fetched JSON into the shapes expected by UI components.
 */
import { getCuratedCompanyName } from "@/lib/investmentCompanyNames";

type RawRecord = Record<string, unknown>;

function pickString(record: RawRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function resolveCompanyName(
  symbol: string | undefined,
  preferredName: string | undefined,
  fallbackName?: string
): string | undefined {
  const normalizedSymbol = symbol?.trim().toUpperCase();
  const trimmedPreferredName = preferredName?.trim();
  if (
    trimmedPreferredName &&
    trimmedPreferredName.length > 0 &&
    trimmedPreferredName.toUpperCase() !== normalizedSymbol
  ) {
    return trimmedPreferredName;
  }

  const trimmedFallbackName = fallbackName?.trim();
  if (
    trimmedFallbackName &&
    trimmedFallbackName.length > 0 &&
    trimmedFallbackName.toUpperCase() !== normalizedSymbol
  ) {
    return trimmedFallbackName;
  }

  return getCuratedCompanyName(normalizedSymbol);
}

/** Return the most recent non-null value for a field in a time-series array */
export function latest(arr: unknown, field: string): number | undefined {
  if (!Array.isArray(arr)) return undefined;
  const found = [...arr]
    .reverse()
    .find((r: RawRecord) => r[field] != null) as RawRecord | undefined;
  if (!found) return undefined;
  // Guard against dirty snapshot values (e.g. "N/A"): Number() would yield NaN,
  // which slips past downstream `!= null` checks and renders as a broken figure.
  const value = Number(found[field]);
  return Number.isFinite(value) ? value : undefined;
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
    // Equity multiplier and asset turnover are plain ratios (e.g. 3.9×, 0.8×),
    // not fractions of one — unlike the return metrics, they must not be
    // scaled to percentage units.
    const equityMultiplier = latest(d.equityMultiplier, "equity_multiplier");
    const assetTurnover = latest(d.assetTurnover, "asset_turnover");
    return {
      roe: roe !== undefined ? roe * 100 : undefined,
      roa: roa !== undefined ? roa * 100 : undefined,
      roic: roic !== undefined ? roic * 100 : undefined,
      equityMultiplier,
      assetTurnover,
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
    const symbol = pickString(d, ["symbol", "ticker"]);
    const providerShortName = pickString(d, [
      "short_name",
      "shortName",
      "display_name",
      "displayName",
      "company_name",
      "companyName",
      "name",
      "long_name",
      "longName",
      "symbol",
    ]);
    const providerLongName = pickString(d, [
      "long_name",
      "longName",
      "company_name",
      "companyName",
      "display_name",
      "displayName",
      "name",
      "short_name",
      "shortName",
      "symbol",
    ]);
    const shortName = resolveCompanyName(symbol, providerShortName, providerLongName) ?? symbol;
    const longName = resolveCompanyName(symbol, providerLongName, shortName) ?? shortName ?? symbol;

    return {
      address: d.address ?? d.street_address,
      city: d.city,
      country: d.country,
      industry: d.industry,
      sector: d.sector,
      longBusinessSummary: d.long_business_summary ?? d.longBusinessSummary,
      fullTimeEmployees: d.full_time_employees ?? d.fullTimeEmployees,
      website: d.web_site ?? d.website,
      shortName: shortName ?? symbol,
      longName: longName ?? shortName ?? symbol,
    };
  }

  // --- financial statements (income_statement, balance_sheet, cash_flow) ---
  if (
    section === "income_statement" ||
    section === "balance_sheet" ||
    section === "cash_flow"
  ) {
    const d = raw as { quarterly?: RawRecord[]; annual?: RawRecord[] };
    return {
      quarterly: Array.isArray(d.quarterly) ? d.quarterly : [],
      annual: Array.isArray(d.annual) ? d.annual : [],
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

  // Pass through all other sections unchanged (price and officers).
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
